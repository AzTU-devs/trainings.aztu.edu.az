"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { loginSchema, type LoginInput } from "../schemas";
import { useLogin, useLogout } from "../hooks";
import { FieldError, FormAlert, PasswordInput, readAuthError } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { env } from "@/lib/env";
import { isPortalUser } from "@/lib/auth/roles";

/**
 * The post-login destination from ?next=, only if it is a path on this site.
 *
 * router.replace() hard-navigates to anything absolute, so an unchecked value
 * turned the login page into an open redirect: a link to
 * /az/login?next=https://evil.example (or //evil.example) sent the user off-site
 * the moment they signed in, straight after typing their password into our page.
 * A leading "//" or "/\\" is protocol-relative to a browser, hence refused too.
 */
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const locale = useLocale();
  const next = safeNext(params.get("next")) ?? localeHref(locale, "/dashboard");
  const login = useLogin();
  const logout = useLogout();
  // The form-level error. It is cleared on each submit, so a retry that fails
  // the same way inserts the alert afresh and is announced again.
  const [failure, setFailure] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setFailure(null);
    login.mutate(values, {
      onSuccess: (data) => {
        // Tutors / admins belong to the portal app, not the public site.
        if (isPortalUser(data.user.roles)) {
          logout.mutate(); // clear the session cookie we just set
          toast.info(t("auth.portalRedirect"));
          window.location.href = env.NEXT_PUBLIC_PORTAL_URL;
          return;
        }
        toast.success(t("auth.welcome"));
        router.replace(next);
      },
      onError: (error) => {
        const { message, fields } = readAuthError(error, t, {
          byCode: { INVALID_CREDENTIALS: "auth.invalidCredentials" },
          byStatus: { 401: "auth.invalidCredentials" },
          fallback: "auth.loginFailed",
        });
        for (const fe of fields) {
          form.setError(fe.field as keyof LoginInput, { type: "server", message: fe.message });
        }
        setFailure(message);
      },
    });
  };

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <Field id="email" label={t("auth.email")}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          {...form.register("email")}
        />
        <FieldError error={errors.email} />
      </Field>
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Link
            href={localeHref(locale, "/forgot-password")}
            // The padding grows the tap target to 40px; the negative margin
            // keeps the label row at its text height.
            className="link -my-2.5 py-2.5 text-sm text-ink-2"
          >
            {t("auth.forgotLink")}
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          {...form.register("password")}
        />
        <FieldError error={errors.password} />
      </div>
      <FormAlert message={failure} />
      <Button type="submit" className="mt-2 w-full" loading={login.isPending}>
        {t("common.signIn")}
        <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
      </Button>
    </form>
  );
}

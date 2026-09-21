"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "../schemas";
import { useLogin, useLogout } from "../hooks";
import { FieldError } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { env } from "@/lib/env";
import { isPortalUser } from "@/lib/auth/roles";
import type { ApiError } from "@/types/api";

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

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) =>
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
        const err = error as unknown as ApiError;
        if (err.errors) {
          for (const fe of err.errors) {
            form.setError(fe.field as keyof LoginInput, { message: fe.message });
          }
        }
        toast.error(err.message ?? t("auth.loginFailed"));
      },
    });

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          className={invalidField}
          {...form.register("email")}
        />
        <FieldError error={errors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Link
            href={localeHref(locale, "/forgot-password")}
            // The padding grows the tap target to 40px; the negative margin
            // keeps the label row at its text height.
            className="-my-2.5 inline-flex items-center py-2.5 text-[13px] font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("auth.forgotLink")}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          className={invalidField}
          {...form.register("password")}
        />
        <FieldError error={errors.password} />
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full" loading={login.isPending}>
        {t("common.signIn")}
      </Button>
    </form>
  );
}

/** A field with an error gets a red edge, so the problem is visible at the input itself. */
const invalidField =
  "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/15";

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "../schemas";
import { useLogin, useLogout } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/common/FormError";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { env } from "@/lib/env";
import { isPortalUser } from "@/lib/auth/roles";
import type { ApiError } from "@/types/api";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const locale = useLocale();
  const next = params.get("next") ?? localeHref(locale, "/dashboard");
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...form.register("email")}
        />
        <FormError message={form.formState.errors.email?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        <FormError message={form.formState.errors.password?.message} />
      </div>
      <Button type="submit" className="w-full" loading={login.isPending}>
        {t("common.signIn")}
      </Button>
    </form>
  );
}

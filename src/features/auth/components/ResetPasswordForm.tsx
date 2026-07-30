"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { useResetPassword } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/common/FormError";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import type { ApiError } from "@/types/api";

type Status = "form" | "success" | "invalid";

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useT();
  const locale = useLocale();
  const reset = useResetPassword();
  const [status, setStatus] = useState<Status>(token ? "form" : "invalid");

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: ResetPasswordInput) => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    reset.mutate(
      { token, password: values.password },
      {
        onSuccess: () => setStatus("success"),
        onError: (error) => {
          const err = error as unknown as ApiError;
          // A bad/expired token is a 400 — treat it as "invalid". Field errors
          // (e.g. a weak password the server rejected) stay on the form.
          if (err.status === 400 && !err.errors) {
            setStatus("invalid");
            return;
          }
          if (err.errors) {
            for (const fe of err.errors) {
              form.setError(fe.field as keyof ResetPasswordInput, {
                message: fe.message,
              });
            }
          } else {
            form.setError("password", {
              message: err.message ?? t("auth.resetError"),
            });
          }
        },
      },
    );
  };

  if (status === "success") {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-5" />
        </div>
        <h2 className="text-sm font-semibold">{t("auth.resetSuccessTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("auth.resetSuccessBody")}
        </p>
        <Link href={localeHref(locale, "/login")} className="block">
          <Button className="w-full">{t("common.signIn")}</Button>
        </Link>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="text-sm font-semibold">{t("auth.resetInvalidTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("auth.resetInvalidBody")}
        </p>
        <Link href={localeHref(locale, "/forgot-password")} className="block">
          <Button variant="outline" className="w-full">
            {t("auth.resetRequestNew")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.newPassword")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
        <FormError message={form.formState.errors.password?.message} />
        <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        <FormError message={form.formState.errors.confirmPassword?.message} />
      </div>
      <Button type="submit" className="w-full" loading={reset.isPending}>
        {t("auth.resetSubmit")}
      </Button>
    </form>
  );
}

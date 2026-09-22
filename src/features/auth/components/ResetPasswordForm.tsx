"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { useResetPassword } from "../hooks";
import { FieldError, PasswordInput, StatusPanel, readAuthError } from "./FieldError";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

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
          // The BFF call rejects with a raw AxiosError: normalised, its status
          // and field errors come from the API's body.
          const err = normalizeError(error);
          // A bad/expired token is a 400 — treat it as "invalid". Field errors
          // (e.g. a weak password the server rejected) stay on the form.
          if (err.status === 400 && !err.errors) {
            setStatus("invalid");
            return;
          }
          if (err.errors) {
            for (const fe of err.errors) {
              form.setError(fe.field as keyof ResetPasswordInput, {
                type: "server",
                message: fe.message,
              });
            }
          } else {
            // In the reader's words (throttling included), never axios's
            // "Request failed with status code …".
            const { message } = readAuthError(error, t, { fallback: "auth.resetError" });
            form.setError("password", { message });
          }
        },
      },
    );
  };

  if (status === "success") {
    return (
      <div className="grid gap-8">
        <StatusPanel tone="done" icon={<Check strokeWidth={2} />} title={t("auth.resetSuccessTitle")}>
          <p>{t("auth.resetSuccessBody")}</p>
        </StatusPanel>
        <Link href={localeHref(locale, "/login")} className={cn(buttonVariants(), "w-full")}>
          {t("common.signIn")}
          <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="grid gap-8">
        <StatusPanel tone="danger" icon={<TriangleAlert />} title={t("auth.resetInvalidTitle")}>
          <p>{t("auth.resetInvalidBody")}</p>
        </StatusPanel>
        <Link
          href={localeHref(locale, "/forgot-password")}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          {t("auth.resetRequestNew")}
        </Link>
      </div>
    );
  }

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <Field id="password" label={t("auth.newPassword")}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
          {...form.register("password")}
        />
        <FieldError id="password-error" error={errors.password} />
        {/* The rule is stated once: the error replaces the hint while it shows. */}
        {errors.password ? null : (
          <p id="password-hint" className="t-meta">
            {t("auth.passwordHint")}
          </p>
        )}
      </Field>
      <Field id="confirmPassword" label={t("auth.confirmPassword")}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          {...form.register("confirmPassword")}
        />
        <FieldError error={errors.confirmPassword} />
      </Field>
      <Button type="submit" className="mt-2 w-full" loading={reset.isPending}>
        {t("auth.resetSubmit")}
        <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
      </Button>
    </form>
  );
}

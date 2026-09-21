"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { useResetPassword } from "../hooks";
import { FieldError } from "./FieldError";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
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
      <div className="space-y-6">
        <StatusPanel tone="success" icon={<CheckCircle2 />} title={t("auth.resetSuccessTitle")}>
          <p>{t("auth.resetSuccessBody")}</p>
        </StatusPanel>
        <Link
          href={localeHref(locale, "/login")}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-6">
        <StatusPanel tone="danger" icon={<AlertTriangle />} title={t("auth.resetInvalidTitle")}>
          <p>{t("auth.resetInvalidBody")}</p>
        </StatusPanel>
        <Link
          href={localeHref(locale, "/forgot-password")}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        >
          {t("auth.resetRequestNew")}
        </Link>
      </div>
    );
  }

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("auth.newPassword")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
          className={invalidField}
          {...form.register("password")}
        />
        <FieldError id="password-error" error={errors.password} />
        {/* The rule is stated once: the error replaces the hint while it shows. */}
        {errors.password ? null : (
          <p id="password-hint" className="text-xs leading-relaxed text-muted-foreground">
            {t("auth.passwordHint")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirmPassword ? true : undefined}
          className={invalidField}
          {...form.register("confirmPassword")}
        />
        <FieldError error={errors.confirmPassword} />
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full" loading={reset.isPending}>
        {t("auth.resetSubmit")}
      </Button>
    </form>
  );
}

/** A field with an error gets a red edge, so the problem is visible at the input itself. */
const invalidField =
  "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/15";

/**
 * The outcome of a step (link sent, password changed, token rejected) shown
 * in place of the form: a tinted icon, a title and one line of explanation.
 */
function StatusPanel({
  tone,
  icon,
  title,
  children,
}: {
  tone: "primary" | "success" | "danger";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-4 rounded-2xl border border-border/80 bg-muted/50 p-5"
    >
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl [&_svg]:size-5",
          tone === "primary" &&
            "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
          tone === "success" && "bg-success/10 text-success",
          tone === "danger" && "bg-destructive/10 text-destructive",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 space-y-1 pt-0.5">
        <h2 className="font-display text-base leading-snug">{title}</h2>
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

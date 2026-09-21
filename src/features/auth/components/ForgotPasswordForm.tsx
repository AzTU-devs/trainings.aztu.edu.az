"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { useForgotPassword } from "../hooks";
import { FieldError } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

export function ForgotPasswordForm() {
  const t = useT();
  const forgot = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordInput) =>
    // Always resolve to the same confirmation — never reveal whether the
    // account exists (no account enumeration). The BFF always returns 202.
    forgot.mutate(values, {
      onSettled: () => setSubmittedEmail(values.email),
    });

  if (submittedEmail) {
    return (
      <StatusPanel tone="primary" icon={<MailCheck />} title={t("auth.forgotSentTitle")}>
        <p className="break-words">{t("auth.forgotSentBody", { email: submittedEmail })}</p>
      </StatusPanel>
    );
  }

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
      <Button type="submit" size="lg" className="mt-2 w-full" loading={forgot.isPending}>
        {t("auth.forgotSubmit")}
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

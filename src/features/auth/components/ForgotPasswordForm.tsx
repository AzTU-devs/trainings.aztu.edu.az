"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { useForgotPassword } from "../hooks";
import { FieldError, StatusPanel } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";

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
      <StatusPanel tone="done" icon={<Check strokeWidth={2} />} title={t("auth.forgotSentTitle")}>
        <p>{t("auth.forgotSentBody", { email: submittedEmail })}</p>
      </StatusPanel>
    );
  }

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
      <Button type="submit" className="mt-2 w-full" loading={forgot.isPending}>
        {t("auth.forgotSubmit")}
        <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
      </Button>
    </form>
  );
}

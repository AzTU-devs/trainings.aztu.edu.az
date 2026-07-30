"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { useForgotPassword } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/common/FormError";
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
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-5" />
        </div>
        <h2 className="text-sm font-semibold">{t("auth.forgotSentTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("auth.forgotSentBody", { email: submittedEmail })}
        </p>
      </div>
    );
  }

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
      <Button type="submit" className="w-full" loading={forgot.isPending}>
        {t("auth.forgotSubmit")}
      </Button>
    </form>
  );
}

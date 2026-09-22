"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { registerSchema, type RegisterInput } from "../schemas";
import { useRegister } from "../hooks";
import { FieldError, FormAlert, PasswordInput, readAuthError } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";

export function RegisterForm() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const register = useRegister();
  // The form-level error, cleared on each submit (see LoginForm).
  const [failure, setFailure] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      locale,
    },
  });

  const onSubmit = (values: RegisterInput) => {
    const payload = { ...values, phone: values.phone || undefined };
    setFailure(null);
    register.mutate(payload, {
      onSuccess: () => {
        toast.success(t("auth.accountCreated"));
        router.replace(localeHref(locale, "/dashboard"));
      },
      onError: (error) => {
        const { message, fields } = readAuthError(error, t, {
          byCode: { EMAIL_ALREADY_REGISTERED: "auth.emailTaken" },
          byStatus: { 409: "auth.emailTaken" },
          fallback: "auth.registerFailed",
        });
        for (const fe of fields) {
          form.setError(fe.field as keyof RegisterInput, { type: "server", message: fe.message });
        }
        setFailure(message);
      },
    });
  };

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Field id="firstName" label={t("auth.firstName")}>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={errors.firstName ? true : undefined}
            {...form.register("firstName")}
          />
          <FieldError error={errors.firstName} />
        </Field>
        <Field id="lastName" label={t("auth.lastName")}>
          <Input
            id="lastName"
            autoComplete="family-name"
            aria-invalid={errors.lastName ? true : undefined}
            {...form.register("lastName")}
          />
          <FieldError error={errors.lastName} />
        </Field>
      </div>
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
      {/* Password and its confirmation side by side, as on the expert
          application, so both sign-up pages share one width and layout. */}
      <div className="grid gap-2">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <Field id="password" label={t("auth.password")}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
              {...form.register("password")}
            />
            <FieldError id="password-error" error={errors.password} />
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
        </div>
        {/* The rule is stated once: the error replaces the hint while it shows. */}
        {errors.password ? null : (
          <p id="password-hint" className="t-meta">
            {t("auth.passwordHint")}
          </p>
        )}
      </div>
      <FormAlert message={failure} />
      <Button type="submit" className="mt-2 w-full" loading={register.isPending}>
        {t("common.signUp")}
        <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
      </Button>
    </form>
  );
}

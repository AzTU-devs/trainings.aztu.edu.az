"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "../schemas";
import { useRegister } from "../hooks";
import { FieldError } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import type { ApiError } from "@/types/api";

export function RegisterForm() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const register = useRegister();

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
    register.mutate(payload, {
      onSuccess: () => {
        toast.success(t("auth.accountCreated"));
        router.replace(localeHref(locale, "/dashboard"));
      },
      onError: (error) => {
        const err = error as unknown as ApiError;
        if (err.errors) {
          for (const fe of err.errors) {
            form.setError(fe.field as keyof RegisterInput, {
              message: fe.message,
            });
          }
        }
        toast.error(err.message ?? t("auth.registerFailed"));
      },
    });
  };

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">{t("auth.firstName")}</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={errors.firstName ? true : undefined}
            className={invalidField}
            {...form.register("firstName")}
          />
          <FieldError error={errors.firstName} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">{t("auth.lastName")}</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            aria-invalid={errors.lastName ? true : undefined}
            className={invalidField}
            {...form.register("lastName")}
          />
          <FieldError error={errors.lastName} />
        </div>
      </div>
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
      {/* Password and its confirmation side by side, as on the expert
          application, so both sign-up cards share one width and layout. */}
      <div className="flex flex-col gap-2">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
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
        </div>
        {/* The rule is stated once: the error replaces the hint while it shows. */}
        {errors.password ? null : (
          <p id="password-hint" className="text-xs leading-relaxed text-muted-foreground">
            {t("auth.passwordHint")}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full" loading={register.isPending}>
        {t("common.signUp")}
      </Button>
    </form>
  );
}

/** A field with an error gets a red edge, so the problem is visible at the input itself. */
const invalidField =
  "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/15";

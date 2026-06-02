"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "../schemas";
import { useRegister } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/common/FormError";
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("auth.firstName")}</Label>
          <Input id="firstName" {...form.register("firstName")} />
          <FormError message={form.formState.errors.firstName?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t("auth.lastName")}</Label>
          <Input id="lastName" {...form.register("lastName")} />
          <FormError message={form.formState.errors.lastName?.message} />
        </div>
      </div>
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
      <Button type="submit" className="w-full" loading={register.isPending}>
        {t("common.signUp")}
      </Button>
    </form>
  );
}

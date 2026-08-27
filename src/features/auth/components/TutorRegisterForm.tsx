"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  tutorRegisterSchema,
  tutorOtpSchema,
  type TutorRegisterInput,
  type TutorOtpInput,
} from "../schemas";
import { useTutorRegisterStart, useTutorRegisterVerify } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/common/FormError";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import type { ApiError } from "@/types/api";
import type { Category } from "@/features/category/types";

export function TutorRegisterForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const start = useTutorRegisterStart();
  const verify = useTutorRegisterVerify();

  const [phase, setPhase] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");

  const form = useForm<TutorRegisterInput>({
    resolver: zodResolver(tutorRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      locale,
      headline: "",
      bio: "",
      websiteUrl: "",
      linkedinUrl: "",
      categoryIds: [],
    },
  });

  const otpForm = useForm<TutorOtpInput>({
    resolver: zodResolver(tutorOtpSchema),
    defaultValues: { otp: "" },
  });

  const selected = useWatch({ control: form.control, name: "categoryIds" });

  const toggleCategory = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
    form.setValue("categoryIds", next, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onStart = (values: TutorRegisterInput) => {
    const payload: TutorRegisterInput = {
      ...values,
      phone: values.phone || undefined,
      headline: values.headline || undefined,
      bio: values.bio || undefined,
      websiteUrl: values.websiteUrl || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
    };
    start.mutate(payload, {
      onSuccess: () => {
        setEmail(values.email);
        setPhase("otp");
        toast.success(t("auth.otpSent"));
      },
      onError: (error) => {
        const err = error as unknown as ApiError;
        if (err.errors) {
          for (const fe of err.errors) {
            form.setError(fe.field as keyof TutorRegisterInput, {
              message: fe.message,
            });
          }
        }
        toast.error(err.message ?? t("auth.registerFailed"));
      },
    });
  };

  const onVerify = (values: TutorOtpInput) => {
    verify.mutate(
      { email, otp: values.otp },
      {
        onSuccess: () => {
          toast.success(t("auth.tutorApplicationSubmitted"));
          router.replace(localeHref(locale, "/login"));
        },
        onError: (error) => {
          const err = error as unknown as ApiError;
          otpForm.setError("otp", {
            message: err.message ?? t("auth.otpInvalid"),
          });
          toast.error(err.message ?? t("auth.otpInvalid"));
        },
      },
    );
  };

  if (phase === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("auth.otpSubtitle")}{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="otp">{t("auth.otpLabel")}</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            {...otpForm.register("otp")}
          />
          <FormError message={otpForm.formState.errors.otp?.message} />
        </div>
        <Button type="submit" className="w-full" loading={verify.isPending}>
          {t("auth.otpVerifyCta")}
        </Button>
        <button
          type="button"
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setPhase("form")}
        >
          {t("auth.otpBack")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onStart)} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          <FormError message={form.formState.errors.password?.message} />
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
      </div>
      <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("auth.phone")}</Label>
          <Input id="phone" {...form.register("phone")} />
          <FormError message={form.formState.errors.phone?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yearsExperience">{t("auth.yearsExperience")}</Label>
          <Input
            id="yearsExperience"
            type="number"
            min={0}
            {...form.register("yearsExperience", {
              setValueAs: (v) => (v === "" ? undefined : Number(v)),
            })}
          />
          <FormError message={form.formState.errors.yearsExperience?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline">{t("auth.headline")}</Label>
        <Input
          id="headline"
          placeholder={t("auth.headlinePlaceholder")}
          {...form.register("headline")}
        />
        <FormError message={form.formState.errors.headline?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("auth.bio")}</Label>
        <textarea
          id="bio"
          rows={4}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          {...form.register("bio")}
        />
        <FormError message={form.formState.errors.bio?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="websiteUrl">{t("auth.websiteUrl")}</Label>
          <Input
            id="websiteUrl"
            type="url"
            placeholder="https://"
            {...form.register("websiteUrl")}
          />
          <FormError message={form.formState.errors.websiteUrl?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="linkedinUrl">{t("auth.linkedinUrl")}</Label>
          <Input
            id="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            {...form.register("linkedinUrl")}
          />
          <FormError message={form.formState.errors.linkedinUrl?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("auth.expertise")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("auth.expertiseHint")}
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = selected.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {c.name}
              </button>
            );
          })}
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t("auth.expertiseEmpty")}
            </p>
          )}
        </div>
        <FormError message={form.formState.errors.categoryIds?.message} />
      </div>

      <Button type="submit" className="w-full" loading={start.isPending}>
        {t("auth.tutorApplyCta")}
      </Button>
    </form>
  );
}

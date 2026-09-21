"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, MailCheck } from "lucide-react";
import {
  tutorRegisterSchema,
  tutorOtpSchema,
  type TutorRegisterInput,
  type TutorOtpInput,
} from "../schemas";
import { useTutorRegisterStart, useTutorRegisterVerify } from "../hooks";
import { FieldError } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-6">
        <div className="flex items-start gap-4 rounded-2xl border border-border/80 bg-muted/50 p-5">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
          >
            <MailCheck className="size-5" />
          </span>
          <p className="min-w-0 pt-0.5 text-sm leading-relaxed text-muted-foreground">
            {t("auth.otpSubtitle")}{" "}
            <span className="break-words font-semibold text-foreground">{email}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="otp">{t("auth.otpLabel")}</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-invalid={otpForm.formState.errors.otp ? true : undefined}
            // The letter-spacing trails the last digit too; the matching left
            // indent keeps the code optically centred.
            className={cn(
              "h-14 pl-[calc(1rem+0.45em)] text-center text-2xl font-semibold tabular-nums tracking-[0.45em] placeholder:text-muted-foreground/40",
              invalidField,
            )}
            {...otpForm.register("otp")}
          />
          <FieldError error={otpForm.formState.errors.otp} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={verify.isPending}>
          {t("auth.otpVerifyCta")}
        </Button>
        <button
          type="button"
          className="mx-auto flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => setPhase("form")}
        >
          {t("auth.otpBack")}
        </button>
      </form>
    );
  }

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onStart)} className="space-y-10">
      <FormSection step={1} title={t("auth.tutorSectionAccount")} hint={t("auth.tutorSectionAccountHint")}>
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

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
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
          <div className="flex flex-col gap-2">
            <OptionalLabel htmlFor="phone" optional={t("auth.optional")}>
              {t("auth.phone")}
            </OptionalLabel>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={errors.phone ? true : undefined}
              className={invalidField}
              {...form.register("phone")}
            />
            <FieldError error={errors.phone} />
          </div>
        </div>

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
      </FormSection>

      <FormSection step={2} title={t("auth.tutorSectionProfile")} hint={t("auth.tutorSectionProfileHint")}>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-2">
            <OptionalLabel htmlFor="headline" optional={t("auth.optional")}>
              {t("auth.headline")}
            </OptionalLabel>
            <Input
              id="headline"
              placeholder={t("auth.headlinePlaceholder")}
              aria-invalid={errors.headline ? true : undefined}
              className={invalidField}
              {...form.register("headline")}
            />
            <FieldError error={errors.headline} />
          </div>
          <div className="flex flex-col gap-2">
            <OptionalLabel htmlFor="yearsExperience" optional={t("auth.optional")}>
              {t("auth.yearsExperience")}
            </OptionalLabel>
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              aria-invalid={errors.yearsExperience ? true : undefined}
              className={invalidField}
              {...form.register("yearsExperience", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            <FieldError error={errors.yearsExperience} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <OptionalLabel htmlFor="bio" optional={t("auth.optional")}>
            {t("auth.bio")}
          </OptionalLabel>
          <textarea
            id="bio"
            rows={5}
            aria-invalid={errors.bio ? true : undefined}
            // Mirrors the Input primitive so the textarea reads as the same control.
            className={cn(
              "flex min-h-32 w-full resize-y rounded-2xl border border-input bg-card px-4 py-3 text-sm leading-relaxed transition-[border-color,box-shadow]",
              "placeholder:text-muted-foreground",
              "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
              "disabled:cursor-not-allowed disabled:opacity-50",
              invalidField,
            )}
            {...form.register("bio")}
          />
          <FieldError error={errors.bio} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col gap-2">
            <OptionalLabel htmlFor="websiteUrl" optional={t("auth.optional")}>
              {t("auth.websiteUrl")}
            </OptionalLabel>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://"
              aria-invalid={errors.websiteUrl ? true : undefined}
              className={invalidField}
              {...form.register("websiteUrl")}
            />
            <FieldError error={errors.websiteUrl} />
          </div>
          <div className="flex flex-col gap-2">
            <OptionalLabel htmlFor="linkedinUrl" optional={t("auth.optional")}>
              {t("auth.linkedinUrl")}
            </OptionalLabel>
            <Input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/…"
              aria-invalid={errors.linkedinUrl ? true : undefined}
              className={invalidField}
              {...form.register("linkedinUrl")}
            />
            <FieldError error={errors.linkedinUrl} />
          </div>
        </div>
      </FormSection>

      <FormSection step={3} title={t("auth.expertise")} hint={t("auth.expertiseHint")}>
        <div className="flex flex-col gap-2">
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
                    "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color] duration-200",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  {active ? <Check className="-ml-1 size-4" aria-hidden /> : null}
                  {c.name}
                </button>
              );
            })}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("auth.expertiseEmpty")}
              </p>
            )}
          </div>
          <FieldError error={errors.categoryIds} />
        </div>
      </FormSection>

      <Button type="submit" size="lg" className="w-full" loading={start.isPending}>
        {t("auth.tutorApplyCta")}
      </Button>
    </form>
  );
}

/** A field with an error gets a red edge, so the problem is visible at the input itself. */
const invalidField =
  "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/15";

/**
 * One titled group of the application. The form is long; numbering the groups
 * turns one wall of fields into three short, predictable steps.
 */
function FormSection({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-5">
      <legend className="flex w-full items-start gap-3.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-50 text-sm font-bold text-navy-700 ring-1 ring-inset ring-navy-100 dark:bg-navy-900/60 dark:text-navy-100 dark:ring-navy-800"
        >
          {step}
        </span>
        <span className="min-w-0 pt-0.5">
          <span className="block font-display text-lg leading-snug">{title}</span>
          {hint ? (
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              {hint}
            </span>
          ) : null}
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * A label that marks a field the application can go without. The row is held
 * at the plain label's height (14px) and baseline-aligned, so the smaller mark
 * does not push its input below the one beside it.
 */
function OptionalLabel({
  htmlFor,
  optional,
  children,
}: {
  htmlFor: string;
  optional: string;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor} className="flex h-3.5 items-baseline gap-1.5">
      {children}
      <span className="text-xs font-normal leading-none text-muted-foreground">({optional})</span>
    </Label>
  );
}

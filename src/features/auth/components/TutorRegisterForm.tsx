"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, MailCheck } from "lucide-react";
import {
  tutorRegisterSchema,
  tutorOtpSchema,
  type TutorRegisterInput,
  type TutorOtpInput,
} from "../schemas";
import { useTutorRegisterStart, useTutorRegisterVerify } from "../hooks";
import { FieldError, FormAlert, PasswordInput, readAuthError } from "./FieldError";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CategorySwatch } from "@/components/cover/CourseCover";
import { toCategoryRef } from "@/features/category/style";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/features/category/types";

export function TutorRegisterForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const start = useTutorRegisterStart();
  const verify = useTutorRegisterVerify();

  const [phase, setPhase] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  // The application's form-level error, cleared on each submit (see LoginForm).
  const [failure, setFailure] = useState<string | null>(null);

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
    setFailure(null);
    start.mutate(payload, {
      onSuccess: () => {
        setEmail(values.email);
        setPhase("otp");
        toast.success(t("auth.otpSent"));
      },
      onError: (error) => {
        const { message, fields } = readAuthError(error, t, {
          byCode: { EMAIL_ALREADY_REGISTERED: "auth.emailTaken" },
          byStatus: { 409: "auth.emailTaken" },
          fallback: "auth.registerFailed",
        });
        for (const fe of fields) {
          form.setError(fe.field as keyof TutorRegisterInput, { type: "server", message: fe.message });
        }
        setFailure(message);
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
          // A wrong or expired code is the one thing the reader can act on
          // here, so any failure but throttling reads as that. The message is
          // already translated (no `type`), and focus moves to the code, whose
          // description is the error, so it is heard.
          const { message } = readAuthError(error, t, { fallback: "auth.otpInvalid" });
          otpForm.setError("otp", { message }, { shouldFocus: true });
        },
      },
    );
  };

  if (phase === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(onVerify)} className="grid gap-6">
        <div className="flex items-start gap-4 border-t border-line-strong pt-6">
          <span
            aria-hidden="true"
            className="grid size-13 shrink-0 place-items-center rounded-full bg-paper-2 text-gold-ink"
          >
            <MailCheck strokeWidth={1.75} className="size-6" />
          </span>
          <p className="t-body min-w-0 pt-0.5">
            {t("auth.otpSubtitle")}{" "}
            <span className="break-words font-semibold text-ink">{email}</span>
          </p>
        </div>
        <Field id="otp" label={t("auth.otpLabel")}>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-invalid={otpForm.formState.errors.otp ? true : undefined}
            aria-describedby={otpForm.formState.errors.otp ? "otp-error" : undefined}
            // The letter-spacing trails the last digit too; the matching left
            // indent keeps the code optically centred.
            className="h-16 pl-[calc(1rem+0.5em)] text-center font-mono text-[1.75rem] font-medium tracking-[0.5em] tabular-nums placeholder:text-line-2"
            {...otpForm.register("otp")}
          />
          <FieldError id="otp-error" error={otpForm.formState.errors.otp} />
        </Field>
        <Button type="submit" className="w-full" loading={verify.isPending}>
          {t("auth.otpVerifyCta")}
          <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
        </Button>
        <Button
          type="button"
          variant="quiet"
          size="sm"
          className="mx-auto text-ink-2 hover:text-ink"
          onClick={() => setPhase("form")}
        >
          <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
          {t("auth.otpBack")}
        </Button>
      </form>
    );
  }

  const { errors } = form.formState;
  const optional = t("auth.optional");

  // The application reads as four short, numbered groups. The grouping is
  // only visual: the fields keep their order, names, schema and payload.
  return (
    <form onSubmit={form.handleSubmit(onStart)} className="grid gap-12">
      <FormSection
        step="01"
        id="tutor-account"
        title={t("auth.tutorSectionAccount")}
        hint={t("auth.tutorSectionAccountHint")}
      >
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

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
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
          <Field id="phone" label={<Optional label={t("auth.phone")} optional={optional} />}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            <FieldError error={errors.phone} />
          </Field>
        </div>

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
      </FormSection>

      <FormSection
        step="02"
        id="tutor-profile"
        title={t("auth.tutorSectionProfile")}
        hint={t("auth.tutorSectionProfileHint")}
      >
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <Field id="headline" label={<Optional label={t("auth.headline")} optional={optional} />}>
            <Input
              id="headline"
              placeholder={t("auth.headlinePlaceholder")}
              aria-invalid={errors.headline ? true : undefined}
              {...form.register("headline")}
            />
            <FieldError error={errors.headline} />
          </Field>
          <Field
            id="yearsExperience"
            label={<Optional label={t("auth.yearsExperience")} optional={optional} />}
          >
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              aria-invalid={errors.yearsExperience ? true : undefined}
              {...form.register("yearsExperience", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            <FieldError error={errors.yearsExperience} />
          </Field>
        </div>

        <Field id="bio" label={<Optional label={t("auth.bio")} optional={optional} />}>
          <Textarea
            id="bio"
            rows={5}
            aria-invalid={errors.bio ? true : undefined}
            {...form.register("bio")}
          />
          <FieldError error={errors.bio} />
        </Field>
      </FormSection>

      <FormSection
        step="03"
        id="tutor-links"
        title={t("auth.tutorSectionLinks")}
        hint={t("auth.tutorSectionLinksHint")}
      >
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <Field id="websiteUrl" label={<Optional label={t("auth.websiteUrl")} optional={optional} />}>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://"
              aria-invalid={errors.websiteUrl ? true : undefined}
              {...form.register("websiteUrl")}
            />
            <FieldError error={errors.websiteUrl} />
          </Field>
          <Field id="linkedinUrl" label={<Optional label={t("auth.linkedinUrl")} optional={optional} />}>
            <Input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/…"
              aria-invalid={errors.linkedinUrl ? true : undefined}
              {...form.register("linkedinUrl")}
            />
            <FieldError error={errors.linkedinUrl} />
          </Field>
        </div>
      </FormSection>

      <FormSection step="04" id="tutor-expertise" title={t("auth.expertise")} hint={t("auth.expertiseHint")}>
        {/* A grid's implicit track grows to its item's min-content width, and
            a chip row's min-content is its longest chip: without the
            minmax(0,1fr) track and min-w-0, a long category name widened the
            page past a phone's viewport and the chips never truncated. */}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <div className="flex min-w-0 flex-wrap gap-2">
            {categories.map((c) => {
              const active = selected.includes(c.id);
              const ref = toCategoryRef(c, t, locale);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCategory(c.id)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex h-11 max-w-full min-w-0 items-center gap-2.5 rounded-full border pr-4 pl-[5px] text-[15px] font-medium text-ink",
                    "transition-[border-color,background-color,color] duration-(--dur-1)",
                    active ? "border-ink bg-ink text-paper" : "border-line-2 hover:border-ink",
                  )}
                >
                  <span className="relative size-[34px] shrink-0 overflow-hidden rounded-full">
                    <CategorySwatch category={ref} className="h-full rounded-none" />
                    {/* The check sits on the swatch, so the chip keeps its width when pressed. */}
                    {active ? (
                      <span className="absolute inset-0 grid place-items-center bg-[rgb(14_26_43/0.55)] text-[#f6f2ea]">
                        <Check aria-hidden="true" strokeWidth={2.25} className="size-4" />
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 truncate">{ref.name}</span>
                </button>
              );
            })}
            {categories.length === 0 && <p className="t-meta">{t("auth.expertiseEmpty")}</p>}
          </div>
          <FieldError error={errors.categoryIds} />
        </div>
      </FormSection>

      {/* The groups are 48px apart; the alert stays close to the button it explains. */}
      <div className="grid gap-5">
        <FormAlert message={failure} />
        <Button type="submit" className="w-full" loading={start.isPending}>
          {t("auth.tutorApplyCta")}
          <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
        </Button>
      </div>
    </form>
  );
}

/**
 * One numbered group of the application: an ink rule, the mono gold number in
 * the margin and a Fraunces title, with the hint beside the number. It is a
 * real fieldset; the hint is tied to it with `aria-describedby`, so the group's
 * name stays short when a screen reader enters it.
 */
function FormSection({
  step,
  id,
  title,
  hint,
  children,
}: {
  step: string;
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  const hintId = `${id}-hint`;
  return (
    <fieldset className="min-w-0 space-y-5" aria-describedby={hint ? hintId : undefined}>
      <legend className="w-full border-t border-line-strong pt-4">
        <span className="flex items-baseline gap-4">
          <span aria-hidden="true" className="t-kicker w-7 shrink-0 text-gold-ink">
            {step}
          </span>
          <span className="t-title min-w-0">{title}</span>
        </span>
      </legend>
      {hint ? (
        <p id={hintId} className="t-meta -mt-3 pl-11">
          {hint}
        </p>
      ) : null}
      {children}
    </fieldset>
  );
}

/**
 * A label for a field the application can go without: the name, then a quiet
 * "(optional)" in the same line.
 */
function Optional({ label, optional }: { label: string; optional: string }) {
  return (
    <>
      {label} <span className="text-sm font-normal text-ink-3">({optional})</span>
    </>
  );
}

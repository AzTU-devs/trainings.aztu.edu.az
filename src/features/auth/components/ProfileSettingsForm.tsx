"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldError as FormFieldError } from "react-hook-form";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { updateProfileSchema, type UpdateProfileInput } from "../schemas";
import { useUpdateProfile } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { useLocale, useT } from "@/i18n/client";
import { locales, isLocale } from "@/i18n/config";
import { normalizeError } from "@/lib/api/client";
import type { User } from "@/types/user";
import type { ApiError } from "@/types/api";

/**
 * The failed save, as an ApiError. The `api` client's interceptor already
 * rejects with a normalised ApiError (normalizeError would turn that into a
 * bare "Unexpected error" and lose the status and field errors); anything
 * else, a raw AxiosError included, goes through normalizeError.
 */
function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error) && typeof (error as ApiError | null)?.status === "number") {
    return error as ApiError;
  }
  return normalizeError(error);
}

/**
 * The schema's messages are English literals shared with other forms (see
 * `../schemas`), so they are translated here at render time, the same list
 * the auth forms' FieldError keeps for these two.
 */
const SCHEMA_MESSAGE_KEYS: Record<string, string> = {
  "First name is required": "auth.errFirstName",
  "Last name is required": "auth.errLastName",
};

/**
 * A visual group of the form: a mono label on the left (columns 1–2 of the
 * form) and its fields on the right. Purely presentational — the fields, their
 * order, names and the submitted payload are exactly as before.
 */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-t border-line pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:gap-8">
      <p className="t-kicker pt-1 text-ink-3">{label}</p>
      <div className="grid min-w-0 gap-5">{children}</div>
    </div>
  );
}

export function ProfileSettingsForm({ user }: { user: User }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const update = useUpdateProfile();

  // A field's error in the reader's language. Anything not in the list above
  // (zod's own default, e.g. a max length, or a message the API set) is
  // English, so outside /en it reads as the neutral "check this field".
  const fieldMessage = (error?: FormFieldError) => {
    const message = error?.message;
    if (!message) return undefined;
    const key = SCHEMA_MESSAGE_KEYS[message];
    if (key) return t(key);
    return locale === "en" ? message : t("auth.errInvalid");
  };

  const initialLocale = isLocale(user.locale ?? "") ? (user.locale as "en" | "az") : "en";

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      locale: initialLocale,
    },
  });
  const errors = form.formState.errors;

  const onSubmit = (values: UpdateProfileInput) =>
    update.mutate(values, {
      onSuccess: (updated) => {
        toast.success(t("settings.saved"));
        // Keep the rendered locale in sync if the user changed it.
        if (isLocale(updated.locale ?? "") && updated.locale !== initialLocale) {
          document.cookie = `NEXT_LOCALE=${updated.locale}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }
      },
      onError: (error) => {
        const err = toApiError(error);
        if (err.errors) {
          for (const fe of err.errors) {
            form.setError(fe.field as keyof UpdateProfileInput, {
              message: fe.message,
            });
          }
        }
        // Never err.message: it is the API's English or axios's "Request
        // failed with status code …". Throttling and field errors get their
        // own words; everything else is the form's localised fallback.
        toast.error(
          t(
            err.status === 429
              ? "auth.rateLimited"
              : err.errors?.length
                ? "auth.checkFields"
                : "settings.saveError",
          ),
        );
      },
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
      <Group label={t("settings.groupName")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="firstName" label={t("auth.firstName")} error={fieldMessage(errors.firstName)} errorId="firstName-error">
            <Input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={errors.firstName ? true : undefined}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              {...form.register("firstName")}
            />
          </Field>
          <Field id="lastName" label={t("auth.lastName")} error={fieldMessage(errors.lastName)} errorId="lastName-error">
            <Input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={errors.lastName ? true : undefined}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              {...form.register("lastName")}
            />
          </Field>
        </div>
      </Group>

      <Group label={t("settings.groupContact")}>
        <Field id="email" label={t("auth.email")} hint={t("settings.emailLocked")} hintId="email-hint">
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              readOnly
              aria-describedby="email-hint"
              className="bg-paper-2 pr-11"
            />
            <Lock
              aria-hidden="true"
              strokeWidth={1.75}
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-3"
            />
          </div>
        </Field>
        <Field id="phone" label={t("auth.phone")} error={fieldMessage(errors.phone)} errorId="phone-error">
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...form.register("phone")}
          />
        </Field>
      </Group>

      <Group label={t("settings.groupLanguage")}>
        {/* A native select for the platform picker on phones, drawn in the
            field style (.select: same height, radius and focus ring). */}
        <Field id="locale" label={t("student.locale")} hint={t("settings.localeHint")} hintId="locale-hint">
          <Select
            id="locale"
            aria-describedby="locale-hint"
            className="sm:max-w-[22rem]"
            {...form.register("locale")}
          >
            {/* Labels in the page's language ("Azərbaycan dili", "İngilis
                dili" on /az) like the rest of the site; the values are the
                same locale codes as before. */}
            {locales.map((l) => (
              <option key={l} value={l}>
                {t("student.languageName", { name: t(`languages.${l}`) })}
              </option>
            ))}
          </Select>
        </Field>
      </Group>

      <div className="flex justify-end border-t border-line-strong pt-6">
        <Button type="submit" loading={update.isPending} className="w-full sm:w-auto">
          {update.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}

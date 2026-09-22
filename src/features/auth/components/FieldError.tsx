"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import axios from "axios";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { FormError } from "@/components/common/FormError";
import { Input } from "@/components/ui/input";
import { useLocale, useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import { normalizeError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { ApiError } from "@/types/api";

/*
 * The small pieces every auth form shares: the translated field error, the
 * password input with its show/hide toggle, and the status panel a step
 * resolves to. They live together here so the forms stay in step.
 */

/**
 * The validation messages in `../schemas` are English literals (the schemas
 * are shared with other forms), so the auth forms translate them here at
 * render time instead of printing English on /az. Keep this list in step with
 * the schema messages.
 */
const SCHEMA_MESSAGE_KEYS: Record<string, string> = {
  "First name is required": "auth.errFirstName",
  "Last name is required": "auth.errLastName",
  "Enter a valid email": "auth.errEmail",
  "Password is required": "auth.errPasswordRequired",
  "At least 10 characters": "auth.errPasswordMin",
  "Must contain an uppercase letter": "auth.errPasswordUpper",
  "Must contain a lowercase letter": "auth.errPasswordLower",
  "Must contain a digit": "auth.errPasswordDigit",
  "Passwords do not match": "auth.errPasswordMatch",
  "Enter a valid URL": "auth.errUrl",
  "Pick at least one expertise area": "auth.errExpertise",
  "Enter the 6-digit code": "auth.errOtp",
};

/**
 * A field's inline error in the reader's language. Errors the schema raised
 * carry a zod issue code as `type`; one whose message is not in the list above
 * (zod's own English default, e.g. a max length) is already readable in
 * English, and elsewhere falls back to a neutral "check this field". Errors set
 * from the API response carry `type: "server"` (see `readAuthError`), so on /az
 * they read as the neutral "check this field" too, never the API's English.
 */
export function FieldError({
  error,
  id,
}: {
  /** react-hook-form's error for the field (an array field's error fits too). */
  error?: { message?: string; type?: string };
  id?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const message = error?.message;
  if (!message) return null;

  const key = SCHEMA_MESSAGE_KEYS[message];
  const text = key
    ? t(key)
    : error.type && locale !== "en"
      ? t("auth.errInvalid")
      : message;

  return (
    <div id={id}>
      <FormError message={text} />
    </div>
  );
}

/**
 * A password input with a show/hide toggle inside it (`.pw`). The toggle is a
 * pressed/unpressed button with one fixed label, so a screen reader hears
 * "Show password, toggle button, pressed" rather than a label that flips. The
 * input keeps its name, id, autocomplete and react-hook-form wiring; only its
 * `type` changes while the password is shown.
 */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(function PasswordInput({ className, ...props }, ref) {
  const t = useT();
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  return (
    <div className="pw">
      <Input ref={ref} type={shown ? "text" : "password"} className={className} {...props} />
      <button
        type="button"
        aria-label={t("auth.showPassword")}
        aria-pressed={shown}
        aria-controls={props.id}
        onClick={() => setShown((s) => !s)}
        className="transition-colors duration-(--dur-1) hover:bg-paper-2 hover:text-ink focus-visible:outline-offset-0"
      >
        <Icon aria-hidden="true" strokeWidth={1.75} className="size-5" />
      </button>
    </div>
  );
});

/**
 * The outcome of a step (link sent, password changed, email confirmed, a link
 * rejected) shown in place of the form: an icon in a 52px paper-2 circle, a
 * Fraunces title and the explanation. Done states carry the gold check;
 * failures the danger mark.
 */
export function StatusPanel({
  tone,
  icon,
  title,
  children,
}: {
  tone: "done" | "busy" | "danger";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div role="status" className="border-t border-line-strong pt-6">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-13 place-items-center rounded-full bg-paper-2 [&_svg]:size-6",
          tone === "done" && "text-gold-ink",
          tone === "busy" && "text-ink-2",
          tone === "danger" && "text-danger",
        )}
      >
        {icon}
      </span>
      <h2 className="t-title mt-5">{title}</h2>
      <div className="t-body mt-2 break-words">{children}</div>
    </div>
  );
}

/**
 * A failed auth request, read for the forms. The BFF calls reject with a raw
 * AxiosError, whose `message` is always set ("Request failed with status code
 * 401"), so `err.message ?? t(...)` printed axios's English on every locale.
 * This normalises the error and picks the reader's wording from the API's
 * `code` (then the status), falling back to the form's generic key. The API's
 * own message is never shown: it is English only.
 *
 * `fields` are the API's field errors, for the form to set with
 * `type: "server"` (so `FieldError` translates them on /az).
 */
export function readAuthError(
  error: unknown,
  t: TFunction,
  keys: { byCode?: Record<string, string>; byStatus?: Record<number, string>; fallback: string },
): { message: string; fields: NonNullable<ApiError["errors"]> } {
  const err = normalizeError(error);
  const fields = err.errors ?? [];

  // Rate limiting: the wait comes from Retry-After (the BFF forwards it), in
  // our words rather than normalizeError's English sentence.
  if (err.status === 429) {
    const header = axios.isAxiosError(error) ? error.response?.headers?.["retry-after"] : undefined;
    const seconds = Number(header);
    if (!Number.isFinite(seconds) || seconds <= 0) return { message: t("auth.rateLimited"), fields };
    if (seconds < 60) return { message: t("auth.rateLimitedSeconds", { n: Math.ceil(seconds) }), fields };
    return { message: t("auth.rateLimitedMinutes", { n: Math.ceil(seconds / 60) }), fields };
  }

  const key =
    (err.code ? keys.byCode?.[err.code] : undefined) ??
    keys.byStatus?.[err.status] ??
    // Field errors say what is wrong next to each field; the form-level line
    // then only points at them.
    (fields.length > 0 ? "auth.checkFields" : keys.fallback);
  return { message: t(key), fields };
}

/**
 * A form-level error above the submit button: a danger `Note` (the note's
 * rule in danger red, with the alert icon). `role="alert"` announces it as it
 * appears; the forms clear it on each submit, so a retry that fails the same
 * way is announced again.
 */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="note flex items-start gap-2.5 border-l-danger text-ink">
      <CircleAlert aria-hidden="true" strokeWidth={1.75} className="mt-[5px] size-[18px] shrink-0 text-danger" />
      <p className="t-body min-w-0 text-ink">{message}</p>
    </div>
  );
}

"use client";

import { FormError } from "@/components/common/FormError";
import { useLocale, useT } from "@/i18n/client";

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
 * from the API response have no `type` and are shown as the server worded them.
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

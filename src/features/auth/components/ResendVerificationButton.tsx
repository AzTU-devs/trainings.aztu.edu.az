"use client";

import axios from "axios";
import { MailWarning } from "lucide-react";
import { toast } from "sonner";
import { useRequestEmailVerification } from "../hooks";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { normalizeError } from "@/lib/api/client";
import type { ApiError } from "@/types/api";

/**
 * The failed request's toast key. The `api` client's interceptor already
 * rejects with a normalised ApiError (normalizeError would reduce that to a
 * bare "Unexpected error"); anything else goes through normalizeError. The
 * API's own message is never shown: it is English only, and axios's is
 * "Request failed with status code …".
 */
function errorKey(error: unknown): string {
  const err: ApiError =
    !axios.isAxiosError(error) && typeof (error as ApiError | null)?.status === "number"
      ? (error as ApiError)
      : normalizeError(error);
  if (err.status === 429) return "auth.rateLimited";
  // Verified in another tab since this page rendered.
  if (err.code === "EMAIL_ALREADY_VERIFIED") return "student.verifyAlreadyVerified";
  return "auth.verifyResendError";
}

export function ResendVerificationButton() {
  const t = useT();
  const resend = useRequestEmailVerification();

  const onClick = () =>
    resend.mutate(undefined, {
      onSuccess: () => toast.success(t("auth.verifyResendSent")),
      onError: (error) => toast.error(t(errorKey(error))),
    });

  // The editorial note (gold left rule) rather than a coloured alert box: the
  // notice reads as "needs your attention" without leaving the palette.
  return (
    <div className="flex flex-col gap-4 border-l-2 border-gold bg-paper-2 py-4 pl-5 pr-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 items-start gap-3">
        <MailWarning aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-gold-ink" />
        <div className="min-w-0">
          <p className="font-semibold text-ink">{t("auth.verifyUnverifiedTitle")}</p>
          <p className="mt-0.5 text-[15px] leading-relaxed text-ink-2">{t("auth.verifyUnverifiedBody")}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 self-start sm:self-center"
        loading={resend.isPending}
        onClick={onClick}
      >
        {t("student.resendCta")}
      </Button>
    </div>
  );
}

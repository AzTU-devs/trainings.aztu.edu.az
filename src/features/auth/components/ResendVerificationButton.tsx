"use client";

import { MailWarning } from "lucide-react";
import { toast } from "sonner";
import { useRequestEmailVerification } from "../hooks";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import type { ApiError } from "@/types/api";

export function ResendVerificationButton() {
  const t = useT();
  const resend = useRequestEmailVerification();

  const onClick = () =>
    resend.mutate(undefined, {
      onSuccess: () => toast.success(t("auth.verifyResendSent")),
      onError: (error) => {
        const err = error as unknown as ApiError;
        toast.error(err.message ?? t("auth.verifyResendError"));
      },
    });

  // Gold tints rather than an off-palette amber: the notice stays in the
  // brand's colours while still reading as "needs your attention".
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gold-200 bg-gold-50 p-5 text-sm dark:border-gold-800/60 dark:bg-gold-900/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold-100 text-gold-800 dark:bg-gold-900/60 dark:text-gold-200"
        >
          <MailWarning className="size-[18px]" />
        </span>
        <div className="min-w-0 space-y-0.5 pt-0.5">
          <p className="font-semibold text-gold-900 dark:text-gold-100">
            {t("auth.verifyUnverifiedTitle")}
          </p>
          <p className="leading-relaxed text-gold-800 dark:text-gold-200/75">
            {t("auth.verifyUnverifiedBody")}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 shrink-0 self-start border-gold-200 sm:h-9 sm:self-center dark:border-gold-800/60"
        loading={resend.isPending}
        onClick={onClick}
      >
        {t("auth.verifyResendCta")}
      </Button>
    </div>
  );
}

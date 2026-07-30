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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <MailWarning className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-200">
            {t("auth.verifyUnverifiedTitle")}
          </p>
          <p className="text-amber-800/80 dark:text-amber-200/70">
            {t("auth.verifyUnverifiedBody")}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        loading={resend.isPending}
        onClick={onClick}
      >
        {t("auth.verifyResendCta")}
      </Button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { authApi } from "../api";
import { StatusPanel } from "./FieldError";
import { buttonVariants } from "@/components/ui/button";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";

type Status = "verifying" | "success" | "error";

export function VerifyEmail({ token }: { token?: string }) {
  const t = useT();
  const locale = useLocale();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  // Guard against React's double-invoke in dev so we only POST the token once.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    authApi
      .verifyEmail({ token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "verifying") {
    return (
      <StatusPanel
        tone="busy"
        icon={<LoaderCircle className="animate-spin motion-reduce:animate-none" />}
        title={t("auth.verifyVerifyingTitle")}
      >
        <p>{t("auth.verifyVerifyingBody")}</p>
      </StatusPanel>
    );
  }

  if (status === "success") {
    return (
      <div className="grid gap-8">
        <StatusPanel tone="done" icon={<Check strokeWidth={2} />} title={t("auth.verifySuccessTitle")}>
          <p>{t("auth.verifySuccessBody")}</p>
        </StatusPanel>
        <Link href={localeHref(locale, "/dashboard")} className={cn(buttonVariants(), "w-full")}>
          {t("auth.verifyGoDashboard")}
          <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <StatusPanel tone="danger" icon={<TriangleAlert />} title={t("auth.verifyErrorTitle")}>
        <p>{t("auth.verifyErrorBody")}</p>
      </StatusPanel>
      <Link
        href={localeHref(locale, "/login")}
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
        {t("auth.backToLogin")}
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { authApi } from "../api";
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
        tone="primary"
        icon={<Loader2 className="animate-spin" />}
        title={t("auth.verifyVerifyingTitle")}
      >
        <p>{t("auth.verifyVerifyingBody")}</p>
      </StatusPanel>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6">
        <StatusPanel tone="success" icon={<CheckCircle2 />} title={t("auth.verifySuccessTitle")}>
          <p>{t("auth.verifySuccessBody")}</p>
        </StatusPanel>
        <Link
          href={localeHref(locale, "/dashboard")}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          {t("auth.verifyGoDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusPanel tone="danger" icon={<AlertTriangle />} title={t("auth.verifyErrorTitle")}>
        <p>{t("auth.verifyErrorBody")}</p>
      </StatusPanel>
      <Link
        href={localeHref(locale, "/login")}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
      >
        {t("auth.backToLogin")}
      </Link>
    </div>
  );
}

/**
 * The outcome of a step (link sent, password changed, token rejected) shown
 * in place of the form: a tinted icon, a title and one line of explanation.
 */
function StatusPanel({
  tone,
  icon,
  title,
  children,
}: {
  tone: "primary" | "success" | "danger";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-4 rounded-2xl border border-border/80 bg-muted/50 p-5"
    >
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-2xl [&_svg]:size-5",
          tone === "primary" &&
            "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
          tone === "success" && "bg-success/10 text-success",
          tone === "danger" && "bg-destructive/10 text-destructive",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 space-y-1 pt-0.5">
        <h2 className="font-display text-base leading-snug">{title}</h2>
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

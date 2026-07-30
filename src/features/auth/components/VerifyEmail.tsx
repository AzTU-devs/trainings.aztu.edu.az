"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { authApi } from "../api";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";

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
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Loader2 className="size-5 animate-spin" />
        </div>
        <h2 className="text-sm font-semibold">{t("auth.verifyVerifyingTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("auth.verifyVerifyingBody")}
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-5" />
        </div>
        <h2 className="text-sm font-semibold">{t("auth.verifySuccessTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("auth.verifySuccessBody")}
        </p>
        <Link href={localeHref(locale, "/dashboard")} className="block">
          <Button className="w-full">{t("auth.verifyGoDashboard")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-6 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="text-sm font-semibold">{t("auth.verifyErrorTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("auth.verifyErrorBody")}</p>
      <Link href={localeHref(locale, "/login")} className="block">
        <Button variant="outline" className="w-full">
          {t("auth.backToLogin")}
        </Button>
      </Link>
    </div>
  );
}

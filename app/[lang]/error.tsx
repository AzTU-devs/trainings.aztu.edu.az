"use client";

import { useEffect } from "react";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";

// Sits inside the [lang] root layout but outside the marketing layout, so it
// has the dictionary but no header or footer — it is laid out as a standalone
// page. An error in the root layout itself is app/global-error.tsx's job.
export default function LangError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(26_91_165/0.14),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgb(66_118_179/0.18),transparent_70%)]"
      />

      <LocaleLink href="/" aria-label="AzTU EduPlatform" className="relative mb-8 rounded-2xl">
        <Logo />
      </LocaleLink>

      <div className="relative w-full max-w-lg rounded-4xl border border-border/80 bg-card p-2 elev-3">
        <div className="surface-deep grid place-items-center rounded-3xl px-6 py-12">
          <span className="grid size-20 place-items-center rounded-3xl bg-white/10 text-gold-200 ring-1 ring-inset ring-white/15">
            <TriangleAlert aria-hidden className="size-9" strokeWidth={1.5} />
          </span>
        </div>

        <div className="px-5 pb-6 pt-7 text-center sm:px-8 sm:pb-8">
          <h1 className="font-display text-balance text-3xl leading-tight">{t("errors.title")}</h1>
          {/* Never the raw error.message: in production a server error's
              message is Next's generic English sentence about omitted
              details, and a client error's is a JavaScript message — neither
              is in the visitor's language or something they can act on. The
              digest, when there is one, identifies the failure in the logs. */}
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            {t("errors.description")}
          </p>
          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-muted-foreground/80">{error.digest}</p>
          ) : null}
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button size="lg" onClick={reset}>
              <RotateCcw />
              {t("errors.tryAgain")}
            </Button>
            <LocaleLink href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <House />
              {t("errors.goHome")}
            </LocaleLink>
          </div>
        </div>
      </div>
    </div>
  );
}

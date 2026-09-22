"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { BlankPlate } from "@/components/editorial/BlankPlate";
import { Kicker } from "@/components/editorial/Kicker";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";

// Sits inside the [lang] root layout but outside the marketing layout, so it
// has the dictionary but no header or footer — it is laid out as a standalone
// editorial page with the brand on top. An error in the root layout itself is
// app/global-error.tsx's job.
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
    <div className="flex min-h-screen flex-col">
      <div className="wrap flex h-[72px] w-full items-center">
        <LocaleLink href="/" aria-label="AzTU EduPlatform">
          <Logo />
        </LocaleLink>
      </div>
      <main id="main" className="wrap w-full flex-1 pt-10 pb-24 lg:pt-16">
        <div className="g12 gap-y-10 border-t border-line-strong pt-8 lg:pt-10">
          <BlankPlate label="!" className="col-span-4 max-md:aspect-[5/2] md:col-span-3 lg:col-span-4" />
          <div className="col-span-4 md:col-span-5 lg:col-span-7 lg:col-start-6">
            <Kicker tone="gold">{t("errors.errorKicker")}</Kicker>
            <h1 className="t-display-xl mt-4">{t("errors.title")}</h1>
            {/* Never the raw error.message: in production a server error's
                message is Next's generic English sentence about omitted
                details, and a client error's is a JavaScript message — neither
                is in the visitor's language or something they can act on. The
                digest, when there is one, identifies the failure in the logs. */}
            <p className="t-lead mt-5 max-w-[48ch]">{t("errors.description")}</p>
            {error.digest ? (
              <p className="mt-3 font-mono text-xs text-ink-3">{t("errors.digest", { digest: error.digest })}</p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={reset}>
                <RotateCcw aria-hidden="true" strokeWidth={1.75} />
                {t("errors.tryAgain")}
              </Button>
              <LocaleLink href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t("errors.goHome")}
              </LocaleLink>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

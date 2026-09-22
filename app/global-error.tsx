"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { BlankPlate } from "@/components/editorial/BlankPlate";
import { buttonVariants } from "@/components/ui/button";
import { bodyClassName, htmlClassName } from "./fonts";
import "./globals.css";

// The last-resort boundary: it replaces the [lang] root layout itself when
// that layout throws, so there is no dictionary and no locale to ask for one.
// Like the global 404 it speaks both languages, Azerbaijani first; the
// strings mirror errors.* in messages/*.json. It renders its own document,
// hence <html>/<body> and the stylesheet import. The raw error message is not
// shown: in production it is a generic digest line, not something a visitor
// can act on.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="az" className={htmlClassName}>
      <body className={bodyClassName}>
        <div className="wrap flex h-[72px] w-full items-center">
          <Link href="/" aria-label="AzTU EduPlatform">
            <Logo />
          </Link>
        </div>
        <main className="wrap w-full flex-1 pt-10 pb-24 lg:pt-16">
          <div className="g12 gap-y-10 border-t border-line-strong pt-8 lg:pt-10">
            <BlankPlate label="!" className="col-span-4 max-md:aspect-[5/2] md:col-span-3 lg:col-span-4" />
            <div className="col-span-4 md:col-span-5 lg:col-span-7 lg:col-start-6">
              <p className="t-kicker text-gold-ink">
                Xəta · <span lang="en">Error</span>
              </p>
              <h1 className="t-display-xl mt-4">Nəsə səhv getdi</h1>
              <p lang="en" className="t-title-l mt-3 text-ink-2">
                Something went wrong
              </p>
              <div className="t-body mt-6 max-w-[52ch] space-y-1">
                <p>Gözlənilməz xəta baş verdi. Bir az sonra yenidən cəhd edin.</p>
                <p lang="en">An unexpected error occurred. Please try again in a moment.</p>
              </div>
              {error.digest ? <p className="mt-3 font-mono text-xs text-ink-3">{error.digest}</p> : null}
              <button type="button" onClick={reset} className={buttonVariants({ size: "lg", className: "mt-8" })}>
                <RotateCcw aria-hidden="true" strokeWidth={1.75} />
                <span>Yenidən cəhd edin</span>
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
                <span lang="en">Try again</span>
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

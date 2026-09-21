"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
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
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(26_91_165/0.14),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgb(66_118_179/0.18),transparent_70%)]"
          />

          <div className="relative w-full max-w-lg rounded-4xl border border-border/80 bg-card p-2 elev-3">
            <div className="surface-deep grid place-items-center rounded-3xl px-6 py-12">
              <span className="grid size-20 place-items-center rounded-3xl bg-white/10 text-gold-200 ring-1 ring-inset ring-white/15">
                <TriangleAlert aria-hidden className="size-9" strokeWidth={1.5} />
              </span>
            </div>

            <div className="px-5 pb-6 pt-7 text-center sm:px-8 sm:pb-8">
              <h1 className="font-display text-balance text-3xl leading-tight">Nəsə səhv getdi</h1>
              <p lang="en" className="mt-1.5 text-lg font-semibold text-muted-foreground">
                Something went wrong
              </p>
              <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                Gözlənilməz xəta baş verdi.{" "}
                <span lang="en">An unexpected error occurred.</span>
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_rgb(0_56_118/0.7)] transition-colors hover:bg-navy-600 dark:bg-navy-100 dark:text-navy-900 dark:hover:bg-white"
              >
                <RotateCcw aria-hidden className="size-4" />
                <span>Yenidən cəhd edin</span>
                <span aria-hidden className="opacity-40">
                  ·
                </span>
                <span lang="en">Try again</span>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

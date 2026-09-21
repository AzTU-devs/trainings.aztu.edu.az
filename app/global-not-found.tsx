import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NotFoundCard, NotFoundWash } from "@/components/common/NotFoundCard";
import { Logo } from "@/components/layout/Logo";
import { getT } from "@/i18n/server";
import { bodyClassName, htmlClassName } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Səhifə tapılmadı · Page not found — AzTU EduPlatform",
  robots: { index: false },
};

/**
 * The 404 for URLs that match no route at all — in practice the few the proxy
 * does not move into a locale: a missing image or other static file, and an
 * unknown /api path. It renders outside every layout (the root layout lives
 * under [lang]), so it is its own document, with no locale, header or
 * session. It therefore speaks both languages at once, Azerbaijani first, and
 * offers a way home in each. Everything under a real locale gets
 * app/[lang]/not-found.tsx instead.
 */
export default async function GlobalNotFound() {
  const [az, en] = await Promise.all([getT("az"), getT("en")]);

  return (
    <html lang="az" className={htmlClassName}>
      <body className={bodyClassName}>
        <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
          <NotFoundWash />

          <Link href="/" aria-label="AzTU EduPlatform" className="relative mb-8 rounded-2xl">
            <Logo />
          </Link>

          <NotFoundCard>
            <h1 className="font-display text-balance text-3xl leading-tight">
              {az("errors.notFoundTitle")}
            </h1>
            <p lang="en" className="mt-1.5 text-lg font-semibold text-muted-foreground">
              {en("errors.notFoundTitle")}
            </p>
            <div className="mx-auto mt-5 max-w-sm space-y-1 text-[15px] leading-relaxed text-muted-foreground">
              <p>{az("errors.notFoundDescription")}</p>
              <p lang="en">{en("errors.notFoundDescription")}</p>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <HomeLink href="/az" lang="az" code="AZ" label={az("errors.goHome")} primary />
              <HomeLink href="/en" lang="en" code="EN" label={en("errors.goHome")} />
            </div>
          </NotFoundCard>
        </main>
      </body>
    </html>
  );
}

function HomeLink({
  href,
  lang,
  code,
  label,
  primary,
}: {
  href: string;
  lang: string;
  code: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      lang={lang}
      hrefLang={lang}
      className={
        primary
          ? "group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-primary pl-2 pr-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_rgb(0_56_118/0.7)] transition-colors hover:bg-navy-600 dark:bg-navy-100 dark:text-navy-900 dark:hover:bg-white"
          : "group inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-border bg-card pl-2 pr-5 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
      }
    >
      <span
        aria-hidden
        className={
          primary
            ? "grid h-8 min-w-8 place-items-center rounded-full bg-white/15 px-2 text-[11px] font-bold tracking-wide dark:bg-navy-900/15"
            : "grid h-8 min-w-8 place-items-center rounded-full bg-navy-50 px-2 text-[11px] font-bold tracking-wide text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
        }
      >
        {code}
      </span>
      {label}
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

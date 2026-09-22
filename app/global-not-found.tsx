import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { NotFoundPlate } from "@/components/layout/NotFoundPlate";
import { Dept } from "@/components/editorial/Dept";
import { LinkGo } from "@/components/ui/link-go";
import { SearchField } from "@/components/ui/search-field";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { cn } from "@/lib/utils/cn";
import { bodyClassName, htmlClassName } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Səhifə tapılmadı · Page not found — AzTU EduPlatform",
  robots: { index: false },
};

/**
 * The 404 for URLs that match no route at all. Every path under /az or /en
 * is claimed by app/[lang]/[...missing] and gets the localised 404, and the
 * proxy moves locale-less paths into a locale, so what is left is what the
 * proxy skips: a missing image or other static file at the root. It renders
 * outside every layout (the root layout lives under [lang]), so it is its own
 * document, with no locale, header or session. It therefore speaks both
 * languages at once, Azerbaijani first, and has the localised 404's ways on:
 * the catalogue search, home in each language and the catalogue.
 *
 * The search and the catalogue link point at the locale-less /courses: the
 * proxy then picks the visitor's language (cookie, then Accept-Language) and
 * keeps the query string.
 */
export default async function GlobalNotFound() {
  const [az, en] = await Promise.all([getT("az"), getT("en")]);

  return (
    <html lang="az" className={htmlClassName}>
      <body className={bodyClassName}>
        <div className="wrap flex h-[72px] w-full items-center">
          <Link href="/" aria-label="AzTU EduPlatform">
            <Logo />
          </Link>
        </div>
        <main className="wrap w-full flex-1 pt-10 pb-24 lg:pt-16">
          <Dept
            as="p"
            number={az("errors.notFoundCode")}
            label={
              <>
                {az("errors.notFoundKicker")} · <span lang="en">{en("errors.notFoundKicker")}</span>
              </>
            }
          />
          <div className="g12 mt-8 gap-y-12 lg:mt-10">
            <NotFoundPlate
              label={az("errors.notFoundCode")}
              className="col-span-4 max-md:order-last md:col-span-3 lg:col-span-4"
            />
            <div className="col-span-4 md:col-span-5 lg:col-span-7 lg:col-start-6">
              <h1 className="t-display-xl">{az("errors.notFoundTitle")}</h1>
              <p lang="en" className="t-title-l mt-3 text-ink-2">
                {en("errors.notFoundTitle")}
              </p>
              <div className="t-body mt-6 max-w-[52ch] space-y-1">
                <p>
                  {az("errors.notFoundDescription")} {az("errors.notFoundHint")}
                </p>
                <p lang="en">
                  {en("errors.notFoundDescription")} {en("errors.notFoundHint")}
                </p>
              </div>
              <SearchField
                id="notfound-q"
                className="mt-8 max-w-[560px]"
                action="/courses"
                placeholder={az("common.search")}
                label={`${az("ui.searchLabel")} · ${en("ui.searchLabel")}`}
                submitLabel={`${az("ui.searchSubmit")} · ${en("ui.searchSubmit")}`}
              />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <HomeLink href="/az" lang="az" code="AZ" label={az("errors.goHome")} primary />
                <HomeLink href="/en" lang="en" code="EN" label={en("errors.goHome")} />
              </div>
              {/* The quiet third way on, as a text link: a third pill would not
                  fit beside the two home buttons and would wrap on its own. */}
              <LinkGo href="/courses" className="mt-7">
                <span>
                  {az("ui.browseCatalogue")} · <span lang="en">{en("ui.browseCatalogue")}</span>
                </span>
              </LinkGo>
            </div>
          </div>
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
      className={cn(buttonVariants({ variant: primary ? "default" : "outline", size: "lg" }), "pl-3")}
    >
      <span aria-hidden="true" className="rounded-tag bg-paper-2 px-1.5 py-1 font-mono text-xs text-ink">
        {code}
      </span>
      {label}
      <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
    </Link>
  );
}

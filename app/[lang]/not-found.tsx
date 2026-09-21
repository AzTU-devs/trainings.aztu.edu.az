"use client";

import { ArrowRight, House, Search } from "lucide-react";
import { NotFoundCard, NotFoundWash } from "@/components/common/NotFoundCard";
import { SiteShell } from "@/components/layout/SiteShell";
import { buttonVariants } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { LocaleLink } from "@/i18n/LocaleLink";

/**
 * notFound() anywhere under a locale — and every unknown URL, through
 * [...missing] — lands here. It renders inside [lang]/layout, so unlike the
 * root 404 it knows the language (one language only, from the dictionary)
 * and keeps the visitor on the site: header, search and footer included.
 */
export default function LocaleNotFound() {
  const t = useT();
  const locale = useLocale();

  return (
    <SiteShell>
      <section className="container-fluid relative flex min-h-[70vh] flex-col items-center justify-center py-12 sm:py-16">
        <NotFoundWash />
        <NotFoundCard>
          <h1 className="font-display text-balance text-3xl leading-tight">
            {t("errors.notFoundTitle")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            {t("errors.notFoundDescription")} {t("errors.notFoundHint")}
          </p>

          <form
            action={localeHref(locale, "/courses")}
            role="search"
            className="relative mx-auto mt-6 max-w-sm"
          >
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              name="q"
              placeholder={t("common.search")}
              aria-label={t("common.search")}
              className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-[15px] transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary/40 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
            />
          </form>

          <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
            <LocaleLink href="/" className={buttonVariants({ size: "lg" })}>
              <House aria-hidden />
              {t("errors.goHome")}
            </LocaleLink>
            <LocaleLink
              href="/courses"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {t("home.browseCourses")}
              <ArrowRight aria-hidden />
            </LocaleLink>
          </div>
        </NotFoundCard>
      </section>
    </SiteShell>
  );
}

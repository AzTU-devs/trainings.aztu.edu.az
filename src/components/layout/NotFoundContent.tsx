"use client";

import { ArrowRight } from "lucide-react";
import { Dept } from "@/components/editorial/Dept";
import { SearchField } from "@/components/ui/search-field";
import { buttonVariants } from "@/components/ui/button";
import { useLocale, useT } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { LocaleLink } from "@/i18n/LocaleLink";
import { NotFoundPlate } from "./NotFoundPlate";

/**
 * The localised 404's page body (app/[lang]/not-found.tsx wraps it in the
 * site chrome). Opens like every other page, with a numbered rule whose
 * "number" is the status; then the plate, the title, a catalogue search and
 * the two ways on: home (primary, with the arrow) and the catalogue.
 */
export function NotFoundContent() {
  const t = useT();
  const locale = useLocale();

  return (
    <section className="wrap pt-10 pb-24 lg:pt-16 lg:pb-32">
      {/* A <p>, not a heading: the page's only heading is the h1 below. */}
      <Dept as="p" number={t("errors.notFoundCode")} label={t("errors.notFoundKicker")} />
      <div className="g12 mt-8 gap-y-12 lg:mt-10">
        <NotFoundPlate
          label={t("errors.notFoundCode")}
          className="col-span-4 max-md:order-last md:col-span-3 lg:col-span-4"
        />
        <div className="col-span-4 md:col-span-5 lg:col-span-7 lg:col-start-6">
          <h1 className="t-display-xl">{t("errors.notFoundTitle")}</h1>
          <p className="t-lead mt-5 max-w-[48ch]">
            {t("errors.notFoundDescription")} {t("errors.notFoundHint")}
          </p>
          <SearchField
            id="notfound-q"
            className="mt-8 max-w-[560px]"
            action={localeHref(locale, "/courses")}
            placeholder={t("common.search")}
            label={t("ui.searchLabel")}
            submitLabel={t("ui.searchSubmit")}
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LocaleLink href="/" className={buttonVariants({ size: "lg" })}>
              {t("errors.goHome")}
              <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
            </LocaleLink>
            <LocaleLink href="/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
              {t("ui.browseCatalogue")}
            </LocaleLink>
          </div>
        </div>
      </div>
    </section>
  );
}

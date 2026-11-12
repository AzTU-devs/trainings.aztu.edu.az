"use client";

import { ArrowUpRight } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { locales, type Locale } from "@/i18n/config";
import { Logo } from "./Logo";
import { useSwitchLocale } from "./LocaleSwitcher";

/** The support address shown on the site; the platform's own contact point. */
export const SUPPORT_EMAIL = "support@aztu.edu.az";

/**
 * The footer: the logo with one line about the platform, the site map in
 * three columns, and a bottom bar with the copyright, the university's
 * address and the language switch.
 */
export function Footer() {
  const t = useT();
  const locale = useLocale();
  const switchLocale = useSwitchLocale();
  const year = new Date().getFullYear();
  const order: Locale[] = [...locales].sort((a, b) => Number(b === "az") - Number(a === "az"));

  return (
    <footer className="site-footer" aria-labelledby="site-footer-title">
      <h2 id="site-footer-title" className="sr-only">
        {t("ui.siteMap")}
      </h2>
      <div className="wrap grid gap-10 py-12 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-5">
          <LocaleLink href="/" className="flex w-fit rounded-xl" aria-label="AzTU EduPlatform">
            <Logo />
          </LocaleLink>
          <p className="mt-4 max-w-sm text-[15px] text-ink-2">{t("ui.footerBlurb")}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-[15px] sm:grid-cols-3 lg:col-span-7">
          <div>
            <p className="mb-4 text-[13px] font-semibold text-ink">{t("ui.footerLearn")}</p>
            <ul className="grid gap-3">
              <li><LocaleLink className="fl" href="/courses">{t("ui.allCourses")}</LocaleLink></li>
              <li><LocaleLink className="fl" href="/categories">{t("ui.navCategories")}</LocaleLink></li>
              <li><LocaleLink className="fl" href="/experts">{t("ui.navExperts")}</LocaleLink></li>
              <li><LocaleLink className="fl" href="/rooms">{t("ui.navRooms")}</LocaleLink></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[13px] font-semibold text-ink">{t("ui.footerAccount")}</p>
            <ul className="grid gap-3">
              <li><LocaleLink className="fl" href="/login">{t("ui.signIn")}</LocaleLink></li>
              <li><LocaleLink className="fl" href="/register">{t("ui.register")}</LocaleLink></li>
              <li><LocaleLink className="fl" href="/register/tutor">{t("ui.applyAsExpert")}</LocaleLink></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[13px] font-semibold text-ink">{t("ui.footerUniversity")}</p>
            <ul className="grid gap-3">
              <li>
                <a className="fl inline-flex items-center gap-1" href="https://aztu.edu.az" target="_blank" rel="noopener noreferrer">
                  {t("ui.aboutAztu")} <ArrowUpRight className="i !size-4" aria-hidden />
                </a>
              </li>
              <li><a className="fl" href={`mailto:${SUPPORT_EMAIL}`}>{t("ui.contact")}</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-4 py-6 text-[13.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 lg:flex-row lg:gap-6">
            <p>{t("ui.copyright", { year })}</p>
            <p>{t("ui.universityName")}</p>
          </div>
          <div className="seg w-fit" role="radiogroup" aria-label={t("ui.language")}>
            {order.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                lang={l}
                aria-checked={l === locale}
                onClick={() => switchLocale(l)}
                className="!h-8 !px-3"
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

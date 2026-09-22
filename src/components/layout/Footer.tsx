"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { locales, type Locale } from "@/i18n/config";
import { useSwitchLocale } from "./LocaleSwitcher";

/** The support address shown on the site; the platform's own contact point. */
export const SUPPORT_EMAIL = "support@aztu.edu.az";

/**
 * The footer: a paper band with the site map and the language switch, and the
 * product name set as a giant outlined wordmark along the bottom edge.
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
      <div className="wrap pt-16 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <LocaleLink href="/" className="brand" aria-label="AzTU EduPlatform">
              <Image className="logo-l" src="/brand/aztu-mark.png" alt="" width={18} height={34} />
              <Image className="logo-d" src="/brand/aztu-mark-white.png" alt="" width={18} height={34} />
              <span className="wm">
                <small>AZTU</small>
                <b>EduPlatform</b>
              </span>
            </LocaleLink>
            <p className="mt-5 max-w-sm text-ink-2">{t("ui.footerBlurb")}</p>
            <div className="seg mt-6" role="radiogroup" aria-label={t("ui.language")}>
              {order.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  lang={l}
                  aria-checked={l === locale}
                  onClick={() => switchLocale(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[15px] sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="kicker mb-4">{t("ui.footerLearn")}</p>
              <ul className="grid gap-3">
                <li><LocaleLink className="fl" href="/courses">{t("ui.allCourses")}</LocaleLink></li>
                <li><LocaleLink className="fl" href="/categories">{t("ui.navCategories")}</LocaleLink></li>
                <li><LocaleLink className="fl" href="/experts">{t("ui.navExperts")}</LocaleLink></li>
              </ul>
            </div>
            <div>
              <p className="kicker mb-4">{t("ui.footerAccount")}</p>
              <ul className="grid gap-3">
                <li><LocaleLink className="fl" href="/login">{t("ui.signIn")}</LocaleLink></li>
                <li><LocaleLink className="fl" href="/register">{t("ui.register")}</LocaleLink></li>
                <li><LocaleLink className="fl" href="/register/tutor">{t("ui.applyAsExpert")}</LocaleLink></li>
              </ul>
            </div>
            <div>
              <p className="kicker mb-4">{t("ui.footerUniversity")}</p>
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
        <div className="giant mt-16 translate-y-[12%] lg:mt-24" aria-hidden>
          EduPlatform
        </div>
      </div>
      <div className="relative border-t border-line bg-paper-2">
        <div className="wrap flex flex-col justify-between gap-2 py-6 text-[13.5px] text-ink-3 sm:flex-row">
          <p>{t("ui.copyright", { year })}</p>
          <p>{t("ui.universityName")}</p>
        </div>
      </div>
    </footer>
  );
}

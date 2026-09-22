"use client";

import type { ReactNode } from "react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import { useAuth } from "@/features/auth/hooks";
import { Shield } from "./AztuMark";

const UNIVERSITY_URL = "https://aztu.edu.az";
const SUPPORT_EMAIL = "support@aztu.edu.az";

/**
 * The "back cover": the darkest (night) or quietest (day) surface of the page.
 * A tagline with the university's address and e-mail, three link columns, the
 * giant "EduPlatform" wordmark (decorative, static) and the imprint line.
 * Every link goes somewhere real (D9: no privacy or terms pages exist yet).
 *
 * `year` comes from the server (SiteShell's caller) rather than `new Date()`
 * here: a client clock can disagree with the server's around New Year, and
 * the imprint line would then fail hydration.
 */
export function Footer({ year }: { year: number }) {
  const t = useT();
  // The same test as the header, so both swap together once the session loads.
  const { user, status } = useAuth();
  const signedIn = status === "authenticated" && !!user;
  return (
    <footer className="back mt-auto" aria-labelledby="site-footer-title">
      <h2 id="site-footer-title" className="sr-only">
        {t("footer.siteMap")}
      </h2>
      <div className="wrap pt-20 pb-14 lg:pt-28">
        <div className="g12 gap-y-12">
          <div className="col-span-4 md:col-span-8 lg:col-span-4">
            <p className="t-title-l max-w-[20ch]">{t("footer.tagline")}</p>
            <address className="t-small mt-6 leading-relaxed text-ink-2 not-italic">
              {t("footer.address")}
              <br />
              <a className="link" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </address>
          </div>

          {/* From 1024 the link columns take three tracks each, starting on tracks
              5, 8 and 11: two tracks are narrower than "Ekspert kimi müraciət
              edin", and equal spans keep the three columns evenly spaced. */}
          <FooterColumn title={t("footer.learn")} className="col-span-2 md:col-span-2 lg:col-span-3 lg:col-start-5">
            <FooterLink href="/courses">{t("footer.allCourses")}</FooterLink>
            <FooterLink href="/categories">{t("nav.categories")}</FooterLink>
            <FooterLink href="/experts">{t("nav.experts")}</FooterLink>
            <FooterLink href="/courses?type=ONLINE">{t("ui.onlineCourses")}</FooterLink>
            <FooterLink href="/courses?type=OFFLINE">{t("ui.offlineCourses")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("footer.account")} className="col-span-2 md:col-span-3 lg:col-span-3">
            {signedIn ? (
              <>
                <FooterLink href="/my-courses">{t("nav.myCourses")}</FooterLink>
                <FooterLink href="/profile">{t("nav.profile")}</FooterLink>
              </>
            ) : (
              <>
                <FooterLink href="/login">{t("common.signIn")}</FooterLink>
                <FooterLink href="/register">{t("common.signUp")}</FooterLink>
              </>
            )}
            <FooterLink href="/register/tutor">{t("footer.applyExpert")}</FooterLink>
            <FooterLink href="/dashboard">{t("nav.dashboard")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("footer.university")} className="col-span-4 md:col-span-3 lg:col-span-2">
            <li>
              <a
                className="flink inline-flex items-center gap-1"
                href={UNIVERSITY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("footer.aboutAztu")}
                <ArrowUpRight aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                <span className="sr-only">{t("footer.newTab")}</span>
              </a>
            </li>
            <li>
              <a className="flink" href={`mailto:${SUPPORT_EMAIL}`}>
                {t("footer.contact")}
              </a>
            </li>
          </FooterColumn>
        </div>
      </div>

      <div className="wordmark" aria-hidden="true">
        EduPlatform
      </div>

      <div className="wrap">
        <div className="t-meta flex flex-wrap items-center justify-between gap-4 border-t border-line py-6">
          <span className="inline-flex items-center gap-3">
            <Shield className="h-[22px] w-3 text-shield" />
            {t("footer.rights", { year })}
          </span>
          <a className="link-go font-medium text-ink-2" href="#main">
            {t("ui.backToTop")}
            <ArrowUp aria-hidden="true" strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className={className}>
      <p className="t-kicker mb-3 text-ink-3">{title}</p>
      <ul className="grid">{children}</ul>
    </nav>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <LocaleLink className="flink" href={href}>
        {children}
      </LocaleLink>
    </li>
  );
}

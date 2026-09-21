"use client";

import { Globe, Mail, ArrowUpRight } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import { AztuMark } from "./AztuMark";
import { Logo } from "./Logo";

const UNIVERSITY_URL = "https://aztu.edu.az";
const SUPPORT_EMAIL = "support@aztu.edu.az";

/**
 * A contained navy panel rather than a full-bleed band — the same rounded
 * object as the hero and the closing call to action, resting on the page with
 * a gutter all round.
 */
export function Footer() {
  const t = useT();
  return (
    <footer className="container-fluid mt-auto pb-3 pt-6 sm:pb-4 sm:pt-8">
      <div className="surface-deep overflow-hidden rounded-4xl">
        <div className="grid gap-12 px-6 pb-10 pt-12 sm:px-10 lg:grid-cols-12 lg:gap-8 lg:px-14 lg:pb-14 lg:pt-16">
          <div className="lg:col-span-5">
            <LocaleLink
              href="/"
              aria-label="AzTU EduPlatform"
              className="inline-flex rounded-2xl"
            >
              <Logo tone="onDeep" />
            </LocaleLink>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/65">
              {t("footer.blurb")}
            </p>
            <div className="mt-6 flex gap-2">
              <IconLink href={UNIVERSITY_URL} label={t("footer.websiteLabel")} external>
                <Globe className="size-4" />
              </IconLink>
              <IconLink href={`mailto:${SUPPORT_EMAIL}`} label={t("footer.emailLabel")}>
                <Mail className="size-4" />
              </IconLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 sm:gap-y-10 lg:col-span-7">
            <FooterColumn title={t("footer.learn")}>
              <FooterLink href="/courses">{t("footer.allCourses")}</FooterLink>
              <FooterLink href="/experts">{t("nav.experts")}</FooterLink>
              <FooterLink href="/categories">{t("nav.categories")}</FooterLink>
            </FooterColumn>

            <FooterColumn title={t("footer.account")}>
              <FooterLink href="/login">{t("common.signIn")}</FooterLink>
              <FooterLink href="/register">{t("common.signUp")}</FooterLink>
              <FooterLink href="/dashboard">{t("nav.dashboard")}</FooterLink>
            </FooterColumn>

            <FooterColumn title={t("footer.university")}>
              <ExternalLink href={UNIVERSITY_URL}>{t("footer.aboutAztu")}</ExternalLink>
              <ExternalLink href={`mailto:${SUPPORT_EMAIL}`}>
                {t("footer.contact")}
              </ExternalLink>
            </FooterColumn>
          </div>
        </div>

        <div className="mx-6 flex flex-col gap-3 border-t border-white/10 py-6 text-[13px] text-white/50 sm:mx-10 sm:flex-row sm:items-center sm:justify-between lg:mx-14">
          <div>{t("footer.rights", { year: new Date().getFullYear() })}</div>
          <a
            href={UNIVERSITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 self-start transition-colors hover:text-white sm:min-h-0 sm:self-auto"
          >
            <span aria-hidden className="inline-flex opacity-80">
              <AztuMark tone="onDeep" className="size-4" />
            </span>
            {t("home.university")}
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-white sm:mb-4">
        <span aria-hidden className="size-1.5 rounded-full bg-gold-400" />
        {title}
      </h3>
      {/* On phones each link is a 40px row (the tap-target minimum) with no
          gap between; from sm the links are text-height and spaced out. */}
      <ul className="text-sm sm:space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <LocaleLink
        href={href}
        className="inline-flex min-h-10 items-center rounded-md text-white/60 transition-colors hover:text-white sm:min-h-0"
      >
        {children}
      </LocaleLink>
    </li>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group inline-flex min-h-10 items-center gap-1 rounded-md text-white/60 transition-colors hover:text-white sm:min-h-0"
      >
        {children}
        {external ? (
          <ArrowUpRight className="size-3.5 opacity-50 transition-[opacity,transform] duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
        ) : null}
      </a>
    </li>
  );
}

function IconLink({
  href,
  label,
  external,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="grid size-11 place-items-center rounded-2xl bg-white/[0.07] text-white/75 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15 hover:text-white hover:ring-gold-400/50"
    >
      {children}
    </a>
  );
}

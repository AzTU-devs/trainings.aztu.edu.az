"use client";

import { Globe, Mail, ArrowUpRight } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import { Logo } from "./Logo";

const UNIVERSITY_URL = "https://aztu.edu.az";
const SUPPORT_EMAIL = "support@aztu.edu.az";

export function Footer() {
  const t = useT();
  return (
    <footer className="surface-deep mt-auto">
      <div className="container-fluid grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="space-y-5 lg:col-span-5">
          <Logo tone="onDeep" />
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            {t("footer.tagline")}
          </p>
          <div className="flex gap-2 pt-1">
            <IconLink
              href={UNIVERSITY_URL}
              label={t("footer.websiteLabel")}
              external
            >
              <Globe className="size-4" />
            </IconLink>
            <IconLink href={`mailto:${SUPPORT_EMAIL}`} label={t("footer.emailLabel")}>
              <Mail className="size-4" />
            </IconLink>
          </div>
        </div>

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

        <FooterColumn title={t("footer.company")}>
          <ExternalLink href={UNIVERSITY_URL}>{t("footer.about")}</ExternalLink>
          <ExternalLink href={`mailto:${SUPPORT_EMAIL}`}>
            {t("footer.contact")}
          </ExternalLink>
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className="container-fluid flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/45 sm:flex-row">
          <div>{t("footer.rights", { year: new Date().getFullYear() })}</div>
          <div>{t("footer.madeFor")}</div>
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
    <div className="lg:col-span-2 xl:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden className="h-px w-4 bg-gold-500/70" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
          {title}
        </h3>
      </div>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <LocaleLink
        href={href}
        className="text-white/60 transition-colors hover:text-white"
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
        className="group inline-flex items-center gap-1 text-white/60 transition-colors hover:text-white"
      >
        {children}
        {external ? (
          <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
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
      className="grid size-10 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-gold-500/50 hover:bg-white/10 hover:text-white"
    >
      {children}
    </a>
  );
}

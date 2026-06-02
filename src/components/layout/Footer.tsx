"use client";

import { Globe, Mail, MessageCircle } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import { Logo } from "./Logo";

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-auto border-t border-border/60 bg-gradient-to-b from-muted/20 to-background">
      <div className="container-fluid grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("footer.tagline")}
          </p>
          <div className="flex gap-2 pt-2">
            <a
              className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              href="#"
              aria-label="Community"
            >
              <MessageCircle className="size-4" />
            </a>
            <a
              className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              href="#"
              aria-label="Website"
            >
              <Globe className="size-4" />
            </a>
            <a
              className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              href="mailto:hello@eduplatform.test"
              aria-label="Email"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="font-semibold">{t("footer.learn")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <LocaleLink href="/courses" className="hover:text-foreground">
                {t("footer.allCourses")}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/categories" className="hover:text-foreground">
                {t("nav.categories")}
              </LocaleLink>
            </li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <div className="font-semibold">{t("footer.account")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <LocaleLink href="/login" className="hover:text-foreground">
                {t("common.signIn")}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/register" className="hover:text-foreground">
                {t("common.signUp")}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/dashboard" className="hover:text-foreground">
                {t("nav.dashboard")}
              </LocaleLink>
            </li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <div className="font-semibold">{t("footer.company")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>{t("footer.about")}</li>
            <li>{t("footer.contact")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-fluid flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} EduPlatform. All rights reserved.</div>
          <div>Made for learners everywhere.</div>
        </div>
      </div>
    </footer>
  );
}

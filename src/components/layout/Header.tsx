"use client";

import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useLogout } from "@/features/auth/hooks";
import { fullName } from "@/types/user";
import { useT, useLocale } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import { useUnreadCount } from "@/features/notification/hooks";

export function Header() {
  const { user, status } = useAuth();
  const logout = useLogout();
  const t = useT();
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: unread } = useUnreadCount(status === "authenticated");
  const unreadCount = unread?.count ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="container-fluid flex h-16 items-center gap-3">
        <LocaleLink href="/" aria-label="EduPlatform" className="shrink-0">
          <Logo />
        </LocaleLink>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          <LocaleLink
            href="/courses"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("nav.courses")}
          </LocaleLink>
          <LocaleLink
            href="/categories"
            className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("nav.categories")}
            <ChevronDown className="size-3.5" />
          </LocaleLink>
        </nav>

        <form
          action={localeHref(locale, "/courses")}
          className="relative ml-auto hidden max-w-md flex-1 md:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder={t("common.search")}
            className="h-10 rounded-full bg-muted/50 pl-10 pr-3"
            aria-label={t("common.search")}
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <LocaleSwitcher />

          {status === "authenticated" && user ? (
            <>
              <LocaleLink
                href="/notifications"
                className="relative grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={t("nav.notifications")}
              >
                <Bell className="size-4" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </LocaleLink>
              <LocaleLink href="/dashboard" className="hidden md:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <span
                    aria-hidden
                    className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-semibold text-white"
                  >
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </span>
                  <span className="max-w-[12ch] truncate">{fullName(user)}</span>
                </Button>
              </LocaleLink>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout.mutate()}
                loading={logout.isPending}
                className="hidden md:inline-flex"
              >
                {t("common.signOut")}
              </Button>
            </>
          ) : (
            <>
              <LocaleLink href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  {t("common.signIn")}
                </Button>
              </LocaleLink>
              <LocaleLink href="/register" className="hidden sm:block">
                <Button size="sm">{t("common.signUp")}</Button>
              </LocaleLink>
            </>
          )}

          <button
            type="button"
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "lg:hidden",
          mobileOpen ? "block" : "hidden",
          "border-t border-border/60 bg-background",
        )}
      >
        <div className="container-fluid space-y-1 py-3">
          <form action={localeHref(locale, "/courses")} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder={t("common.search")}
              className="h-10 rounded-full bg-muted/50 pl-10 pr-3"
            />
          </form>
          <LocaleLink
            href="/courses"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.courses")}
          </LocaleLink>
          <LocaleLink
            href="/categories"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.categories")}
          </LocaleLink>
          {status === "authenticated" && user ? (
            <>
              <LocaleLink
                href="/dashboard"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.dashboard")}
              </LocaleLink>
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-accent"
                onClick={() => {
                  setMobileOpen(false);
                  logout.mutate();
                }}
              >
                {t("common.signOut")}
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <LocaleLink href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">
                  {t("common.signIn")}
                </Button>
              </LocaleLink>
              <LocaleLink href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">{t("common.signUp")}</Button>
              </LocaleLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

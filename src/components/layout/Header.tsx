"use client";

import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [scrolled, setScrolled] = useState(false);
  const { data: unread } = useUnreadCount(status === "authenticated");
  const unreadCount = unread?.count ?? 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change should never leave the mobile sheet hanging open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => window.innerWidth >= 1024 && setMobileOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 glass-nav transition-[box-shadow,border-color] duration-300",
        scrolled
          ? "border-b border-border elev-2"
          : "border-b border-transparent",
      )}
    >
      <div className="container-fluid flex h-[72px] items-center gap-4">
        <LocaleLink href="/" aria-label="AzTU EduPlatform" className="shrink-0">
          <Logo />
        </LocaleLink>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <NavItem href="/courses" label={t("nav.courses")} />
          <NavItem href="/experts" label={t("nav.experts")} />
          <NavItem href="/categories" label={t("nav.categories")} icon />
        </nav>

        <form
          action={localeHref(locale, "/courses")}
          className="relative ml-auto hidden w-full max-w-sm md:block"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            placeholder={t("common.search")}
            aria-label={t("common.search")}
            className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-10 pr-4 text-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-2">
          <LocaleSwitcher />

          {status === "authenticated" && user ? (
            <>
              <LocaleLink
                href="/notifications"
                className="relative grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={t("nav.notifications")}
              >
                <Bell className="size-[18px]" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </LocaleLink>
              <LocaleLink href="/dashboard" className="hidden md:block">
                <Button variant="ghost" size="sm" className="gap-2 pl-1.5">
                  <span
                    aria-hidden
                    className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
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
            className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </button>
        </div>
      </div>

      {/* A hairline of brand gold sits under the bar once it detaches from the
          top of the page — a quiet cue that the header is now floating. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "border-t border-border bg-background lg:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <div className="container-fluid space-y-1 py-4">
          <form action={localeHref(locale, "/courses")} className="relative mb-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              placeholder={t("common.search")}
              aria-label={t("common.search")}
              className="h-11 w-full rounded-full border border-border bg-secondary/60 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
            />
          </form>
          <MobileLink href="/courses" onClick={() => setMobileOpen(false)}>
            {t("nav.courses")}
          </MobileLink>
          <MobileLink href="/experts" onClick={() => setMobileOpen(false)}>
            {t("nav.experts")}
          </MobileLink>
          <MobileLink href="/categories" onClick={() => setMobileOpen(false)}>
            {t("nav.categories")}
          </MobileLink>
          {status === "authenticated" && user ? (
            <>
              <MobileLink href="/dashboard" onClick={() => setMobileOpen(false)}>
                {t("nav.dashboard")}
              </MobileLink>
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-accent"
                onClick={() => {
                  setMobileOpen(false);
                  logout.mutate();
                }}
              >
                {t("common.signOut")}
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-3">
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

function NavItem({ href, label, icon }: { href: string; label: string; icon?: boolean }) {
  return (
    <LocaleLink
      href={href}
      className="group relative flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      {icon ? <ChevronDown className="size-3.5 opacity-60" /> : null}
      <span
        aria-hidden
        className="absolute inset-x-3.5 bottom-1 h-[2px] origin-left scale-x-0 rounded-full bg-gold-500 transition-transform duration-300 group-hover:scale-x-100"
      />
    </LocaleLink>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <LocaleLink
      href={href}
      className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
      onClick={onClick}
    >
      {children}
    </LocaleLink>
  );
}

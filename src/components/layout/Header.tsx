"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, Globe, LogOut, Menu, Search, Settings, X, LayoutDashboard, BookOpen, ArrowRight } from "lucide-react";
import { useAuth, useLogout } from "@/features/auth/hooks";
import { useUnreadCount } from "@/features/notification/hooks";
import { useLocale, useT } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { swatchSvg, type ArtKind } from "@/lib/art";
import { cn } from "@/lib/utils/cn";
import { fullName, type User } from "@/types/user";
import { useSwitchLocale } from "./LocaleSwitcher";

/*
 * The site header for the "Bright" design.
 *
 * Sticky. Over the home page's hero it starts transparent and condenses into a
 * translucent bar once the page scrolls; everywhere else it starts in that
 * solid state. Desktop has the categories menu (a panel of subject areas with
 * their counts); below `lg` everything moves into a sheet that slides in from
 * the right.
 */

type SiteCategory = {
  id: string;
  name: string;
  count: number;
  countLabel: string;
  k: string;
  art: ArtKind;
};

function useSiteCategories(enabled: boolean) {
  const locale = useLocale();
  return useQuery({
    queryKey: ["site-categories", locale],
    queryFn: async () => {
      const res = await fetch(`/api/site/categories?lang=${locale}`);
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as { items: SiteCategory[]; total: number };
    },
    enabled,
    staleTime: 60_000,
  });
}

/** The path without its locale prefix, for matching nav items. */
function logicalPath(pathname: string): string {
  const parts = pathname.split("/");
  if (parts[1] && (locales as readonly string[]).includes(parts[1])) parts.splice(1, 1);
  return parts.join("/") || "/";
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <LocaleLink href="/" className="brand" aria-label="AzTU EduPlatform" onClick={onNavigate}>
      <Image className="logo-l" src="/brand/aztu-mark.png" alt="" width={18} height={34} priority />
      <Image className="logo-d" src="/brand/aztu-mark-white.png" alt="" width={18} height={34} priority />
      <span className="wm">
        <small>AZTU</small>
        <b>EduPlatform</b>
      </span>
    </LocaleLink>
  );
}

function initials(user: User) {
  const n = fullName(user) || user.email;
  return n
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .replace(/i/g, "İ")
    .replace(/ı/g, "I")
    .toUpperCase();
}

export function Header() {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const path = logicalPath(pathname);
  const isHome = path === "/";
  const { user, status } = useAuth();
  const signedIn = status === "authenticated" && !!user;
  const logout = useLogout();
  const { data: unreadData } = useUnreadCount(signedIn);
  const unread = unreadData?.count ?? 0;
  const switchLocale = useSwitchLocale();

  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const megaId = useId();
  const menuId = useId();
  const userMenuId = useId();

  const cats = useSiteCategories(megaOpen || menuOpen);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Navigating closes every panel. Adjusted during render rather than in an
  // effect, so the closed state is what the new page first renders with.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMegaOpen(false);
    setMenuOpen(false);
    setUserOpen(false);
  }

  // Escape and an outside click close the desktop popovers.
  useEffect(() => {
    if (!megaOpen && !userOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setUserOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setMegaOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [megaOpen, userOpen]);

  const navCls = (active: boolean) => cn("nav-link", active && "font-semibold");

  return (
    <>
      <header
        ref={headerRef}
        className={cn("site-header", (!isHome || scrolled) && "is-scrolled")}
      >
        <div className="wrap relative">
          <div className="bar flex items-center gap-1">
            <span className="mr-3 xl:mr-7">
              <Brand />
            </span>

            {/* Four items plus the account cluster only just fit at lg, so the
                links run a little tighter until xl. */}
            <nav
              aria-label={t("ui.mainNav")}
              className="hidden items-center gap-0.5 lg:flex lg:[&>.nav-link]:px-3 xl:[&>.nav-link]:px-3.5"
            >
              <LocaleLink
                className={navCls(path.startsWith("/courses"))}
                aria-current={path.startsWith("/courses") ? "page" : undefined}
                href="/courses"
              >
                {t("ui.navCourses")}
              </LocaleLink>
              <button
                className="nav-link"
                type="button"
                aria-expanded={megaOpen}
                aria-controls={megaId}
                onClick={() => {
                  setUserOpen(false);
                  setMegaOpen((v) => !v);
                }}
              >
                {t("ui.navCategories")} <ChevronDown className="i" aria-hidden />
              </button>
              <LocaleLink
                className={navCls(path.startsWith("/experts"))}
                aria-current={path.startsWith("/experts") ? "page" : undefined}
                href="/experts"
              >
                {t("ui.navExperts")}
              </LocaleLink>
              <LocaleLink
                className={navCls(path.startsWith("/rooms"))}
                aria-current={path.startsWith("/rooms") ? "page" : undefined}
                href="/rooms"
              >
                {t("ui.navRooms")}
              </LocaleLink>
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Between lg and xl the four nav items leave no room for the
                  search field, so it collapses to its icon there. */}
              <LocaleLink
                href="/courses"
                className="search-trigger hidden md:inline-flex md:w-[200px] lg:hidden xl:inline-flex xl:w-[250px]"
              >
                <Search className="i" aria-hidden />
                <span>{t("ui.searchCourses")}</span>
              </LocaleLink>
              <LocaleLink
                href="/courses"
                className="btn-icon md:hidden lg:inline-grid xl:hidden"
                aria-label={t("ui.searchCourses")}
              >
                <Search className="i" aria-hidden />
              </LocaleLink>

              <button
                className="nav-link hidden !px-3 lg:inline-flex"
                type="button"
                lang={locale === "az" ? "en" : "az"}
                onClick={() => switchLocale(locale === "az" ? "en" : "az")}
                aria-label={t("ui.switchLanguage")}
              >
                <Globe className="i" aria-hidden />
                {locale.toUpperCase()}
              </button>

              {signedIn ? (
                <>
                  <LocaleLink className="nav-link hidden lg:inline-flex" href="/my-courses">
                    {t("ui.myCourses")}
                  </LocaleLink>
                  <LocaleLink
                    href="/notifications"
                    className="btn-icon relative"
                    aria-label={t("ui.notifications")}
                  >
                    <Bell className="i" aria-hidden />
                    {unread > 0 ? (
                      <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-4 text-[var(--on-gold)]">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                  </LocaleLink>
                  <div className="relative hidden lg:block">
                    <button
                      type="button"
                      className="av round k-data ml-1 size-10 bg-[var(--k-200)] text-[14px]"
                      aria-label={t("ui.accountMenu")}
                      aria-expanded={userOpen}
                      aria-controls={userMenuId}
                      onClick={() => {
                        setMegaOpen(false);
                        setUserOpen((v) => !v);
                      }}
                    >
                      <span className="ini">{initials(user)}</span>
                    </button>
                    {userOpen ? (
                      <div
                        id={userMenuId}
                        className="mega-panel absolute right-0 top-[calc(100%+10px)] w-64 animate-pop-in"
                      >
                        <div className="px-3 pb-3 pt-2">
                          <p className="truncate font-semibold">{fullName(user) || user.email}</p>
                          <p className="truncate text-[13px] text-ink-3">{user.email}</p>
                        </div>
                        <div className="grid gap-0.5 border-t border-line pt-2">
                          <UserLink href="/dashboard" icon={<LayoutDashboard className="i" aria-hidden />}>
                            {t("ui.dashboard")}
                          </UserLink>
                          <UserLink href="/my-courses" icon={<BookOpen className="i" aria-hidden />}>
                            {t("ui.myCourses")}
                          </UserLink>
                          <UserLink href="/settings" icon={<Settings className="i" aria-hidden />}>
                            {t("ui.settings")}
                          </UserLink>
                          <button
                            type="button"
                            className="flex h-11 items-center gap-3 rounded-[14px] px-3 text-left text-[15px] text-ink-2 hover:bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] hover:text-ink"
                            onClick={() => logout.mutate()}
                          >
                            <LogOut className="i" aria-hidden />
                            {t("ui.signOut")}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : status === "loading" || status === "idle" ? (
                // The session is still being restored; reserve the space rather
                // than flash "Sign in" at someone who is signed in.
                <span className="hidden h-10 w-44 sm:inline-block" aria-hidden />
              ) : (
                <>
                  <LocaleLink className="btn btn-quiet hidden lg:inline-flex" href="/login">
                    {t("ui.signIn")}
                  </LocaleLink>
                  <LocaleLink className="btn btn-primary btn-sm hidden sm:inline-flex" href="/register">
                    {t("ui.register")}
                  </LocaleLink>
                </>
              )}

              <button
                className="btn-icon lg:hidden"
                type="button"
                aria-label={t("ui.menuOpen")}
                aria-controls={menuId}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="i" aria-hidden />
              </button>
            </div>
          </div>

          <div className={cn("mega hidden lg:block", megaOpen && "open")} id={megaId}>
            <div className="mega-panel grid grid-cols-[1fr_300px] gap-3">
              <div>
                <p className="kicker px-3 pb-3 pt-2">
                  <span className="rule" />
                  {t("ui.megaKicker")}
                </p>
                <div className="grid grid-cols-2 gap-1 xl:grid-cols-4">
                  {cats.data?.items.map((c) => (
                    <LocaleLink
                      key={c.id}
                      href={`/courses?categoryId=${c.id}`}
                      className={cn("mega-item", c.k)}
                    >
                      <span
                        className="sw-sq"
                        aria-hidden
                        dangerouslySetInnerHTML={{ __html: swatchSvg(c.art) }}
                      />
                      <span>
                        <b className="block text-[15px] font-semibold leading-tight">{c.name}</b>
                        <small className="mt-1 block text-[13px] text-ink-3">{c.countLabel}</small>
                      </span>
                    </LocaleLink>
                  ))}
                  {cats.isError ? (
                    <p className="col-span-full px-3 py-4 text-[14px] text-ink-3">{t("ui.categoriesUnavailable")}</p>
                  ) : null}
                </div>
              </div>
              <LocaleLink
                href="/courses"
                className="group relative flex flex-col overflow-hidden rounded-[22px] bg-navy-tint p-6"
              >
                <span className="kicker">{t("ui.megaCatalogKicker")}</span>
                <span className="mt-3 font-display text-[26px] font-extrabold leading-tight tracking-tight">
                  {t("ui.megaCatalogTitle")}
                </span>
                <span className="mt-2 text-[14px] text-ink-2">{t("ui.megaCatalogText")}</span>
                <span className="link mt-auto pt-6">
                  {t("ui.megaCatalogLink")} <ArrowRight className="i" aria-hidden />
                </span>
              </LocaleLink>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        id={menuId}
        path={path}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        categories={cats.data?.items ?? []}
        signedIn={signedIn}
        onSignOut={() => logout.mutate()}
        onLocale={(l) => switchLocale(l)}
      />
    </>
  );
}

function UserLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <LocaleLink
      href={href}
      className="flex h-11 items-center gap-3 rounded-[14px] px-3 text-[15px] text-ink-2 hover:bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] hover:text-ink"
    >
      {icon}
      {children}
    </LocaleLink>
  );
}

function MobileMenu({
  id,
  path,
  open,
  onOpenChange,
  categories,
  signedIn,
  onSignOut,
  onLocale,
}: {
  id: string;
  /** The current path without its locale, for marking the current section. */
  path: string;
  open: boolean;
  /** The state setter itself: stable, so the effect below runs only on open/close. */
  onOpenChange: (open: boolean) => void;
  categories: SiteCategory[];
  signedIn: boolean;
  onSignOut: () => void;
  onLocale: (l: Locale) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const onClose = () => onOpenChange(false);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  const order: Locale[] = [...locales].sort((a, b) => Number(b === "az") - Number(a === "az"));

  return (
    <div
      className={cn("sheet right lg:hidden", open && "open")}
      id={id}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label={t("ui.menu")}
      inert={!open}
    >
      <div className="scrim" onClick={onClose} />
      <div className="panel outline-none" tabIndex={-1} ref={panelRef}>
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
          <Brand onNavigate={onClose} />
          <button className="btn-icon" type="button" onClick={onClose} aria-label={t("ui.menuClose")}>
            <X className="i" aria-hidden />
          </button>
        </div>
        <nav className="flex flex-col px-5 py-4" aria-label={t("ui.mobileNav")}>
          {(
            [
              ["/courses", t("ui.navCourses")],
              ["/experts", t("ui.navExperts")],
              ["/rooms", t("ui.navRooms")],
            ] as const
          ).map(([href, label]) => {
            const current = path.startsWith(href);
            return (
              <LocaleLink
                key={href}
                href={href}
                onClick={onClose}
                aria-current={current ? "page" : undefined}
                className="flex items-center gap-3 py-2.5 font-display text-[28px] font-bold tracking-tight"
              >
                {label}
                {current ? <span className="size-2 rounded-full bg-gold" aria-hidden /> : null}
              </LocaleLink>
            );
          })}
          {signedIn ? (
            <LocaleLink href="/dashboard" onClick={onClose} className="py-2.5 font-display text-[28px] font-bold tracking-tight">
              {t("ui.dashboard")}
            </LocaleLink>
          ) : null}
          <p className="kicker mb-2 mt-6">
            <span className="rule" />
            {t("ui.navCategories")}
          </p>
          {categories.map((c) => (
            <LocaleLink
              key={c.id}
              href={`/courses?categoryId=${c.id}`}
              onClick={onClose}
              className={cn("flex items-center gap-3 py-2", c.k)}
            >
              <span
                className="sw-sq !size-10 !rounded-[12px]"
                aria-hidden
                dangerouslySetInnerHTML={{ __html: swatchSvg(c.art) }}
              />
              <span className="text-[15px] font-medium">{c.name}</span>
              <span className="ml-auto text-[13px] text-ink-3">{c.count || ""}</span>
            </LocaleLink>
          ))}
        </nav>
        <div className="mt-auto grid shrink-0 gap-3 border-t border-line p-5">
          <div className="seg full" role="radiogroup" aria-label={t("ui.language")}>
            {order.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                lang={l}
                aria-checked={l === locale}
                onClick={() => onLocale(l)}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
          {signedIn ? (
            <button type="button" className="btn btn-ghost" onClick={onSignOut}>
              <LogOut className="i" aria-hidden />
              {t("ui.signOut")}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <LocaleLink href="/login" onClick={onClose} className="btn btn-ghost">
                {t("ui.signIn")}
              </LocaleLink>
              <LocaleLink href="/register" onClick={onClose} className="btn btn-primary">
                {t("ui.register")}
              </LocaleLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

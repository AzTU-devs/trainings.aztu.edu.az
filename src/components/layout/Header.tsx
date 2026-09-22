"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth, useLogout } from "@/features/auth/hooks";
import { useUnreadCount } from "@/features/notification/hooks";
import { useT } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { isLocale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { CategoriesMega } from "./header/CategoriesMega";
import { MobileMenu } from "./header/MobileMenu";
import { SearchOverlay } from "./header/SearchOverlay";
import { UserMenu } from "./header/UserMenu";
import { NAV_ITEM } from "./header/navItem";

const ICON_BTN =
  "relative grid size-11 shrink-0 place-items-center rounded-full text-ink transition-colors duration-(--dur-1) hover:bg-paper-2 [&>svg]:size-[22px]";

/**
 * The site header: a full-width paper bar (86% with a blur) that condenses
 * from 72px to 60px once the page scrolls, with a hairline under it. It holds
 * the brand, the nav (Kurslar · Kateqoriyalar ▾ · Ekspertlər), the search
 * trigger ("/" opens it), the language switch and the account actions; below
 * 1024px a menu button opens the full-screen menu.
 *
 * The menu and the search overlay are rendered as siblings of <header>, not
 * inside it: the bar's backdrop-filter would otherwise become the containing
 * block of their `position: fixed`.
 */
export function Header() {
  const { user, status } = useAuth();
  const logout = useLogout();
  const router = useRouter();
  const t = useT();
  const pathname = usePathname();
  const signedIn = status === "authenticated" && !!user;
  const { data: unread } = useUnreadCount(status === "authenticated");
  const unreadCount = unread?.count ?? 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchReturnRef = useRef<HTMLElement | null>(null);

  // Signing out clears the client session, but a page the server rendered for
  // the signed-in visitor (the dashboard, "Kurslarım") would stay on screen
  // until the next navigation. Re-rendering the route lets its server guard
  // send the visitor to the login page; a public page just renders again,
  // signed out.
  const { mutate: mutateLogout } = logout;
  const signOut = useCallback(
    () => mutateLogout(undefined, { onSettled: () => router.refresh() }),
    [mutateLogout, router],
  );

  // The path without its locale prefix, so "/az/courses/x" matches "/courses".
  const path = stripLocale(pathname);
  const isActive = useCallback((href: string) => path === href || path.startsWith(`${href}/`), [path]);

  // Condense once the page has scrolled: a class on <html> (not React state),
  // so the brand, the bar height and every `top-(--hdr)` sticky element follow
  // in CSS without re-rendering. Passive and throttled to one write a frame.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      document.documentElement.classList.toggle("hdr-stuck", window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // The menu exists only below 1024px; widening the window closes it.
  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => window.innerWidth >= 1024 && setMenuOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  // "/" opens the search, unless the visitor is typing somewhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return;
      e.preventDefault();
      searchReturnRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setSearchOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const openSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    searchReturnRef.current = e.currentTarget;
    setSearchOpen(true);
  };
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-transparent transition-[border-color] duration-(--dur-2) [.hdr-stuck_&]:border-line",
          "bg-[color-mix(in_srgb,var(--c-paper)_86%,transparent)] backdrop-blur-[16px] backdrop-saturate-[1.4]",
        )}
      >
        {/* Not `relative`: the mega panel positions against the sticky header, so it spans the bar. */}
        <div className="wrap flex h-(--hdr) items-center gap-4 transition-[height] duration-(--dur-2) ease-out lg:gap-6">
          <LocaleLink href="/" aria-label="AzTU EduPlatform" className="shrink-0">
            <Logo />
          </LocaleLink>

          <nav aria-label={t("nav.mainNav")} className="hidden items-center gap-0.5 lg:flex">
            <LocaleLink
              href="/courses"
              aria-current={isActive("/courses") ? "page" : undefined}
              className={NAV_ITEM}
            >
              {t("nav.courses")}
            </LocaleLink>
            <CategoriesMega active={isActive("/categories")} />
            <LocaleLink
              href="/experts"
              aria-current={isActive("/experts") ? "page" : undefined}
              className={NAV_ITEM}
            >
              {t("nav.experts")}
            </LocaleLink>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-2">
            <button
              type="button"
              onClick={openSearch}
              aria-haspopup="dialog"
              className="hidden h-10 w-60 items-center gap-2.5 rounded-full border border-line-2 px-3.5 text-[15px] text-ink-3 transition-colors duration-(--dur-1) hover:border-ink hover:text-ink-2 xl:inline-flex"
            >
              <Search aria-hidden="true" strokeWidth={1.75} className="size-[18px] shrink-0" />
              <span className="truncate">{t("common.search")}</span>
              <kbd className="ml-auto rounded-[4px] border border-line-2 px-1.5 font-mono text-xs leading-5" aria-hidden="true">
                /
              </kbd>
            </button>

            <LocaleSwitcher className="hidden lg:inline-flex" />

            {signedIn ? (
              <>
                <LocaleLink
                  href="/notifications"
                  aria-current={isActive("/notifications") ? "page" : undefined}
                  aria-label={t("nav.notifications")}
                  className={cn(ICON_BTN, "aria-[current=page]:bg-paper-2")}
                >
                  <Bell aria-hidden="true" strokeWidth={1.75} />
                  {unreadCount > 0 ? (
                    <span className="absolute top-1 right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-xs leading-none font-semibold text-on-status ring-2 ring-paper">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </LocaleLink>
                <UserMenu
                  user={user}
                  onSignOut={signOut}
                  signingOut={logout.isPending}
                  className="hidden md:block"
                />
              </>
            ) : (
              <>
                <LocaleLink
                  href="/login"
                  className={cn(buttonVariants({ variant: "quiet", size: "sm" }), "hidden lg:inline-flex")}
                >
                  {t("common.signIn")}
                </LocaleLink>
                <LocaleLink href="/register" className={cn(buttonVariants({ size: "sm" }), "hidden md:inline-flex")}>
                  {t("common.signUp")}
                </LocaleLink>
              </>
            )}

            <button
              type="button"
              onClick={openSearch}
              aria-label={t("ui.searchOpen")}
              aria-haspopup="dialog"
              className={cn(ICON_BTN, "xl:hidden")}
            >
              <Search aria-hidden="true" strokeWidth={1.75} />
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("nav.menu")}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className={cn(ICON_BTN, "lg:hidden")}
            >
              {/* Two long bars, as drawn in the design (lucide's Menu has three short ones). */}
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                <path d="M3.5 9h17M3.5 15h17" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <MobileMenu
          onClose={closeMenu}
          returnFocusRef={menuButtonRef}
          isActive={isActive}
          user={signedIn ? user : null}
          unreadCount={unreadCount}
          onSignOut={signOut}
          signingOut={logout.isPending}
        />
      ) : null}
      {searchOpen ? <SearchOverlay onClose={closeSearch} returnFocusRef={searchReturnRef} /> : null}
    </>
  );
}

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (segments[1] && isLocale(segments[1])) segments.splice(1, 1);
  const rest = segments.join("/");
  return rest === "" ? "/" : rest;
}

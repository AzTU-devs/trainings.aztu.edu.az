"use client";

import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { buttonVariants } from "@/components/ui/button";
import { useAuth, useLogout } from "@/features/auth/hooks";
import type { Category } from "@/features/category/types";
import { categoryLabel } from "@/features/category/label";
import { fullName, type User } from "@/types/user";
import { useT, useLocale } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { isLocale } from "@/i18n/config";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { localeHref } from "@/i18n/href";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { qk } from "@/lib/query/keys";
import { cn } from "@/lib/utils/cn";
import { useUnreadCount } from "@/features/notification/hooks";

/** Soft navy tint that marks the page you are on, in the bar and the sheet. */
const ACTIVE_PILL =
  "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100";

export function Header() {
  const { user, status } = useAuth();
  const logout = useLogout();
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: unread } = useUnreadCount(status === "authenticated");
  const unreadCount = unread?.count ?? 0;
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();
  const signedIn = status === "authenticated" && !!user;

  // The path without its locale prefix, so "/az/courses/x" matches "/courses".
  const path = stripLocale(pathname);
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

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

  // Escape closes the sheet and hands focus back to the button that opened it.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMobileOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // The sheet dims the page, so it has to behave like the modal it looks
  // like: the page underneath must not scroll while it is open. The lock is
  // on <html> (the scrolling element) and is undone on close and unmount.
  // Where the page has a classic scrollbar, its gutter is kept so the layout
  // does not jump sideways when the bar disappears.
  useEffect(() => {
    if (!mobileOpen) return;
    const root = document.documentElement;
    const prev = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    const hasScrollbar = window.innerWidth > root.clientWidth;
    root.style.overflow = "hidden";
    if (hasScrollbar) root.style.scrollbarGutter = "stable";
    return () => {
      root.style.overflow = prev.overflow;
      root.style.scrollbarGutter = prev.gutter;
    };
  }, [mobileOpen]);

  const closeSheet = () => setMobileOpen(false);

  // Tabbing out of the header — past the sheet's last item, into the dimmed
  // page — closes the sheet, the same rule the popovers follow, so focus can
  // never sit on content hidden behind an open sheet. A null relatedTarget
  // is a click on something unfocusable; the scrim handles those.
  const onHeaderBlur = (e: React.FocusEvent) => {
    if (!mobileOpen) return;
    if (e.relatedTarget && !headerRef.current?.contains(e.relatedTarget as Node)) {
      setMobileOpen(false);
    }
  };

  return (
    // The header floats: a rounded bar held 12px off the top of the viewport
    // instead of a full-width strip, so the page reads as objects on a canvas
    // from the very first row.
    <header ref={headerRef} onBlur={onHeaderBlur} className="sticky top-3 z-50 mt-3">
      {mobileOpen ? (
        <div
          aria-hidden
          onClick={closeSheet}
          className="fixed inset-0 -z-10 bg-navy-950/25 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div className="container-fluid">
        <div className="relative">
          <div
            className={cn(
              "glass-bar flex h-16 items-center gap-2 rounded-full border border-border/80 pl-3 pr-2 transition-shadow duration-300 sm:pl-4 dark:border-white/10",
              scrolled || mobileOpen ? "elev-3" : "elev-2",
            )}
          >
            <LocaleLink
              href="/"
              aria-label="AzTU EduPlatform"
              className="shrink-0 rounded-full pr-1"
            >
              <Logo />
            </LocaleLink>

            <nav aria-label={t("nav.mainNav")} className="ml-3 hidden items-center gap-1 lg:flex">
              <NavItem href="/courses" label={t("nav.courses")} active={isActive("/courses")} />
              <NavItem href="/experts" label={t("nav.experts")} active={isActive("/experts")} />
              <CategoriesMenu active={isActive("/categories")} />
            </nav>

            <form
              action={localeHref(locale, "/courses")}
              role="search"
              className="relative ml-auto hidden min-w-0 flex-1 md:block md:max-w-xs xl:max-w-sm"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                placeholder={t("common.search")}
                aria-label={t("common.search")}
                className="h-11 w-full rounded-full border border-border/80 bg-background/70 pl-11 pr-4 text-sm transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary/40 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
              />
            </form>

            <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-1">
              <LocaleSwitcher className="hidden sm:inline-flex" />

              {signedIn ? (
                <>
                  <LocaleLink
                    href="/notifications"
                    className={cn(
                      "relative grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      isActive("/notifications") && ACTIVE_PILL,
                    )}
                    aria-label={t("nav.notifications")}
                  >
                    <Bell className="size-[18px]" />
                    {unreadCount > 0 ? (
                      <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-card">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </LocaleLink>
                  <UserMenu
                    user={user}
                    onSignOut={() => logout.mutate()}
                    signingOut={logout.isPending}
                    className="hidden md:block"
                  />
                </>
              ) : (
                <>
                  <LocaleLink
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "hidden h-10 sm:inline-flex",
                    )}
                  >
                    {t("common.signIn")}
                  </LocaleLink>
                  <LocaleLink
                    href="/register"
                    className={cn(buttonVariants({ size: "sm" }), "hidden h-10 sm:inline-flex")}
                  >
                    {t("common.signUp")}
                  </LocaleLink>
                </>
              )}

              <button
                ref={menuButtonRef}
                type="button"
                className={cn(
                  "grid size-11 place-items-center rounded-full transition-colors lg:hidden",
                  mobileOpen
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent",
                )}
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.menu")}
                aria-expanded={mobileOpen}
                aria-controls={sheetId}
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>

          {/* The mobile sheet — a rounded card that drops from the bar,
              holding everything the bar has no room for below lg. */}
          <div
            id={sheetId}
            className={cn(
              "absolute inset-x-0 top-full mt-2 max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain rounded-3xl border border-border/80 bg-popover p-3 elev-4 lg:hidden",
              mobileOpen ? "animate-pop-in block" : "hidden",
            )}
          >
            <form action={localeHref(locale, "/courses")} role="search" className="relative md:hidden">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                placeholder={t("common.search")}
                aria-label={t("common.search")}
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-[15px] placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
              />
            </form>

            <nav aria-label={t("nav.mainNav")} className="mt-2 grid gap-1 md:mt-0">
              <SheetLink
                href="/courses"
                icon={BookOpen}
                active={isActive("/courses")}
                onClick={closeSheet}
              >
                {t("nav.courses")}
              </SheetLink>
              <SheetLink
                href="/experts"
                icon={Users}
                active={isActive("/experts")}
                onClick={closeSheet}
              >
                {t("nav.experts")}
              </SheetLink>
              <SheetLink
                href="/categories"
                icon={LayoutGrid}
                active={isActive("/categories")}
                onClick={closeSheet}
              >
                {t("nav.categories")}
              </SheetLink>
            </nav>

            {signedIn ? (
              <div className="mt-2 border-t border-border pt-2">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Initials user={user} className="size-10 text-sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{fullName(user)}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="grid gap-1">
                  <SheetLink
                    href="/dashboard"
                    icon={LayoutDashboard}
                    active={isActive("/dashboard")}
                    onClick={closeSheet}
                  >
                    {t("nav.dashboard")}
                  </SheetLink>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    onClick={() => {
                      setMobileOpen(false);
                      logout.mutate();
                    }}
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-destructive/10">
                      <LogOut className="size-[18px]" />
                    </span>
                    {t("common.signOut")}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-muted/70 py-1.5 pl-4 pr-1.5">
              <span className="text-sm font-medium text-muted-foreground">{t("nav.language")}</span>
              <LocaleSwitcher variant="segmented" className="bg-background/80" />
            </div>

            {!signedIn ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
                <LocaleLink
                  href="/login"
                  onClick={closeSheet}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("common.signIn")}
                </LocaleLink>
                <LocaleLink href="/register" onClick={closeSheet} className={buttonVariants()}>
                  {t("common.signUp")}
                </LocaleLink>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (segments[1] && isLocale(segments[1])) segments.splice(1, 1);
  const rest = segments.join("/");
  return rest === "" ? "/" : rest;
}

const PILL =
  "inline-flex h-10 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors duration-200";

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <LocaleLink
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        PILL,
        active ? ACTIVE_PILL : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {label}
    </LocaleLink>
  );
}

/**
 * Shared behaviour for the two header popovers: outside press and Escape
 * close it (Escape also returns focus to the trigger), and tabbing out of it
 * closes it so a keyboard user never leaves a panel open behind them.
 */
function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items = () =>
    Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
    );

  // Arrow keys walk the panel's links, so a long list needs no tabbing.
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const list = items();
    if (!list.length) return;
    e.preventDefault();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
    list[next]?.focus();
  };

  // ArrowDown on the trigger opens the panel straight onto its first link.
  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    setOpen(true);
    requestAnimationFrame(() => items()[0]?.focus());
  };

  const onBlur = (e: React.FocusEvent) => {
    // A null relatedTarget is a click on something unfocusable — the outside
    // press handler decides those, so a click inside the panel's padding
    // does not close it.
    if (e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return {
    open,
    setOpen,
    rootRef,
    triggerRef,
    panelRef,
    panelId,
    onBlur,
    onPanelKeyDown,
    onTriggerKeyDown,
  };
}

function CategoriesMenu({ active }: { active: boolean }) {
  const t = useT();
  const locale = useLocale();
  const {
    open,
    setOpen,
    rootRef,
    triggerRef,
    panelRef,
    panelId,
    onBlur,
    onPanelKeyDown,
    onTriggerKeyDown,
  } = usePopover();
  // Categories are only fetched once someone shows interest in the menu —
  // hovering or focusing the trigger warms the cache before the click.
  const [wanted, setWanted] = useState(false);
  const { data, isPending, isError } = useQuery({
    queryKey: qk.categories.all(),
    queryFn: () => request<Category[]>({ url: endpoints.public.categories, method: "GET" }),
    enabled: wanted || open,
    staleTime: 5 * 60_000,
  });
  const categories = (data ?? [])
    .filter((c) => c.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 10);

  const close = () => setOpen(false);

  return (
    // Deliberately not `relative`: the panel positions against the whole bar,
    // so it lines up under the navigation rather than hanging off one pill.
    <div ref={rootRef} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        onPointerEnter={() => setWanted(true)}
        onFocus={() => setWanted(true)}
        className={cn(
          PILL,
          active || open
            ? ACTIVE_PILL
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        {t("nav.categories")}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 opacity-70 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        onKeyDown={onPanelKeyDown}
        className={cn(
          "absolute left-0 top-full mt-3 w-[46rem] max-w-full rounded-3xl border border-border/80 bg-popover p-2 text-popover-foreground elev-4",
          open ? "animate-pop-in grid grid-cols-[15rem_1fr] gap-2" : "hidden",
        )}
      >
        <div className="surface-deep flex flex-col justify-between gap-6 rounded-2xl p-5">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-gold-200 ring-1 ring-inset ring-white/15">
            <LayoutGrid className="size-5" aria-hidden />
          </span>
          <div>
            <div className="font-display text-lg leading-snug text-white">
              {t("nav.categories")}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">
              {t("categoriesPage.subtitle")}
            </p>
            <LocaleLink
              href="/categories"
              onClick={close}
              className="group mt-4 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 pl-4 pr-3 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
            >
              {t("nav.allCategories")}
              <ArrowRight
                aria-hidden
                className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </LocaleLink>
          </div>
        </div>

        <div className="p-2">
          <div className="flex items-center gap-2 px-2 pb-2 text-xs font-semibold text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-gold-500" />
            {t("nav.browseByTopic")}
          </div>
          {isPending ? (
            <div className="grid grid-cols-2 gap-1" aria-busy>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : isError || categories.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              {t("nav.categoriesUnavailable")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <LocaleLink
                    href={`/courses?categoryId=${c.id}`}
                    onClick={close}
                    className="group flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium leading-snug transition-colors hover:bg-accent focus-visible:bg-accent"
                  >
                    <span className="line-clamp-2">{categoryLabel(c, t, locale)}</span>
                    <ChevronRight
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  </LocaleLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function UserMenu({
  user,
  onSignOut,
  signingOut,
  className,
}: {
  user: User;
  onSignOut: () => void;
  signingOut: boolean;
  className?: string;
}) {
  const t = useT();
  const {
    open,
    setOpen,
    rootRef,
    triggerRef,
    panelRef,
    panelId,
    onBlur,
    onPanelKeyDown,
    onTriggerKeyDown,
  } = usePopover();
  const close = () => setOpen(false);

  return (
    <div ref={rootRef} onBlur={onBlur} className={className}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-11 items-center gap-2 rounded-full border border-border/80 pl-1 pr-3 transition-colors",
          open ? "bg-accent" : "bg-card/60 hover:bg-accent",
        )}
      >
        <Initials user={user} className="size-9 text-xs" />
        {/* The name is the button's accessible label at every width; it is
            only shown once the bar is wide enough to hold it. */}
        <span className="sr-only xl:hidden">{fullName(user)}</span>
        <span className="hidden max-w-[12ch] truncate text-sm font-semibold xl:block">
          {fullName(user)}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        onKeyDown={onPanelKeyDown}
        aria-label={t("nav.accountMenu")}
        role="group"
        className={cn(
          "absolute right-0 top-full mt-3 w-72 rounded-3xl border border-border/80 bg-popover p-2 text-popover-foreground elev-4",
          open ? "animate-pop-in block" : "hidden",
        )}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3">
          <Initials user={user} className="size-10 text-sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{fullName(user)}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
        <div className="mt-1 grid gap-0.5">
          <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={close}>
            {t("nav.dashboard")}
          </MenuLink>
          <MenuLink href="/my-courses" icon={BookOpen} onClick={close}>
            {t("nav.myCourses")}
          </MenuLink>
          <MenuLink href="/settings" icon={Settings} onClick={close}>
            {t("nav.settings")}
          </MenuLink>
        </div>
        <div aria-hidden className="mx-2 my-1.5 h-px bg-border" />
        <button
          type="button"
          onClick={() => {
            close();
            onSignOut();
          }}
          disabled={signingOut}
          aria-busy={signingOut || undefined}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          {signingOut ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <LogOut aria-hidden className="size-4" />
          )}
          {t("common.signOut")}
        </button>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: LucideIcon;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <LocaleLink
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent focus-visible:bg-accent"
    >
      <Icon aria-hidden className="size-4 text-muted-foreground" />
      {children}
    </LocaleLink>
  );
}

function Initials({ user, className }: { user: User; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-800 font-semibold text-white",
        className,
      )}
    >
      {user.firstName?.[0]}
      {user.lastName?.[0]}
    </span>
  );
}

function SheetLink({
  href,
  icon: Icon,
  active,
  onClick,
  children,
}: {
  href: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <LocaleLink
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-2 py-2 text-[15px] font-semibold transition-colors",
        active ? ACTIVE_PILL : "hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          active
            ? "bg-card text-navy-700 dark:bg-navy-950/60 dark:text-navy-100"
            : "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
        )}
      >
        <Icon aria-hidden className="size-[18px]" />
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
    </LocaleLink>
  );
}

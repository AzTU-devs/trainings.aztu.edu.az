"use client";

import { useRef, type RefObject } from "react";
import { ArrowRight, Bell, LayoutDashboard, LogOut, X } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { fullName, type User } from "@/types/user";
import { toCategoryRef } from "@/features/category/style";
import { CategorySwatch } from "@/components/cover/CourseCover";
import { buttonVariants } from "@/components/ui/button";
import { Kicker } from "@/components/editorial/Kicker";
import { Logo } from "../Logo";
import { LocaleSwitcher } from "../LocaleSwitcher";
import { useModal } from "./useModal";
import { MENU_CAP, useCategoryCounts, useHeaderCategories } from "./useCategoryCounts";
import { UserInitials } from "./UserMenu";

/**
 * The phone and tablet menu: a full-screen sheet with a numbered serif nav,
 * the signed-in account block, the fields that have courses (swatch, name,
 * count) and, pinned to the bottom, the sign-up / sign-in buttons and the
 * language switch. A modal dialog: focus starts on the close button,
 * stays inside, Escape closes it and focus returns to the menu button. Mount
 * it only while open.
 */
export function MobileMenu({
  onClose,
  returnFocusRef,
  isActive,
  user,
  unreadCount,
  onSignOut,
  signingOut,
}: {
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  isActive: (href: string) => boolean;
  /** null when signed out. */
  user: User | null;
  unreadCount: number;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal({ open: true, onClose, containerRef: ref, initialFocusRef: closeRef, returnFocusRef });

  const { categories } = useHeaderCategories(true);
  const counts = useCategoryCounts(categories, true);
  // While counts load every category is listed (as links); once known, only
  // the ones with courses stay (D6). At most MENU_CAP, the same as the
  // desktop mega menu, so a phone never hides a field the desktop shows; the
  // rest are one tap away through "Bütün kateqoriyalar".
  const fields = categories.filter((c) => counts[c.id] !== 0).slice(0, MENU_CAP);

  // The prototype's two serif items; the categories page is reached from the
  // "Sahələr" head below, so the first screen keeps room for the account.
  const nav = [
    { href: "/courses", label: t("nav.courses") },
    { href: "/experts", label: t("nav.experts") },
  ];

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={t("nav.menu")}
      className="fixed inset-0 z-60 flex flex-col overflow-y-auto overscroll-contain bg-paper motion-safe:animate-[drop-in_var(--dur-2)_var(--ease-out)] lg:hidden"
      // Every link in the sheet navigates on the client: close behind it.
      onClick={(e) => (e.target as Element).closest("a[href]") && onClose()}
    >
      {/* Sticky, so the close button stays in reach while the fields scroll. */}
      <div className="sticky top-0 z-1 w-full shrink-0 bg-paper">
        <div className="wrap flex h-16 items-center">
          <LocaleLink href="/" aria-label="AzTU EduPlatform">
            <Logo />
          </LocaleLink>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
            className="ml-auto grid size-11 place-items-center rounded-full text-ink shadow-[inset_0_0_0_1px_var(--c-line-2)] transition-shadow duration-(--dur-1) hover:shadow-[inset_0_0_0_1.5px_var(--c-ink)]"
          >
            <X aria-hidden="true" strokeWidth={1.75} className="size-[22px]" />
          </button>
        </div>
      </div>

      <div className="wrap w-full flex-1 pb-6">
        <nav aria-label={t("nav.mainNav")} className="mt-2">
          {nav.map((item, i) => (
            <LocaleLink
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="group flex items-baseline gap-4 border-b border-line py-4 font-display text-[2.25rem] leading-none tracking-[-0.025em] text-head [font-variation-settings:'SOFT'_30,'WONK'_0]"
            >
              <span className="font-mono text-xs tracking-[0.08em] text-gold-ink" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="decoration-gold decoration-2 underline-offset-[0.14em] group-aria-[current=page]:underline">
                {item.label}
              </span>
            </LocaleLink>
          ))}
        </nav>

        {user ? <AccountBlock user={user} unreadCount={unreadCount} isActive={isActive} onClose={onClose} onSignOut={onSignOut} signingOut={signingOut} /> : null}

        <div className="mt-8 mb-1 flex items-baseline justify-between gap-4">
          <Kicker as="span">{t("ui.fields")}</Kicker>
          <LocaleLink
            href="/categories"
            aria-current={isActive("/categories") ? "page" : undefined}
            className="link-go -my-3 py-3 text-[15px]"
          >
            {t("nav.allCategories")}
            <ArrowRight aria-hidden="true" strokeWidth={1.75} />
          </LocaleLink>
        </div>
        {fields.length ? (
          <ul>
            {fields.map((c) => {
              const ref = toCategoryRef(c, t, locale);
              const n = counts[c.id];
              return (
                <li key={c.id}>
                  <LocaleLink
                    href={`/courses?categoryId=${c.id}`}
                    className="grid min-h-12 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-2.5 text-[15px] text-ink"
                  >
                    <CategorySwatch category={ref} className="rounded-[2px]" />
                    <span lang={ref.lang} className="min-w-0 [overflow-wrap:anywhere]">
                      {ref.name}
                    </span>
                    <small className="font-mono text-xs text-ink-3">
                      {n === undefined ? null : formatNumber(n, locale)}
                    </small>
                  </LocaleLink>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {/* The account actions and the language switch stay on the first screen
          however many fields there are: they are what a phone visitor most
          often opens the menu for. On a short landscape screen the bar would
          cover most of the sheet, so there it scrolls with the rest. */}
      <div className="sticky bottom-0 z-1 w-full shrink-0 border-t border-line bg-paper pt-4 pb-[max(16px,env(safe-area-inset-bottom))] [@media(max-height:560px)]:static">
        <div className="wrap grid gap-3">
          {user ? null : (
            <>
              <LocaleLink href="/register" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                {t("common.signUp")}
              </LocaleLink>
              <LocaleLink href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
                {t("common.signIn")}
              </LocaleLink>
            </>
          )}
          <div className="flex items-center justify-between">
            <Kicker as="span">{t("nav.language")}</Kicker>
            <LocaleSwitcher variant="segmented" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Signed in: who is signed in, then the account links and sign-out. */
function AccountBlock({
  user,
  unreadCount,
  isActive,
  onClose,
  onSignOut,
  signingOut,
}: {
  user: User;
  unreadCount: number;
  isActive: (href: string) => boolean;
  onClose: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 border-b border-line-strong pb-4">
        <UserInitials user={user} className="size-11 text-base" />
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{fullName(user)}</div>
          <div className="t-meta truncate">{user.email}</div>
        </div>
      </div>
      <ul className="grid">
        <li>
          <LocaleLink
            href="/dashboard"
            aria-current={isActive("/dashboard") ? "page" : undefined}
            className="flex min-h-12 items-center gap-3 border-b border-line text-[15px] font-medium text-ink"
          >
            <LayoutDashboard aria-hidden="true" strokeWidth={1.75} className="size-[18px] text-ink-3" />
            {t("nav.dashboard")}
          </LocaleLink>
        </li>
        <li>
          <LocaleLink
            href="/notifications"
            aria-current={isActive("/notifications") ? "page" : undefined}
            className="flex min-h-12 items-center gap-3 border-b border-line text-[15px] font-medium text-ink"
          >
            <Bell aria-hidden="true" strokeWidth={1.75} className="size-[18px] text-ink-3" />
            {t("nav.notifications")}
            {unreadCount > 0 ? (
              <span className="ml-auto font-mono text-xs text-ink-3">{formatNumber(unreadCount, locale)}</span>
            ) : null}
          </LocaleLink>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            disabled={signingOut}
            aria-busy={signingOut || undefined}
            className="flex min-h-12 w-full items-center gap-3 border-b border-line text-left text-[15px] font-semibold text-danger disabled:opacity-60"
          >
            <LogOut aria-hidden="true" strokeWidth={1.75} className="size-[18px]" />
            {t("common.signOut")}
          </button>
        </li>
      </ul>
    </div>
  );
}

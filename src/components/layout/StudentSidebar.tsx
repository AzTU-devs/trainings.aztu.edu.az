"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { Kicker } from "@/components/editorial/Kicker";
import { StatusBadge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks";
import { useUnreadCount } from "@/features/notification/hooks";
import { fullName } from "@/types/user";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  key: string;
  /** What sits on the right of the row: the unread count, or "coming soon". */
  aside?: "unread" | "soon";
};

/*
 * Two short groups rather than one list of eight: what you are learning, and
 * the housekeeping around your account. The rows are numbered straight
 * through (01–08) like a table of contents; the phone strip flattens the
 * groups back into one row of pills with the same numbers.
 */
const groups: { label: string; items: Item[] }[] = [
  {
    label: "navLearning",
    items: [
      { href: "/dashboard", key: "dashboard" },
      { href: "/my-courses", key: "myCourses" },
      { href: "/certificates", key: "certificates", aside: "soon" },
    ],
  },
  {
    label: "navAccount",
    items: [
      { href: "/notifications", key: "notifications", aside: "unread" },
      { href: "/orders", key: "orders" },
      { href: "/tutor", key: "tutor" },
      { href: "/profile", key: "profile" },
      { href: "/settings", key: "settings" },
    ],
  },
];

const items = groups.flatMap((g) => g.items);
const numberOf = new Map(items.map((item, i) => [item.key, String(i + 1).padStart(2, "0")] as const));

export function StudentSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useT();
  const { user, status } = useAuth();
  const { data: unread } = useUnreadCount(status === "authenticated");
  const unreadCount = unread?.count ?? 0;
  const stripRef = useRef<HTMLUListElement>(null);

  const isActive = (href: string) => {
    const full = localeHref(locale, href);
    return pathname === full || pathname.startsWith(`${full}/`);
  };

  // On a phone the section strip scrolls sideways; bring the current page's
  // pill into view so "Settings" is not hidden off the right edge. Only the
  // strip scrolls — never the page (so scrollLeft, not scrollIntoView).
  // Measured again whenever the pills change width after the first paint:
  // once the web fonts are in (the fallback font draws narrower pills) and
  // when the unread badge appears or goes (it adds 32px to "Notifications",
  // pushing every later pill right). A position taken before either leaves
  // "Settings" short of the end, clipped under the edge fade. Clamped to the
  // scroll range so the end pills land fully inside the padding.
  const hasBadge = unreadCount > 0;
  useEffect(() => {
    let cancelled = false;
    const center = () => {
      const strip = stripRef.current;
      const current = strip?.querySelector<HTMLElement>('[aria-current="page"]');
      if (cancelled || !strip || !current) return;
      const max = strip.scrollWidth - strip.clientWidth;
      if (max <= 0) return;
      const target = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2;
      strip.scrollLeft = Math.max(0, Math.min(max, target));
    };
    center();
    void document.fonts?.ready.then(center);
    return () => {
      cancelled = true;
    };
  }, [pathname, hasBadge]);

  // The count is said in words for screen readers ("1 Oxunmamış"); sighted
  // readers get the figure on a gold dot.
  // Gold with fixed dark ink reads on the paper row and on the ink pill alike.
  // `relative`: the sr-only text is absolutely positioned, and without a
  // positioned ancestor it escapes the phone strip's scroll box and widens
  // the page.
  const unreadBadge = () =>
    unreadCount > 0 ? (
      <span className="relative inline-grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 font-mono text-xs font-medium leading-none tabular-nums text-[#0e1a2b]">
        {unreadCount > 99 ? "99+" : unreadCount}
        <span className="sr-only"> {t("student.unreadMarker")}</span>
      </span>
    ) : null;

  return (
    <>
      {/* Below 1024: one horizontally scrolling row of pills under the header. */}
      <nav aria-label={t("student.accountNav")} className="col-span-4 -mx-(--margin) md:col-span-8 lg:hidden">
        <ul
          ref={stripRef}
          // `relative` keeps the badges' sr-only text (absolutely positioned)
          // inside the scrolling strip instead of widening the page. The edge
          // fades are exactly as wide as the side padding, so a pill scrolled
          // hard against either end is never faded.
          className="relative flex gap-2 overflow-x-auto overscroll-x-contain px-(--margin) py-1 [mask-image:linear-gradient(to_right,transparent,#000_var(--margin),#000_calc(100%-var(--margin)),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.key} className="shrink-0">
                <LocaleLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full pl-3.5 pr-4 text-[15px] font-medium transition-[background-color,color,box-shadow] duration-(--dur-1)",
                    active
                      ? "bg-ink text-paper"
                      : "text-ink-2 shadow-[inset_0_0_0_1px_var(--c-line-2)] hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--c-ink)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("font-mono text-xs", active ? "text-gold" : "text-gold-ink")}
                  >
                    {numberOf.get(item.key)}
                  </span>
                  {t(`nav.${item.key}`)}
                  {item.aside === "unread" ? unreadBadge() : null}
                </LocaleLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 1024 and up: the section index in columns 1–3, in view while the page scrolls. */}
      <aside className="hidden self-start lg:sticky lg:top-[calc(var(--hdr)+24px)] lg:col-span-3 lg:block">
        <Kicker tone="gold">{t("nav.dashboard")}</Kicker>
        {user ? (
          <div className="mt-3 min-w-0">
            <p className="t-title break-words">{fullName(user)}</p>
            <p className="t-meta mt-1 truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        ) : null}

        <nav aria-label={t("student.accountNav")} className="mt-8">
          {groups.map((group) => (
            <div key={group.label} className="mt-7 first:mt-0">
              <Kicker as="p" className="border-t border-line-strong pt-3 pb-2" tone="ink-3">
                {t(`student.${group.label}`)}
              </Kicker>
              <ol>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.key} className="border-b border-line last:border-b-0">
                      <LocaleLink
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "grid min-h-11 grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 border-l-2 py-2 pl-3 pr-2 text-[15px] leading-snug transition-colors duration-(--dur-1)",
                          active
                            ? "border-gold bg-paper-2 font-semibold text-ink"
                            : "border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink",
                        )}
                      >
                        <span aria-hidden="true" className="font-mono text-xs text-gold-ink">
                          {numberOf.get(item.key)}
                        </span>
                        <span className="truncate">{t(`nav.${item.key}`)}</span>
                        {item.aside === "unread" ? (
                          unreadBadge()
                        ) : item.aside === "soon" ? (
                          <StatusBadge className="text-[13px]">{t("ui.comingSoon")}</StatusBadge>
                        ) : null}
                      </LocaleLink>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

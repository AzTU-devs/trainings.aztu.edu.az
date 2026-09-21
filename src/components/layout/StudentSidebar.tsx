"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Bell,
  Award,
  ShoppingBag,
  GraduationCap,
  UserRound,
  Settings as SettingsIcon,
} from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { useAuth } from "@/features/auth/hooks";
import { useUnreadCount } from "@/features/notification/hooks";
import { fullName } from "@/types/user";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
  badgeKey?: "unread";
};

/*
 * Two short groups rather than one list of eight: what you are learning, and
 * the housekeeping around your account. The mobile pill row flattens them
 * back into a single strip.
 */
const groups: { label: string; items: Item[] }[] = [
  {
    label: "navLearning",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
      { href: "/my-courses", icon: BookOpen, key: "myCourses" },
      { href: "/certificates", icon: Award, key: "certificates" },
    ],
  },
  {
    label: "navAccount",
    items: [
      { href: "/notifications", icon: Bell, key: "notifications", badgeKey: "unread" },
      { href: "/orders", icon: ShoppingBag, key: "orders" },
      { href: "/tutor", icon: GraduationCap, key: "tutor" },
      { href: "/profile", icon: UserRound, key: "profile" },
      { href: "/settings", icon: SettingsIcon, key: "settings" },
    ],
  },
];

const items = groups.flatMap((g) => g.items);

/** The soft navy tint that marks the page you are on — the header uses it too. */
const ACTIVE_PILL = "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100";

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
  // strip scrolls — never the page.
  useEffect(() => {
    const strip = stripRef.current;
    const current = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!strip || !current || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollLeft = current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2;
  }, [pathname]);

  const badge = (item: Item, className?: string) =>
    item.badgeKey === "unread" && unreadCount > 0 ? (
      <span
        className={cn(
          "grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-none text-destructive-foreground",
          className,
        )}
      >
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    ) : null;

  return (
    <>
      {/* Below md: one horizontally scrolling row of pills under the header. */}
      <nav aria-label={t("student.accountNav")} className="-mx-5 md:hidden">
        <ul
          ref={stripRef}
          className="flex gap-2 overflow-x-auto overscroll-x-contain px-5 py-1 [mask-image:linear-gradient(to_right,transparent,#000_1.25rem,#000_calc(100%-1.25rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.key} className="shrink-0">
                <LocaleLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors duration-200",
                    active
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {t(`nav.${item.key}`)}
                  {badge(item, active ? "ring-2 ring-primary" : undefined)}
                </LocaleLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* md and up: a white rounded card that stays in view while the page scrolls. */}
      <aside className="hidden w-64 shrink-0 self-start md:sticky md:top-24 md:block lg:w-72">
        <div className="rounded-3xl border border-border/80 bg-card p-2.5 elev-1">
          {user ? (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3 dark:bg-muted/50">
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy-500 to-navy-800 font-display text-sm text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2)]"
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{fullName(user)}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
          ) : null}

          <nav aria-label={t("student.accountNav")} className="pb-1">
            {groups.map((group) => (
              <div key={group.label} className="pt-4">
                <div className="flex items-center gap-2 px-4 pb-2 text-xs font-semibold text-muted-foreground">
                  <span aria-hidden className="size-1.5 rounded-full bg-gold-500" />
                  {t(`student.${group.label}`)}
                </div>
                <ul className="grid gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.key}>
                        <LocaleLink
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                            active
                              ? ACTIVE_PILL
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <Icon className="size-[18px] shrink-0" />
                          <span className="flex-1 truncate">{t(`nav.${item.key}`)}</span>
                          {badge(item)}
                        </LocaleLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

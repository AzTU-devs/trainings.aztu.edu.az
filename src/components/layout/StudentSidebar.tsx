"use client";

import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  Bell,
  Award,
  ShoppingBag,
  GraduationCap,
  User as UserIcon,
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

const items: Item[] = [
  { href: "/dashboard", icon: Home, key: "dashboard" },
  { href: "/my-courses", icon: BookOpen, key: "myCourses" },
  { href: "/notifications", icon: Bell, key: "notifications", badgeKey: "unread" },
  { href: "/orders", icon: ShoppingBag, key: "orders" },
  { href: "/certificates", icon: Award, key: "certificates" },
  { href: "/tutor", icon: GraduationCap, key: "tutor" },
  { href: "/profile", icon: UserIcon, key: "profile" },
  { href: "/settings", icon: SettingsIcon, key: "settings" },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useT();
  const { user, status } = useAuth();
  const { data: unread } = useUnreadCount(status === "authenticated");

  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-20 space-y-4">
        {user ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-sm font-semibold text-white"
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {fullName(user)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <nav className="rounded-2xl border border-border bg-card p-2">
          {items.map(({ href, icon: Icon, key, badgeKey }) => {
            const full = localeHref(locale, href);
            const active = pathname === full || pathname.startsWith(`${full}/`);
            const showBadge =
              badgeKey === "unread" && (unread?.count ?? 0) > 0;
            return (
              <LocaleLink
                key={key}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="size-4" />
                <span className={cn("flex-1 truncate", active && "font-medium")}>
                  {t(`nav.${key}`)}
                </span>
                {showBadge ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unread!.count > 9 ? "9+" : unread!.count}
                  </span>
                ) : null}
              </LocaleLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

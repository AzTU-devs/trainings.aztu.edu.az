"use client";

import { useState } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useNotifications, useMarkAllRead, useMarkRead, useUnreadCount } from "../hooks";
import { useLocale, useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import { cn } from "@/lib/utils/cn";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const BAKU_OFFSET_MS = 4 * HOUR * 1000;

/*
 * Timestamps go through translation keys and hand-written dates instead of
 * Intl.RelativeTimeFormat / DateTimeFormat: some browsers ship without
 * Azerbaijani locale data and would print "-7 min" or "2026 M09 20" on the
 * /az pages. Dates are day.month.year in Baku time (UTC+4 all year), as they
 * are usually written in Azerbaijan; English keeps Intl, which every engine
 * carries.
 */
function calendarDate(date: Date, locale: string, withTime = false) {
  if (locale === "en") {
    return new Intl.DateTimeFormat("en", {
      dateStyle: withTime ? "long" : "medium",
      timeStyle: withTime ? "short" : undefined,
      timeZone: "Asia/Baku",
    }).format(date);
  }
  const baku = new Date(date.getTime() + BAKU_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${pad(baku.getUTCDate())}.${pad(baku.getUTCMonth() + 1)}.${baku.getUTCFullYear()}`;
  return withTime ? `${day}, ${pad(baku.getUTCHours())}:${pad(baku.getUTCMinutes())}` : day;
}

/** "5 min ago" for the past week, then the date. */
function relativeTime(date: Date, now: number, locale: string, t: TFunction) {
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < MINUTE) return t("student.timeJustNow");
  if (seconds < HOUR) return t("student.timeMinutes", { count: Math.floor(seconds / MINUTE) });
  if (seconds < DAY) return t("student.timeHours", { count: Math.floor(seconds / HOUR) });
  if (seconds < 7 * DAY) return t("student.timeDays", { count: Math.floor(seconds / DAY) });
  return calendarDate(date, locale);
}

export function NotificationList() {
  const t = useT();
  const locale = useLocale();
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  // The same query the header badge reads, so the two never disagree; the
  // loaded page is only a fallback while it is in flight.
  const { data: unread } = useUnreadCount();
  // One clock per mount, so every row on screen is measured from the same moment.
  const [now] = useState(() => Date.now());

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card elev-1" aria-busy>
        <div className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-4 sm:px-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-44 rounded-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-border/70 px-5 py-4 last:border-b-0 sm:px-6"
          >
            <Skeleton className="size-10 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = data?.content ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BellOff strokeWidth={1.75} />}
        title={t("student.noNotifications")}
        description={t("student.noNotificationsHint")}
      />
    );
  }

  const unreadCount = unread?.count ?? items.filter((n) => !n.readAt).length;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-card elev-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-3.5 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {unreadCount > 0 ? (
            <span aria-hidden className="size-2 rounded-full bg-gold-500" />
          ) : null}
          {t("student.unreadCount", { count: unreadCount })}
        </p>
        <Button
          variant="soft"
          size="sm"
          onClick={() => markAll.mutate()}
          loading={markAll.isPending}
        >
          <CheckCheck className="size-4" />
          {t("student.markAllRead")}
        </Button>
      </div>

      <ul className="divide-y divide-border/70">
        {items.map((n) => {
          const unread = !n.readAt;
          const created = new Date(n.createdAt);
          const valid = !Number.isNaN(created.getTime());
          return (
            <li key={n.id}>
              <div
                className={cn(
                  "flex items-start gap-4 px-5 py-4 transition-colors duration-200 sm:px-6",
                  unread
                    ? "cursor-pointer bg-navy-25 hover:bg-navy-50/70 dark:bg-navy-950/40 dark:hover:bg-navy-900/40"
                    : "hover:bg-muted/40",
                )}
                onClick={() => unread && markOne.mutate(n.id)}
                role="button"
                tabIndex={0}
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative grid size-10 shrink-0 place-items-center rounded-2xl",
                    unread
                      ? "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Bell className="size-[18px]" />
                  {unread ? (
                    <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-gold-500 ring-2 ring-card" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        "min-w-0 text-[15px] leading-snug",
                        unread ? "font-semibold text-foreground" : "font-medium text-foreground/80",
                      )}
                    >
                      {unread ? <span className="sr-only">{t("student.unread")}: </span> : null}
                      {n.title}
                    </p>
                    {valid ? (
                      <time
                        dateTime={n.createdAt}
                        title={calendarDate(created, locale, true)}
                        className="mt-0.5 shrink-0 whitespace-nowrap text-xs text-muted-foreground"
                      >
                        {relativeTime(created, now, locale, t)}
                      </time>
                    ) : null}
                  </div>
                  {n.body ? (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {n.body}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

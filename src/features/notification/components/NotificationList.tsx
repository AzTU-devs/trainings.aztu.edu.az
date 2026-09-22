"use client";

import { useState, type KeyboardEvent } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useNotifications, useMarkAllRead, useMarkRead, useUnreadCount } from "../hooks";
import { useAuth } from "@/features/auth/hooks";
import { useLocale, useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import { bakuDate, bakuTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/*
 * Timestamps go through translation keys and formatDate's month tables
 * instead of Intl.RelativeTimeFormat / DateTimeFormat: some browsers ship
 * without Azerbaijani locale data and would print "-7 min" or "2026 M09 20"
 * on the /az pages. Times are Baku time (UTC+4 all year), through the shared
 * bakuDate/bakuTime helpers, so the date and the clock always agree.
 */
function bakuStamp(date: Date, locale: string, t: TFunction) {
  const iso = date.toISOString();
  return t("student.notificationDate", { date: bakuDate(iso, locale), time: bakuTime(iso) });
}

/** "5 min ago" for the past week, then the date. */
function relativeTime(date: Date, now: number, locale: string, t: TFunction) {
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < MINUTE) return t("student.timeJustNow");
  if (seconds < HOUR) return t("student.timeMinutes", { count: Math.floor(seconds / MINUTE) });
  if (seconds < DAY) return t("student.timeHours", { count: Math.floor(seconds / HOUR) });
  if (seconds < 7 * DAY) return t("student.timeDays", { count: Math.floor(seconds / DAY) });
  return bakuDate(date.toISOString(), locale);
}

function ListSkeleton() {
  return (
    <div aria-busy className="border-t border-line-strong">
      <div className="flex items-center justify-between gap-3 py-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-10 w-52 rounded-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[12px_minmax(0,1fr)] gap-4 border-t border-line py-5">
          <span />
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * After a full page load the access token is restored asynchronously (see
 * AuthHydrator); until then both notification requests would go out without
 * it and come back 401. So the list waits for the session to settle — the
 * same gate the header badge uses — and only then mounts the part that
 * fetches. A settled "no session" still mounts it, exactly as before.
 */
export function NotificationList() {
  const { status } = useAuth();
  if (status === "idle" || status === "loading") return <ListSkeleton />;
  return <LoadedNotificationList />;
}

function LoadedNotificationList() {
  const t = useT();
  const locale = useLocale();
  const { status } = useAuth();
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  // The same query the header badge reads, so the two never disagree; the
  // loaded page is only a fallback while it is in flight.
  const { data: unread } = useUnreadCount(status === "authenticated");
  // One clock per mount, so every row on screen is measured from the same
  // moment. The list only renders after the client fetch, never on the
  // server, so this cannot cause a hydration mismatch.
  const [now] = useState(() => Date.now());

  if (isLoading) return <ListSkeleton />;

  const items = data?.content ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        compact
        plate={t("student.plateNotifications")}
        headingLevel="h2"
        title={t("student.noNotifications")}
        description={t("student.noNotificationsHint")}
        className="border-line-strong"
      />
    );
  }

  const unreadCount = unread?.count ?? items.filter((n) => !n.readAt).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line-strong pt-3">
        <p className="t-kicker flex items-center gap-2.5 text-ink-2">
          {unreadCount > 0 ? <span aria-hidden="true" className="size-2 rounded-full bg-gold" /> : null}
          {t("student.unreadCount", { count: unreadCount })}
        </p>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()} loading={markAll.isPending}>
          <CheckCheck aria-hidden="true" strokeWidth={1.75} />
          {t("student.markAllRead")}
        </Button>
      </div>

      <ul className="mt-3 border-b border-line">
        {items.map((n) => {
          const isUnread = !n.readAt;
          const created = new Date(n.createdAt);
          const valid = !Number.isNaN(created.getTime());
          const open = () => {
            if (isUnread) markOne.mutate(n.id);
          };
          // The row has always been a button; Enter and Space now do what a
          // click does, as they would on a real button.
          const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open();
            }
          };
          return (
            <li key={n.id} className="border-t border-line">
              <div
                className={cn(
                  "grid grid-cols-[12px_minmax(0,1fr)] gap-x-4 gap-y-1 px-2 py-5 transition-colors duration-(--dur-1) sm:grid-cols-[12px_minmax(0,1fr)_auto] sm:px-3",
                  isUnread ? "cursor-pointer bg-paper-2/70 hover:bg-paper-2" : "hover:bg-paper-2/50",
                )}
                onClick={open}
                onKeyDown={onKeyDown}
                role="button"
                tabIndex={0}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-[7px] size-2.5 rounded-full",
                    isUnread ? "bg-gold" : "shadow-[inset_0_0_0_1px_var(--c-line-2)]",
                  )}
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[1.0625rem] leading-snug [overflow-wrap:anywhere]",
                      isUnread ? "font-semibold text-ink" : "font-medium text-ink-2",
                    )}
                  >
                    {isUnread ? <span className="sr-only">{t("student.unread")}: </span> : null}
                    {n.title}
                  </p>
                  {n.body ? (
                    <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-ink-2 [overflow-wrap:anywhere]">
                      {n.body}
                    </p>
                  ) : null}
                </div>
                {valid ? (
                  <time
                    dateTime={n.createdAt}
                    title={bakuStamp(created, locale, t)}
                    className="col-start-2 font-mono text-xs whitespace-nowrap text-ink-3 sm:col-start-3 sm:row-start-1 sm:mt-1 sm:text-right"
                  >
                    {relativeTime(created, now, locale, t)}
                  </time>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

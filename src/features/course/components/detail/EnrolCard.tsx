"use client";

import { useId } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { Kicker } from "@/components/editorial/Kicker";
import { Tag } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks";
import { useLocale, useT } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import { LESSON_KIND } from "../../format";
import type { LessonContentType } from "../../types";
import { EnrollCta, type EnrollTarget } from "../EnrollCta";

/** Icons by name: a server page cannot pass component functions to a client one. */
const ICONS = {
  layers: Layers,
  calendar: CalendarDays,
  pin: MapPin,
  clock: Clock,
  sync: RefreshCw,
  device: Smartphone,
} satisfies Record<string, LucideIcon>;

export type EnrolIncludeIcon = keyof typeof ICONS;

export type EnrolCardData = {
  target: EnrollTarget;
  /** "Pulsuz", or the formatted price. */
  priceLabel: string;
  /** "Onlayn kurs" / "Əyani kurs". */
  formatLabel: string;
  /** The one-line reassurance under the price (free courses without a seat meter). */
  note?: string | null;
  /** In-person seats, only when the course has a limit. Strings are formatted by the server. */
  seats?: { label: string; taken: string; meterLabel: string; pct: number; status: string } | null;
  /** Lesson-type counts: the same tags as the curriculum. */
  kinds: { kind: LessonContentType; count: number }[];
  /** "Kursa daxildir": only facts the course has (no previews, no certificate).
   *  `clamp` holds a long free-text row (the street address) to two lines. */
  includes: { icon: EnrolIncludeIcon; text: string; clamp?: boolean }[];
};

/**
 * The enrol card: the price in display type, seats for an in-person course,
 * the call to action, a sign-up line for visitors, and what the course
 * includes. Rendered twice by the page (inline under the title below 1024px,
 * in the sticky rail from 1024px), so it carries no fixed ids.
 */
export function EnrolCard({ data, className }: { data: EnrolCardData; className?: string }) {
  const t = useT();
  const locale = useLocale();
  const { status } = useAuth();
  const priceId = useId();

  return (
    <section
      aria-labelledby={priceId}
      // Back to 24px in the rail: the sticky card and the table of contents
      // under it share one screen height there.
      className={cn("rounded-card bg-card p-6 shadow-float sm:p-7 lg:p-6", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p
          id={priceId}
          className="min-w-0 font-display text-[2.625rem] leading-[0.95] font-[380] tracking-[-0.03em] text-head [font-variation-settings:'SOFT'_30,'WONK'_0] sm:text-5xl"
        >
          {data.priceLabel}
        </p>
        <Kicker as="span" className="shrink-0">
          {data.formatLabel}
        </Kicker>
      </div>

      {data.seats ? (
        <div className="mt-5">
          <div className="t-small flex justify-between gap-4">
            <span className="text-ink-2">{data.seats.label}</span>
            <span className="t-num font-semibold text-ink">{data.seats.taken}</span>
          </div>
          <div
            role="img"
            aria-label={data.seats.meterLabel}
            // A pale paper-2 track, so the gold fill is the only strong mark
            // (line-2 read as a grey slab with a gold tip). The night edition
            // takes the hairline tint instead: its paper-2 is darker than the
            // card and would read as a hole rather than a track.
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2 dark:bg-line"
          >
            <span
              className="block h-full rounded-full bg-gold"
              style={{ width: `${data.seats.pct}%` }}
            />
          </div>
          <p className="t-meta mt-2">{data.seats.status}</p>
        </div>
      ) : data.note ? (
        <p className="t-meta mt-2.5">{data.note}</p>
      ) : null}

      {/* `data-enrol-cta`: the phone bar hides while this button is on screen,
          so one call to action shows at a time. */}
      <div data-enrol-cta className="mt-6">
        <EnrollCta target={data.target} size="lg" block />
      </div>

      {/* Visitors only, like the call to action's sign-in label (shown until a
          session is confirmed). */}
      {status !== "authenticated" ? (
        <p className="t-meta mt-3 text-center">
          {t("courseDetail.noAccount")}{" "}
          <Link href={localeHref(locale, "/register")} className="link text-ink">
            {t("common.signUp")}
          </Link>
        </p>
      ) : null}

      <Kicker className="mt-6 mb-2.5">{t("courseDetail.includes")}</Kicker>
      {data.kinds.length ? (
        <div className="kinds mb-3 gap-1.5">
          {data.kinds.map(({ kind, count }) => (
            <Tag key={kind} icon={LESSON_KIND[kind].icon} className="bg-paper">
              {t(LESSON_KIND[kind].key, { count })}
            </Tag>
          ))}
        </div>
      ) : null}
      <ul>
        {data.includes.map((item, i) => {
          const Icon = ICONS[item.icon];
          return (
            <li
              key={i}
              className="flex gap-3 border-t border-line py-2.5 text-[0.9375rem] leading-normal text-ink-2"
            >
              <Icon aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-[18px] shrink-0 text-ink-3" />
              <span
                // The clamped row keeps its full text for pointer users.
                title={item.clamp ? item.text : undefined}
                className={cn("min-w-0 [overflow-wrap:anywhere]", item.clamp && "line-clamp-2")}
              >
                {item.text}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

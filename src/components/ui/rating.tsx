import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRating } from "@/lib/utils/format";
import type { Locale } from "@/i18n/config";
import { StatusBadge } from "./badge";

/**
 * A course's rating as a fact: ★ 4,8 (57). With no ratings it says so in words
 * ("Hələ qiymət yoxdur") — never "0,0" and never a row of empty stars.
 * Universal; the number goes through formatRating, so it is hydration-safe.
 */
export function RatingInline({
  avg,
  count,
  locale,
  noneLabel,
  showCount = true,
  srLabel,
  className,
}: {
  avg: number | string;
  count: number;
  locale: Locale;
  noneLabel: string;
  showCount?: boolean;
  /** A full sentence for screen readers, e.g. t("ui.ratingSummary", …). */
  srLabel?: string;
  className?: string;
}) {
  if (!count) {
    return <StatusBadge className={cn("norate", className)}>{noneLabel}</StatusBadge>;
  }
  return (
    <span className={cn("f inline-flex items-center gap-1.5", className)}>
      <Star aria-hidden="true" className="star size-[15px] shrink-0 fill-current stroke-none text-gold-ink" />
      <span aria-hidden={srLabel ? true : undefined} className="inline-flex items-baseline gap-1">
        <b className="font-semibold text-ink">{formatRating(avg, locale)}</b>
        {showCount ? <span className="text-ink-3">({count})</span> : null}
      </span>
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
    </span>
  );
}

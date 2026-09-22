"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLocale, useT } from "@/i18n/client";
import { formatNumber, formatRating } from "@/lib/utils/format";
import { Stars } from "./Stars";
import type { CourseReview } from "../types";

/**
 * The course's rating: the average in display type with its stars and count
 * (the aggregate the course carries), beside a 5 → 1 distribution of the
 * loaded reviews. Only rendered once the course has at least one rating, so it
 * never shows "0,0" or a row of empty stars.
 *
 * The bars grow once, when the block scrolls into view after the reviews have
 * loaded; under reduced motion they are simply drawn at their width.
 */
export function RatingHistogram({
  reviews,
  ratingAvg,
  ratingCount,
  loaded = true,
  total,
}: {
  reviews: CourseReview[];
  ratingAvg: number | string;
  ratingCount: number;
  /** False while the reviews are still being fetched: the bars wait at zero. */
  loaded?: boolean;
  /** How many reviews exist in all (the page's totalElements); more than loaded → a "based on" line. */
  total?: number;
}) {
  const t = useT();
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || seen) return;
    // Without an observer (very old browsers) the bars are simply shown.
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  const counted = reviews.length;
  const rows = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const pct = counted ? Math.round((count / counted) * 100) : 0;
    return { stars, pct };
  });
  const grow = seen && loaded;
  const avg = typeof ratingAvg === "string" ? Number(ratingAvg) : ratingAvg;
  const shownAvg = formatRating(ratingAvg, locale);
  const partial = loaded && total !== undefined && total > counted && counted > 0;

  return (
    <div
      ref={rootRef}
      className="grid items-center gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-12"
    >
      <div>
        <p className="t-display-l leading-none">{shownAvg}</p>
        <Stars
          value={Number.isFinite(avg) ? avg : 0}
          size={18}
          className="mt-3"
          label={t("review.starsOutOf", { rating: shownAvg })}
        />
        <p className="t-meta mt-2">
          {t("review.ratingsTotal", { n: formatNumber(ratingCount, locale), count: ratingCount })}
        </p>
      </div>
      <div>
        <div
          role="img"
          aria-label={
            loaded && counted
              ? t("review.histLabel", {
                  summary: rows
                    .map((r) => t("review.histItem", { stars: r.stars, pct: r.pct }))
                    .join(", "),
                })
              : undefined
          }
          aria-hidden={loaded && counted ? undefined : true}
          className="grid gap-2.5"
        >
          {rows.map((r, i) => (
            <div
              key={r.stars}
              aria-hidden="true"
              className="grid grid-cols-[48px_minmax(0,1fr)_44px] items-center gap-3.5 text-sm text-ink-2"
            >
              <span className="inline-flex items-center gap-1.5 t-num">
                {r.stars}
                <Star aria-hidden="true" className="size-3.5 fill-current stroke-none text-gold-ink" />
              </span>
              {/* A pale paper-2 track, so the gold fill is the only strong mark
                  and a 0% row reads as empty (line-2 drew it as a grey bar as
                  heavy as a filled one). The night edition takes the hairline
                  tint: its paper-2 matches the page and the track would vanish. */}
              <span className="h-2 overflow-hidden rounded-full bg-paper-2 dark:bg-line">
                <span
                  className={cn(
                    "block h-full origin-left rounded-full bg-gold",
                    "transition-[scale] duration-1000 ease-out",
                    grow ? "scale-x-100" : "scale-x-0",
                    // Reduced motion: drawn at full width at once, whether or not it was seen.
                    "motion-reduce:scale-x-100 motion-reduce:transition-none",
                  )}
                  style={{ width: `${r.pct}%`, transitionDelay: `${i * 80}ms` }}
                />
              </span>
              <span className="t-num text-right">{loaded && counted ? `${r.pct}%` : "—"}</span>
            </div>
          ))}
        </div>
        {partial ? (
          <p className="t-meta mt-3">
            {t("review.histBasis", { n: formatNumber(counted, locale), count: counted })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

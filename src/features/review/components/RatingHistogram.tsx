"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/i18n/client";
import { Stars } from "./Stars";
import type { CourseReview } from "../types";

export function RatingHistogram({
  reviews,
  ratingAvg,
  ratingCount,
}: {
  reviews: CourseReview[];
  ratingAvg: number | string;
  ratingCount: number;
}) {
  const t = useT();
  const buckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const avg =
    typeof ratingAvg === "string" ? Number(ratingAvg) : ratingAvg;
  // With no ratings the average is 0, which would read as a bad score rather
  // than as "not rated yet".
  const hasScore = ratingCount > 0 && Number.isFinite(avg);

  return (
    <div className="grid gap-6 rounded-2xl bg-muted/50 p-5 sm:grid-cols-[10.5rem_1fr] sm:items-center sm:gap-8 sm:p-6">
      <div className="flex flex-col items-center text-center sm:border-r sm:border-border sm:pr-8">
        <div className="text-xs font-medium text-muted-foreground">
          {t("review.overall")}
        </div>
        <div
          className={cn(
            "mt-1.5 font-display text-5xl leading-none tracking-tight",
            !hasScore && "text-muted-foreground/60",
          )}
        >
          {hasScore ? avg.toFixed(1) : "—"}
        </div>
        <Stars
          value={hasScore ? avg : 0}
          size={18}
          className="mt-3"
          label={
            hasScore ? t("review.starsOutOf", { rating: avg.toFixed(1) }) : undefined
          }
        />
        <div className="mt-2 text-xs text-muted-foreground">
          {t("review.count", { count: ratingCount })}
        </div>
      </div>
      <ul className="space-y-2.5">
        {buckets.map((b) => (
          <li key={b.stars} className="flex items-center gap-3 text-sm">
            <span className="inline-flex w-8 shrink-0 items-center gap-1 tabular-nums text-muted-foreground">
              {b.stars}
              <Star aria-hidden className="size-3.5 fill-gold-500 text-gold-500" />
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500"
                style={{ width: `${(b.count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {b.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

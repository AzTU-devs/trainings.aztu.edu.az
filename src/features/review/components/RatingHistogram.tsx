import { Star } from "lucide-react";
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
  const buckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const avg =
    typeof ratingAvg === "string" ? Number(ratingAvg) : ratingAvg;

  return (
    <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center justify-center gap-1 sm:border-r sm:pr-6">
        <div className="text-5xl font-bold tracking-tight">
          {Number.isFinite(avg) ? avg.toFixed(1) : "—"}
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < Math.round(avg)
                  ? "size-4 fill-amber-400 text-amber-400"
                  : "size-4 text-muted-foreground/40"
              }
            />
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {ratingCount.toLocaleString()} reviews
        </div>
      </div>
      <div className="space-y-1.5">
        {buckets.map((b) => (
          <div key={b.stars} className="flex items-center gap-3 text-sm">
            <span className="w-12 text-muted-foreground">{b.stars} ★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${(b.count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-muted-foreground">
              {b.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

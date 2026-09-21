"use client";

import { MessageSquareText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "../hooks";
import { useAuth } from "@/features/auth/hooks";
import { useLocale, useT } from "@/i18n/client";
import { Stars } from "./Stars";
import { RatingHistogram } from "./RatingHistogram";
import { ReviewForm } from "./ReviewForm";

/**
 * Month names come from the browser's locale data, and Chrome's trimmed ICU
 * build has none for Azerbaijani: it prints "2026 M09 1" while still claiming
 * to support "az". Probe one date, and where the month comes back as a bare
 * number fall back to the numeric day.month.year form used in Azerbaijan.
 */
function dateFormatter(locale: string) {
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const month = fmt
    .formatToParts(new Date(2020, 8, 15))
    .find((part) => part.type === "month")?.value;
  if (month && !/^M?\d+$/.test(month)) {
    return (iso: string) => fmt.format(new Date(iso));
  }
  return (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  };
}

type Props = {
  courseId: string;
  ratingAvg: number | string;
  ratingCount: number;
};

export function ReviewsSection({ courseId, ratingAvg, ratingCount }: Props) {
  const t = useT();
  const locale = useLocale();
  const { status } = useAuth();
  const { data, isLoading } = useReviews(courseId);

  const reviews = data?.content ?? [];
  const formatDate = dateFormatter(locale);
  // The summary is the course's aggregate, so it appears once the aggregate
  // has a rating in it. Before that it would be a dash, empty stars and five
  // bars at 0 on top of the empty state: the same "no reviews yet" said twice.
  const hasSummary = ratingCount > 0;
  const listEmpty = !isLoading && reviews.length === 0;

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 elev-1 sm:p-8">
      <div className="mb-5 sm:mb-6">
        <h2 className="font-display text-xl leading-snug sm:text-2xl">{t("review.title")}</h2>
        {hasSummary || reviews.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">{t("review.subtitle")}</p>
        ) : null}
      </div>

      <div className="space-y-5">
        {hasSummary ? (
          <RatingHistogram
            reviews={reviews}
            ratingAvg={ratingAvg}
            ratingCount={ratingCount}
          />
        ) : null}

        {/* With nothing to read yet, "no reviews, be the first" leads and the
            form follows as the way to do it; otherwise the form sits above
            the list. Each placeholder holds the spot of what it stands for,
            so nothing jumps when the list lands. */}
        {isLoading && !hasSummary ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : listEmpty ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100">
              <MessageSquareText aria-hidden className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-base leading-snug">{t("review.empty")}</h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("review.emptyHint")}
            </p>
          </div>
        ) : null}

        {status === "authenticated" ? <ReviewForm courseId={courseId} /> : null}

        {isLoading && hasSummary ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border/80 bg-background/50 p-5 sm:p-6"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-800 text-xs font-semibold text-white"
                  >
                    {r.authorName?.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                      <span className="truncate font-semibold">{r.authorName}</span>
                      <time
                        dateTime={r.createdAt}
                        className="text-xs text-muted-foreground"
                      >
                        {formatDate(r.createdAt)}
                      </time>
                    </div>
                    <Stars
                      value={r.rating}
                      size={14}
                      className="mt-1"
                      label={t("review.starsOutOf", { rating: r.rating })}
                    />
                  </div>
                </div>
                {r.title ? (
                  <h3 className="mt-4 font-semibold leading-snug">{r.title}</h3>
                ) : null}
                {r.body ? (
                  <p
                    className={
                      r.title
                        ? "mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground"
                        : "mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground"
                    }
                  >
                    {r.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

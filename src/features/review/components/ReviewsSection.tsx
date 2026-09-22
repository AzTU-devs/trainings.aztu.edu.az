"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { BlankPlate } from "@/components/editorial/BlankPlate";
import { Note } from "@/components/editorial/Note";
import { useReviews } from "../hooks";
import { useAuth } from "@/features/auth/hooks";
import { useLocale, useT } from "@/i18n/client";
import { bakuDate } from "@/lib/utils/format";
import { Stars } from "./Stars";
import { RatingHistogram } from "./RatingHistogram";
import { ReviewForm } from "./ReviewForm";

type Props = {
  courseId: string;
  ratingAvg: number | string;
  ratingCount: number;
};

/**
 * The body of the course page's "Rəylər" section (the page renders the
 * numbered heading): the rating summary and distribution, the form for a
 * signed-in participant, the reviews, and who may write one.
 *
 * With no ratings it shows an empty plate and one sentence — no histogram and
 * no empty stars, because those would read as a bad score.
 */
export function ReviewsSection({ courseId, ratingAvg, ratingCount }: Props) {
  const t = useT();
  const locale = useLocale();
  const { status } = useAuth();
  const { data, isLoading } = useReviews(courseId);

  const reviews = data?.content ?? [];
  // The summary is the course's aggregate, so it appears once the aggregate
  // has a rating in it. Before that it would be a dash, empty stars and five
  // bars at 0 on top of the empty state: the same "no reviews yet" said twice.
  const hasSummary = ratingCount > 0;
  // The aggregate is known at render time, so an unrated course shows its
  // empty state straight away rather than a placeholder that turns into it.
  const showEmpty = !hasSummary && reviews.length === 0;

  return (
    <div className="mt-8">
      {hasSummary ? (
        <RatingHistogram
          reviews={reviews}
          ratingAvg={ratingAvg}
          ratingCount={ratingCount}
          loaded={!isLoading}
          total={data?.totalElements}
        />
      ) : null}

      {showEmpty ? (
        <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8">
          <BlankPlate label={t("review.zeroPlate")} className="aspect-square sm:aspect-[4/3]" />
          <div className="min-w-0">
            <h3 className="t-title">{t("review.empty")}</h3>
            <p className="t-body mt-2">{t("review.emptyHint")}</p>
          </div>
        </div>
      ) : null}

      {status === "authenticated" ? (
        <div className="mt-10">
          <ReviewForm courseId={courseId} />
        </div>
      ) : null}

      {isLoading && hasSummary ? (
        <div className="mt-10 grid gap-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-card" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <ul className="mt-10">
          {reviews.map((r) => (
            <li key={r.id} className="border-t border-line pb-6.5 pt-6">
              <article>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <Stars value={r.rating} label={t("review.starsOutOf", { rating: r.rating })} />
                  <time dateTime={r.createdAt} className="t-meta">
                    {bakuDate(r.createdAt, locale)}
                  </time>
                </div>
                {r.title ? (
                  <h3 className="t-card mt-3 [overflow-wrap:anywhere]">{r.title}</h3>
                ) : null}
                {r.body ? (
                  <p className="t-body mt-2 max-w-[62ch] whitespace-pre-line [overflow-wrap:anywhere]">
                    {r.body}
                  </p>
                ) : null}
                <p className="t-small mt-4 font-semibold text-ink">{r.authorName}</p>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      {/* The empty state already says who can review; say it here only under reviews. */}
      {status !== "authenticated" && !showEmpty ? (
        <Note className="t-small mt-6">{t("review.joinToReview")}</Note>
      ) : null}
    </div>
  );
}

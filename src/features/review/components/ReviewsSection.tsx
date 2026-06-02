"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useReviews } from "../hooks";
import { useAuth } from "@/features/auth/hooks";
import { useT } from "@/i18n/client";
import { Stars } from "./Stars";
import { RatingHistogram } from "./RatingHistogram";
import { ReviewForm } from "./ReviewForm";

type Props = {
  courseId: string;
  ratingAvg: number | string;
  ratingCount: number;
};

export function ReviewsSection({ courseId, ratingAvg, ratingCount }: Props) {
  const t = useT();
  const { status } = useAuth();
  const { data, isLoading } = useReviews(courseId);

  const reviews = data?.content ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t("review.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("review.subtitle")}</p>
      </div>

      <RatingHistogram
        reviews={reviews}
        ratingAvg={ratingAvg}
        ratingCount={ratingCount}
      />

      {status === "authenticated" ? <ReviewForm courseId={courseId} /> : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState title={t("review.empty")} description={t("review.emptyHint")} />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-semibold text-white"
                >
                  {r.authorName?.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{r.authorName}</span>
                    <Stars value={r.rating} size={14} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {r.title ? (
                <h4 className="mt-3 font-semibold">{r.title}</h4>
              ) : null}
              {r.body ? (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {r.body}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

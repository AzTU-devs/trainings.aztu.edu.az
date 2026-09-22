import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatRating } from "@/lib/utils/format";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { CourseCover } from "@/components/cover/CourseCover";
import { mediaSrc } from "../media";
import { FORMAT_KEY, LEVEL_KEY, formatDuration } from "../format";
import type { CourseSummary } from "../types";
import { CursorPeek } from "./CursorPeek";

/**
 * One row of the numbered course index ("02 · thumb · title · facts · →").
 * `compact` is the narrow home column; the full list adds the expert, format,
 * level, duration and rating columns at ≥1024px (the CSS grid in globals).
 *
 * Server component: never import it from a "use client" file.
 */
export async function IndexRow({
  course,
  category,
  locale,
  number,
  compact = false,
  className,
}: {
  course: CourseSummary;
  category: CategoryRef | null;
  locale: Locale;
  /** 1-based position, printed as "02". */
  number: number;
  compact?: boolean;
  className?: string;
}) {
  const t = await getT(locale);
  const format = t(FORMAT_KEY[course.courseType]);
  const level = t(LEVEL_KEY[course.level]);
  const duration = formatDuration(course.totalDurationSec, t, "short");
  const rated = course.ratingCount > 0;
  const smFacts = [format, level, duration].filter(Boolean).join(" · ");

  return (
    <li className={className}>
      <Link
        href={localeHref(locale, `/courses/${course.slug}`)}
        className="crow"
        data-peek=""
        {...catAttrs(category)}
      >
        <span className="no no-lg" aria-hidden="true">
          {String(number).padStart(2, "0")}
        </span>
        <span className="thumb">
          <CourseCover
            courseId={course.id}
            category={category}
            photoUrl={mediaSrc(course.thumbnailUrl)}
            artRatio={compact ? 1 : 4 / 3}
            variant="thumb"
            sizes="96px"
          />
        </span>
        <span className="min-w-0">
          <span className="ttl block">{course.title}</span>
          <span className="sub">
            {/* uncategorised: the university's own, in the brand navy (data-cat="brand") */}
            {category ? (
              <span lang={category.lang} className="cat-k min-w-0">
                {category.name}
              </span>
            ) : (
              <span className="cat-k min-w-0">AzTU</span>
            )}
            <span className="sm-only">{smFacts}</span>
            {compact ? null : <span className="sm-only">{course.tutorDisplayName}</span>}
          </span>
        </span>
        {compact ? null : (
          <>
            <span className="col">{course.tutorDisplayName}</span>
            <span className="col">{format}</span>
            <span className="col">{level}</span>
            <span className="col t-num">{duration || "—"}</span>
            <span className="col">
              {rated ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star aria-hidden="true" className="size-3.5 fill-current stroke-none text-gold-ink" />
                  <span className="sr-only">
                    {t("ui.ratingSummary", { value: formatRating(course.ratingAvg, locale), count: course.ratingCount })}
                  </span>
                  <span aria-hidden="true">{formatRating(course.ratingAvg, locale)}</span>
                </span>
              ) : (
                <span className="block text-sm leading-tight text-ink-3">{t("ui.noRatingsShort")}</span>
              )}
            </span>
          </>
        )}
        <ArrowRight className="go" aria-hidden="true" strokeWidth={1.75} />
      </Link>
    </li>
  );
}

/**
 * The numbered index list (`ol.cindex`). `head` prints the column heads (≥1024,
 * full list only); `peek` mounts the cursor preview once for the list.
 */
export async function IndexList({
  locale,
  compact = false,
  head = false,
  peek = false,
  id,
  className,
  children,
}: {
  locale: Locale;
  compact?: boolean;
  head?: boolean;
  peek?: boolean;
  /** Needed with `peek` when a page has more than one list. */
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const t = await getT(locale);
  const listId = id ?? "course-index";
  return (
    <div className={className}>
      {head && !compact ? (
        <div className="cindex-head t-kicker" aria-hidden="true">
          <span>{t("ui.indexNo")}</span>
          <span />
          <span>{t("ui.indexCourse")}</span>
          <span>{t("ui.indexExpert")}</span>
          <span>{t("ui.indexFormat")}</span>
          <span>{t("ui.indexLevel")}</span>
          <span>{t("ui.indexDuration")}</span>
          <span>{t("ui.indexRating")}</span>
          <span />
        </div>
      ) : null}
      <ol id={listId} className={cn("cindex", compact && "compact")}>
        {children}
      </ol>
      {peek ? <CursorPeek listId={listId} /> : null}
    </div>
  );
}

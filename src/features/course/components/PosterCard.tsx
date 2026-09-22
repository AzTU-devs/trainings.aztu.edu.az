import Link from "next/link";
import { Building2, ChartNoAxesColumn, Clock, Monitor, Wallet } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatPrice, formatRating } from "@/lib/utils/format";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { CourseCover } from "@/components/cover/CourseCover";
import { Kicker } from "@/components/editorial/Kicker";
import { StatusBadge } from "@/components/ui/badge";
import { RatingInline } from "@/components/ui/rating";
import { Stagger, StaggerItem } from "@/components/motion";
import { mediaSrc } from "../media";
import { isRecent } from "../catalog";
import { FORMAT_KEY, LEVEL_KEY, formatDuration } from "../format";
import type { CourseSummary } from "../types";

/**
 * The catalogue's poster card: the course's cover (4:3, category · format
 * header), a kicker row (category, "Yeni"), the title in the scan face, the
 * expert, and the facts. Below 640px the CSS turns it into a compact 104px
 * media row, so a page of twelve is about two screens on a phone.
 *
 * Server component: never import it from a "use client" file.
 */
export async function PosterCard({
  course,
  category,
  locale,
  now,
  sizes,
  priority = false,
  className,
}: {
  course: CourseSummary;
  category: CategoryRef | null;
  locale: Locale;
  /** Server render time (ms), taken once by the page — drives the "Yeni" badge. */
  now: number;
  /** Kept for callers that stagger manually; unused by the card itself. */
  index?: number;
  sizes?: string;
  /** Load the cover photo eagerly at high priority (a card in the first row). */
  priority?: boolean;
  className?: string;
}) {
  const t = await getT(locale);
  const online = course.courseType === "ONLINE";
  const format = t(FORMAT_KEY[course.courseType]);
  const recent = isRecent(course.publishedAt, now);
  const duration = formatDuration(course.totalDurationSec, t, "short");
  const rated = course.ratingCount > 0;

  return (
    <Link
      href={localeHref(locale, `/courses/${course.slug}`)}
      className={cn("pcard h-full", className)}
      {...catAttrs(category)}
    >
      <CourseCover
        courseId={course.id}
        category={category}
        photoUrl={mediaSrc(course.thumbnailUrl)}
        labels={{ left: category?.short ?? "AzTU", right: format }}
        sizes={sizes ?? "(max-width: 639px) 104px, (max-width: 1023px) 50vw, 440px"}
        priority={priority}
      />
      <div className="k">
        {/* An uncategorised course is the university's own: the same navy
            "AzTU" as its poster (catAttrs gives the card the brand palette),
            so every card in a row keeps the kicker's left anchor. */}
        <Kicker as="span" tone="cat" className="min-w-0">
          {/* the ellipsis needs a block box: .cat-k itself is a flex row */}
          {category ? (
            <span lang={category.lang} className="min-w-0 truncate">{category.name}</span>
          ) : (
            <span className="min-w-0 truncate">AzTU</span>
          )}
        </Kicker>
        {recent ? <StatusBadge tone="new">{t("ui.new")}</StatusBadge> : null}
      </div>
      <h3 className="t-card">{course.title}</h3>
      <p className="by">{course.tutorDisplayName}</p>
      <div className="facts">
        <span className="f">
          {online ? <Monitor aria-hidden="true" strokeWidth={1.75} /> : <Building2 aria-hidden="true" strokeWidth={1.75} />}
          {format}
        </span>
        <span className="f">
          <ChartNoAxesColumn aria-hidden="true" strokeWidth={1.75} />
          {t(LEVEL_KEY[course.level])}
        </span>
        {duration ? (
          <span className="f">
            <Clock aria-hidden="true" strokeWidth={1.75} />
            {duration}
          </span>
        ) : null}
        <RatingInline
          avg={course.ratingAvg}
          count={course.ratingCount}
          locale={locale}
          noneLabel={t("ui.noRatings")}
          srLabel={
            rated
              ? t("ui.ratingSummary", { value: formatRating(course.ratingAvg, locale), count: course.ratingCount })
              : undefined
          }
        />
        {!course.free ? (
          <span className="f">
            <Wallet aria-hidden="true" strokeWidth={1.75} />
            {formatPrice(course.price, course.currency, locale)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/**
 * A grid of poster cards: 1 column on phones (media rows), 2 from 640px, 3
 * from 1024px (`cols={2}` keeps it at two, for exactly two results). The
 * cards cascade in once when the grid scrolls into view.
 *
 * `eager` loads the first N covers at high priority: where the grid opens a
 * page (the catalogue), its first row reaches the fold at 1440×900 and a
 * photo cover there is the page's largest paint, which a lazy image delays.
 */
export async function PosterGrid({
  items,
  locale,
  now,
  cols = 3,
  eager = 0,
  className,
}: {
  items: { course: CourseSummary; category: CategoryRef | null }[];
  locale: Locale;
  now: number;
  cols?: 2 | 3;
  eager?: number;
  className?: string;
}) {
  return (
    <Stagger
      className={cn(
        "grid grid-cols-1 gap-x-(--gutter) gap-y-7 sm:grid-cols-2 sm:gap-y-14 lg:gap-y-16",
        cols === 3 && "lg:grid-cols-3",
        className,
      )}
    >
      {items.map(({ course, category }, i) => (
        <StaggerItem key={course.id} className="min-w-0">
          <PosterCard course={course} category={category} locale={locale} now={now} priority={i < eager} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

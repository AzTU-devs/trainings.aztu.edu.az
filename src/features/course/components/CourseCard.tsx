import { Clock, Sparkles } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { LevelMeter, StarIcon } from "@/components/bright/bits";
import { cn } from "@/lib/utils/cn";
import { CategoryIcon } from "@/features/category/icons";
import type { CategoryStyle } from "@/features/category/style";
import { FORMAT_ICON } from "../format-icons";
import { CoverPhoto } from "./CoverPhoto";
import { mediaSrc } from "../media";
import type { CourseLabels } from "../labels";
import type { CourseSummary } from "../types";

/*
 * Course cards. Server components: every string comes in through `labels`
 * (see ../labels.ts), so nothing here needs the i18n hooks.
 *
 * A course with a thumbnail shows it; one without gets a plain header with
 * its category's icon. Then the title, the expert and up to three facts.
 */

type CardProps = {
  course: CourseSummary;
  /** The category the course is shown under; null draws the neutral icon. */
  category: { name: string; style: CategoryStyle } | null;
  labels: CourseLabels;
};

function FormatIcon({ type }: { type: CourseSummary["courseType"] }) {
  const Icon = FORMAT_ICON[type] ?? FORMAT_ICON.OFFLINE;
  return <Icon className="i" aria-hidden />;
}

/** The photo, or a plain header with the category's icon; the format pill on top. */
export function CourseCover({
  course,
  category,
  labels,
  pills = true,
  className,
}: CardProps & { pills?: boolean; className?: string }) {
  const photo = mediaSrc(course.thumbnailUrl);
  const icon = (
    <span className="cat-ic" aria-hidden>
      <CategoryIcon style={category?.style} />
    </span>
  );
  return (
    <div className={cn("cover plain", category?.style.k ?? "k-navy", className)}>
      {photo ? (
        <CoverPhoto src={photo} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 88px">
          {icon}
        </CoverPhoto>
      ) : (
        icon
      )}
      {pills ? (
        <div className="ov left-3 top-3">
          <span className="pill pill-glass">
            <FormatIcon type={course.courseType} />
            {labels.format[course.courseType]}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** Rating (or "new course"), duration and level — the row under a card title. */
export function CourseMeta({
  course,
  labels,
  withLevel = true,
}: {
  course: CourseSummary;
  labels: CourseLabels;
  withLevel?: boolean;
}) {
  const duration = labels.duration(course.totalDurationSec);
  return (
    <>
      <span className="fmt-m">
        <FormatIcon type={course.courseType} />
        {labels.format[course.courseType]}
      </span>
      {course.ratingCount > 0 ? (
        <span className="rate">
          <StarIcon />
          {labels.rating(course.ratingAvg)} <small>({labels.count(course.ratingCount)})</small>
        </span>
      ) : (
        <span className="fresh">
          <Sparkles className="i" aria-hidden />
          {labels.newCourse}
        </span>
      )}
      {duration ? (
        <span>
          <Clock className="i" aria-hidden />
          {duration}
        </span>
      ) : null}
      {withLevel ? (
        <span className="lv-m">
          <LevelMeter level={course.level} />
          {labels.level[course.level]}
        </span>
      ) : null}
    </>
  );
}

/**
 * The course card. `resp` turns it into a compact row below 640px (the
 * catalogue, the home page), where a column of tall cards would push
 * everything else off the screen.
 */
export function CourseCard({
  course,
  category,
  labels,
  resp,
  heading: Heading = "h3",
}: CardProps & { resp?: boolean; heading?: "h2" | "h3" }) {
  return (
    <article className={cn("card ccard group", resp && "resp")}>
      <CourseCover course={course} category={category} labels={labels} />
      <div className="body min-w-0">
        <Heading className="title clamp-2">
          <LocaleLink className="stretched" href={`/courses/${course.slug}`}>
            {course.title}
          </LocaleLink>
        </Heading>
        {course.tutorDisplayName ? <p className="who">{course.tutorDisplayName}</p> : null}
        <div className="meta">
          <CourseMeta course={course} labels={labels} />
        </div>
      </div>
    </article>
  );
}

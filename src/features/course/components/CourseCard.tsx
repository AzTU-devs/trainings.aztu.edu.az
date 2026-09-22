import Image from "next/image";
import { Clock, MapPin, MonitorPlay, Sparkles } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { Svg } from "@/components/bright/Svg";
import { LevelMeter, StarIcon } from "@/components/bright/bits";
import { coverArt } from "@/lib/art";
import { cn } from "@/lib/utils/cn";
import type { CategoryStyle } from "@/features/category/style";
import { mediaSrc } from "../media";
import type { CourseLabels } from "../labels";
import type { CourseSummary } from "../types";

/*
 * Course cards for the "Bright" design. Server components: every string comes
 * in through `labels` (see ../labels.ts), so nothing here needs the i18n hooks.
 *
 * A course without a thumbnail gets a generated cover in its category's
 * colours; a course with one gets the photo plus a small category "tab" in the
 * corner, so both kinds of cover belong to the same system.
 */

type CardProps = {
  course: CourseSummary;
  /** The category the course is shown under; null paints it in brand navy. */
  category: { name: string; style: CategoryStyle } | null;
  labels: CourseLabels;
};

function FormatIcon({ type }: { type: CourseSummary["courseType"] }) {
  return type === "ONLINE" ? <MonitorPlay className="i" aria-hidden /> : <MapPin className="i" aria-hidden />;
}

export function CourseCover({
  course,
  category,
  labels,
  pills = true,
  className,
}: CardProps & { pills?: boolean; className?: string }) {
  const photo = mediaSrc(course.thumbnailUrl);
  const art = category?.style.art ?? "it";
  return (
    <div className={cn("cover", photo && "photo", className)}>
      {photo ? (
        <Image src={photo} alt="" fill unoptimized sizes="(min-width: 1024px) 25vw, 80vw" />
      ) : (
        <Svg markup={coverArt(art, course.id || course.slug)} />
      )}
      {pills ? (
        <>
          <div className="ov left-3 top-3">
            <span className="pill pill-glass">
              <FormatIcon type={course.courseType} />
              {labels.format[course.courseType]}
            </span>
          </div>
          {labels.isNewCourse(course) ? (
            <div className="ov right-3 top-3">
              <span className="pill pill-gold">{labels.isNew}</span>
            </div>
          ) : null}
        </>
      ) : null}
      {photo ? <span className="ktab" aria-hidden /> : null}
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
 * Image-first card. `resp` turns it into a compact row below 640px (the
 * catalogue), where a column of tall cards would push results off the screen.
 */
export function CourseCard({ course, category, labels, resp }: CardProps & { resp?: boolean }) {
  return (
    <article className={cn("ccard group", category?.style.k ?? "k-navy", resp && "resp")}>
      <CourseCover course={course} category={category} labels={labels} />
      <div className="body flex min-w-0 flex-col gap-2 px-1">
        {category ? <span className="cat-label">{category.name}</span> : null}
        <h3 className="title clamp-2">
          <LocaleLink className="stretched" href={`/courses/${course.slug}`}>
            {course.title}
          </LocaleLink>
        </h3>
        {course.tutorDisplayName ? <p className="who">{course.tutorDisplayName}</p> : null}
        <div className="meta mt-0.5">
          <CourseMeta course={course} labels={labels} />
        </div>
      </div>
    </article>
  );
}

/**
 * The wide spotlight used when there are too few courses for a rail or a
 * grid: one course given the room, with its subtitle and expert.
 */
export function WideCourseCard({
  course,
  category,
  labels,
  cta,
  initials,
}: CardProps & { cta?: boolean; initials: string }) {
  const k = category?.style.k ?? "k-navy";
  return (
    <article className={cn("ccard wide group", k)}>
      <CourseCover course={course} category={category} labels={labels} />
      <div className="relative flex flex-col gap-4">
        {category ? <span className="cat-label">{category.name}</span> : null}
        <h3 className="d-md">
          <LocaleLink className="stretched" href={`/courses/${course.slug}`}>
            {course.title}
          </LocaleLink>
        </h3>
        {course.subtitle ? <p className="text-[17px] leading-relaxed text-ink-2">{course.subtitle}</p> : null}
        {course.tutorDisplayName ? (
          <div className="mt-1 flex items-center gap-3">
            <span className="av round size-11 bg-[var(--k-200)] text-[15px]">
              <span className="ini">{initials}</span>
            </span>
            <div className="leading-tight">
              <div className="text-[13px] text-ink-3">{labels.expert}</div>
              <div className="font-semibold">{course.tutorDisplayName}</div>
            </div>
          </div>
        ) : null}
        <div className="meta text-[14.5px]">
          <CourseMeta course={course} labels={labels} />
          <span className="font-semibold !text-ink">{labels.free}</span>
        </div>
        {cta ? (
          <div className="relative z-[5] pt-2">
            <LocaleLink href={`/courses/${course.slug}`} className="btn btn-primary">
              {labels.viewCourse}
            </LocaleLink>
          </div>
        ) : null}
      </div>
    </article>
  );
}

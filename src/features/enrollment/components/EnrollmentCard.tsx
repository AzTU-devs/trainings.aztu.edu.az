"use client";

import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tag } from "@/components/ui/badge";
import { Kicker } from "@/components/editorial/Kicker";
import { CourseCover } from "@/components/cover/CourseCover";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { FORMAT_KEY } from "@/features/course/format";
import type { CourseType } from "@/features/course/types";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useLocale, useT } from "@/i18n/client";
import { bakuDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Enrollment, EnrollmentStatus } from "../types";

const STATUS_KEYS: Record<EnrollmentStatus, string> = {
  ACTIVE: "student.statusActive",
  COMPLETED: "student.statusCompleted",
  PENDING_PAYMENT: "student.statusPendingPayment",
  CANCELLED: "student.statusCancelled",
  REFUNDED: "student.statusRefunded",
};

/**
 * What the catalogue knows about an enrolled course. An enrolment carries only
 * the course id and title, so the page looks the course up in the published
 * catalogue (see DashboardView's `loadEnrolledCourses`) to draw the same
 * poster the course has everywhere else. Every field may be missing — an
 * unpublished course falls back to the navy "brand" poster seeded by its id.
 */
export type EnrolledCourseMeta = {
  slug?: string | null;
  category?: CategoryRef | null;
  photoUrl?: string | null;
  courseType?: CourseType | null;
};

/*
 * Dates come from bakuDate (month tables, Baku calendar), never Intl: the card
 * renders on the server and again in the browser, and browsers without
 * Azerbaijani date data would print something else — a hydration mismatch.
 * Baku, not UTC, so a course opened just after midnight is dated that day.
 */

/**
 * One enrolment. `row` (default) is an index row for "Kurslarım" and the
 * dashboard list: number, 72px poster, title, progress meter, status and an
 * arrow. `featured` is the dashboard's "Davam edin" cover story. Either way
 * the whole thing is one link into the player.
 */
export function EnrollmentCard({
  enrollment,
  courseSlug,
  featured = false,
  course,
  number,
}: {
  enrollment: Enrollment;
  courseSlug?: string;
  /** The wide "pick up where you left off" block at the top of the dashboard. */
  featured?: boolean;
  course?: EnrolledCourseMeta;
  /** Row number, already padded ("01"). */
  number?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const slug = courseSlug ?? enrollment.courseId;
  const percent = Math.min(100, Math.max(0, Math.round(enrollment.progressPercent ?? 0)));
  const completed = enrollment.status === "COMPLETED";
  const statusLabel = t(STATUS_KEYS[enrollment.status] ?? "student.statusActive");
  const lastOpened = bakuDate(enrollment.lastAccessedAt, locale);
  const enrolledOn = bakuDate(enrollment.enrolledAt, locale);
  const meta = lastOpened
    ? t("student.lastOpened", { date: lastOpened })
    : enrolledOn
      ? t("student.enrolledOn", { date: enrolledOn })
      : null;
  const cta = completed ? t("student.review") : percent > 0 ? t("student.continue") : t("student.start");
  const category = course?.category ?? null;
  const percentLabel = t("student.percent", { n: percent });

  // In progress is the ordinary state — the meter already says it — so only
  // the other states get a tag: completed (gold, with a check), awaiting
  // payment, cancelled, refunded.
  const status = enrollment.status === "ACTIVE" ? null : (
    <Tag
      variant={completed ? "gold" : "mono"}
      icon={completed ? Check : undefined}
      className={cn(!completed && "text-ink-3")}
    >
      {statusLabel}
    </Tag>
  );

  // The bar is decoration: the same figure is printed beside it, and the full
  // sentence ("50% complete") is there for screen readers. The track is the
  // prototype's warm paper-2, so a 0% row reads as empty rather than as a
  // filled grey bar; on night paper paper-2 all but vanishes (a 4% bar would
  // be a gold dot floating in nothing), so the dark edition uses the soft
  // hairline instead. A hovered row is itself paper-2, hence the hairline there.
  const meter = (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="w-11 shrink-0 font-mono text-xs tabular-nums text-ink-2">
        {percentLabel}
      </span>
      <span aria-hidden="true" className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-paper-2 group-hover:bg-line dark:bg-line">
        <span className="block h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </span>
      <span className="sr-only">{t("student.progress", { percent })}</span>
    </div>
  );

  if (featured) {
    return (
      <LocaleLink
        href={`/learn/${slug}`}
        className="group grid gap-x-(--gutter) gap-y-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
      >
        <CourseCover
          courseId={enrollment.courseId}
          category={category}
          photoUrl={course?.photoUrl}
          ratio="16 / 10"
          labels={
            course?.courseType
              ? { left: category?.short ?? "AzTU EduPlatform", right: t(FORMAT_KEY[course.courseType]) }
              : null
          }
          sizes="(max-width: 768px) 100vw, 520px"
          priority
        />
        <div {...catAttrs(category)} className="flex min-w-0 flex-col">
          {category ? (
            <Kicker tone="cat">{category.name}</Kicker>
          ) : (
            <Kicker tone="gold">{t("student.resumeEyebrow")}</Kicker>
          )}
          <h3 className="t-title-l mt-3 decoration-gold decoration-2 underline-offset-[0.14em] group-hover:underline">
            {enrollment.courseTitle}
          </h3>
          {meta ? <p className="t-meta mt-3">{meta}</p> : null}
          {/* Pinned to the bottom of the cover when the text is short; the
              padding keeps a gap above the rule when a long title makes the
              text column the taller one. */}
          <div className="mt-8 md:mt-auto md:pt-6">
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <Kicker as="span" tone="ink-3">
                {t("student.indexProgress")}
              </Kicker>
              {status}
            </div>
            {/* The feature says it in full ("50% tamamlanıb"); rows use the short figure. */}
            <p className="mt-3 font-mono text-xs tabular-nums text-ink-2">{t("student.progress", { percent })}</p>
            <span aria-hidden="true" className="mt-2 block h-1.5 overflow-hidden rounded-full bg-paper-2 dark:bg-line">
              <span className="block h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
            </span>
            <span
              className={cn(buttonVariants({ size: "lg" }), "pointer-events-none mt-6 w-full sm:w-auto")}
            >
              {cta}
              <ArrowRight aria-hidden="true" data-go />
            </span>
          </div>
        </div>
      </LocaleLink>
    );
  }

  return (
    <LocaleLink
      href={`/learn/${slug}`}
      className={cn(
        "group grid grid-cols-[64px_minmax(0,1fr)_20px] items-center gap-x-4 gap-y-3 py-4 transition-colors duration-(--dur-1) hover:bg-paper-2/60",
        "sm:grid-cols-[28px_72px_minmax(0,1fr)_minmax(150px,200px)_20px] sm:gap-x-5 sm:py-5",
      )}
    >
      {number ? (
        <span aria-hidden="true" className="hidden font-mono text-xs text-ink-3 sm:block">
          {number}
        </span>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
      <CourseCover
        courseId={enrollment.courseId}
        category={category}
        photoUrl={course?.photoUrl}
        variant="thumb"
        ratio="1 / 1"
        sizes="72px"
      />
      <div {...catAttrs(category)} className="min-w-0">
        {category ? (
          <Kicker as="span" tone="cat" className="mb-1.5 block truncate">
            {category.name}
          </Kicker>
        ) : null}
        <h3 className="t-card text-[1.0625rem] decoration-gold decoration-2 underline-offset-[0.16em] group-hover:underline sm:text-[1.125rem]">
          {enrollment.courseTitle}
        </h3>
        {meta ? <p className="t-meta mt-1">{meta}</p> : null}
      </div>
      {/* Phones: the meter and the status share one line under the title. */}
      <div className="col-span-2 col-start-2 flex items-center gap-4 sm:col-span-1 sm:col-start-auto sm:grid sm:gap-2.5">
        <div className="min-w-0 flex-1">{meter}</div>
        <div className="shrink-0">{status}</div>
      </div>
      <ArrowRight
        aria-hidden="true"
        strokeWidth={1.75}
        className="col-start-3 row-start-1 size-5 text-ink-3 transition-transform duration-(--dur-2) group-hover:translate-x-[3px] group-hover:text-ink sm:col-start-auto sm:row-start-auto"
      />
      <span className="sr-only">{cta}</span>
    </LocaleLink>
  );
}

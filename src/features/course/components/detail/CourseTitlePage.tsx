import Link from "next/link";
import { Building2, Monitor, Star, Users } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { bakuDate, formatCompact, formatNumber, formatRating } from "@/lib/utils/format";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CourseCover } from "@/components/cover/CourseCover";
import { Kicker } from "@/components/editorial/Kicker";
import { StatusBadge, Tag } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ExpertAvatar } from "@/features/expert/components/ExpertAvatar";
import { isLong } from "../../catalog";
import { FORMAT_KEY } from "../../format";
import { EnrollCta, type EnrollTarget } from "../EnrollCta";
import { SpecStrip, type SpecFact } from "./SpecStrip";
import styles from "./detail.module.css";
import type { Course } from "../../types";
import type { ExpertProfile } from "@/features/expert/types";

/**
 * The wide plate's drawing ratio. CourseCover divides it by the plate's 0.7
 * art band, so this draws for a band about 2.6:1: what is left of a 3:2 frame
 * between its labels and its title block (detail.module.css .plateWide),
 * about 2.9:1 on a 350px phone and 2.4:1 on a 950px tablet.
 */
const WIDE_PLATE_ART = 2.6 * 0.7;

/** Large buttons, a touch narrower below 1280px (see the calls to action). */
const SNUG_LG = "max-xl:px-6 max-xl:text-base";

export type CourseTutor = {
  tutorId: string;
  displayName: string;
  /** The public profile; null when it failed (the byline then shows the name only). */
  profile: ExpertProfile | null;
  /** The colour of the initials when there is no photo: the expert's own field, else the course's. */
  category: CategoryRef | null;
};

/**
 * The course's title page: the trail, the kicker row, the title, the
 * standfirst subtitle, the byline with rating and participants, the calls to
 * action (from 1024px; phones get the enrol card and the fixed bar instead),
 * the book plate, and the spec strip.
 *
 * On phones the order is the reading order: title → subtitle → byline →
 * rating → plate → spec.
 */
export async function CourseTitlePage({
  course,
  category,
  tutors,
  locale,
  photoUrl,
  facts,
  target,
  secondary,
}: {
  course: Course;
  category: CategoryRef | null;
  tutors: CourseTutor[];
  locale: Locale;
  photoUrl: string | null;
  facts: SpecFact[];
  target: EnrollTarget;
  /** The quiet second button: to the curriculum, or to "about" when there is none. */
  secondary: { href: string; label: string };
}) {
  const t = await getT(locale);
  const online = course.courseType === "ONLINE";
  // Both on the Baku calendar, so the plate's year always matches the date.
  const published = bakuDate(course.publishedAt, locale);
  const year = published ? published.slice(published.lastIndexOf(" ") + 1) : "";
  const coursesHref = localeHref(locale, "/courses");
  const plate = {
    courseId: course.id,
    category,
    photoUrl,
    variant: "plate" as const,
    labels: { left: category?.short ?? "AzTU", right: t(FORMAT_KEY[course.courseType]) },
    plateYear: year,
    sizes: "(max-width: 1023px) 100vw, 440px",
    priority: true,
  };

  return (
    <header className="wrap pt-6 lg:pt-8" {...catAttrs(category)}>
      {/* The course title is the trail's current page for assistive tech, but
          it is not printed: the h1 says it right below. */}
      <Breadcrumbs
        className={cn(styles.crumbs, "[&_li:last-child]:sr-only")}
        items={[
          { label: t("common.home"), href: localeHref(locale, "/") },
          { label: t("nav.courses"), href: coursesHref },
          ...(category
            ? [{ label: category.name, href: `${coursesHref}?categoryId=${category.id}`, tone: "cat" as const }]
            : []),
          { label: course.title },
        ]}
      />

      <div className="g12 mt-7 items-start gap-y-9 lg:mt-10">
        <div className="col-span-4 min-w-0 md:col-span-8 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            {category ? (
              <Kicker as="span" tone="cat" className="min-w-0">
                <span className="min-w-0 truncate">{category.name}</span>
              </Kicker>
            ) : null}
            <Tag icon={online ? Monitor : Building2}>
              {t(online ? "ui.onlineCourse" : "ui.offlineCourse")}
            </Tag>
            {published ? (
              <Kicker as="span" tone="ink-3">
                {t("ui.published", { date: published })}
              </Kicker>
            ) : null}
          </div>

          <h1
            id="course-title"
            className={cn("t-display-xl mt-5", isLong(course.title) && "is-long")}
          >
            {course.title}
          </h1>
          {course.subtitle ? (
            <p className="t-lead mt-5 max-w-[54ch]">{course.subtitle}</p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
            {tutors.map((tutor) => {
              const p = tutor.profile;
              const meta = [p?.academicTitle, p?.department]
                .map((part) => part?.trim())
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={tutor.tutorId}
                  href={localeHref(locale, `/experts/${tutor.tutorId}`)}
                  className="group flex min-w-0 items-center gap-3"
                >
                  <ExpertAvatar
                    name={tutor.displayName}
                    avatarUrl={p?.avatarUrl}
                    category={tutor.category}
                    sizes="44px"
                  />
                  <span className="min-w-0 leading-tight">
                    <span className="block font-semibold text-ink decoration-gold decoration-2 underline-offset-4 group-hover:underline">
                      {tutor.displayName}
                    </span>
                    {meta ? <span className="t-meta mt-0.5 block">{meta}</span> : null}
                  </span>
                </Link>
              );
            })}
            <div className="t-small flex flex-wrap items-center gap-x-5 gap-y-2 text-ink-2">
              {course.ratingCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star aria-hidden="true" className="size-4 fill-current stroke-none text-gold-ink" />
                  <b className="font-semibold text-ink">{formatRating(course.ratingAvg, locale)}</b>
                  <span>
                    (
                    {t("courseDetail.ratingsShort", {
                      count: course.ratingCount,
                      shown: formatCompact(course.ratingCount, locale),
                    })}
                    )
                  </span>
                </span>
              ) : (
                <StatusBadge>{t("ui.noRatings")}</StatusBadge>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users aria-hidden="true" strokeWidth={1.75} className="size-4 text-ink-3" />
                {course.enrolledCount > 0
                  ? t("ui.participants", {
                      n: formatNumber(course.enrolledCount, locale),
                      count: course.enrolledCount,
                    })
                  : t("ui.noParticipants")}
              </span>
            </div>
          </div>

          {/* Between 1024 and 1280px the title column is ~550px: the two large
              buttons lose a little padding and type there so they stay on one
              row instead of stacking. */}
          <div className="mt-9 hidden flex-wrap items-center gap-3 lg:flex">
            <EnrollCta target={target} size="lg" arrow hint={false} className={SNUG_LG} />
            <a
              href={secondary.href}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), SNUG_LG)}
            >
              {secondary.label}
            </a>
          </div>
        </div>

        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:col-start-9">
          {/* Two frames, each drawn for its own shape: a 3:2 plate under the
              byline on phones and tablets, the 1:1 book plate beside the title
              from 1024px. One drawing cannot fill both without its figure
              running into the labels or hiding under the title block. 3:2
              rather than 16:9 below 1024px, so the band left between the two
              still holds a whole figure. A photo is the same URL in both, so
              the browser fetches it once. */}
          <CourseCover
            {...plate}
            ratio="3 / 2"
            artRatio={WIDE_PLATE_ART}
            className={cn(styles.plateWide, "lg:hidden")}
          />
          <CourseCover {...plate} ratio="1 / 1" className="hidden lg:block" />
        </div>
      </div>

      <SpecStrip facts={facts} className="mt-10 lg:mt-14" />
    </header>
  );
}

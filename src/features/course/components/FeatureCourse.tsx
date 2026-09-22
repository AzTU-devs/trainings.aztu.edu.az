import Link from "next/link";
import { ArrowRight, Building2, ChartNoAxesColumn, Clock, Monitor, Users } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { bakuDate, formatNumber, formatRating } from "@/lib/utils/format";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { ExpertAvatar } from "@/features/expert/components/ExpertAvatar";
import { CourseCover } from "@/components/cover/CourseCover";
import { Kicker } from "@/components/editorial/Kicker";
import { StatusBadge, Tag } from "@/components/ui/badge";
import { RatingInline } from "@/components/ui/rating";
import { buttonVariants } from "@/components/ui/button";
import { mediaSrc } from "../media";
import { isRecent } from "../catalog";
import { FORMAT_KEY, LEVEL_KEY, formatDuration } from "../format";
import type { CourseSummary } from "../types";

/**
 * The cover story: a big 16:10 cover, the kicker row, a Fraunces title, the
 * subtitle, the expert's byline and the facts. `stack` puts the text under the
 * cover (home, two or more courses); `spread` sets cover (columns 1–7) and
 * text (8–12) side by side with a call to action (a catalogue with one
 * result, a home page with one course).
 *
 * Server component: never import it from a "use client" file.
 */
export async function FeatureCourse({
  course,
  category,
  expert,
  locale,
  now,
  layout,
  headingLevel = "h3",
  cta,
  priority = false,
  className,
}: {
  course: CourseSummary;
  category: CategoryRef | null;
  /** From expertServerApi.byId when it succeeded; otherwise the summary's name is used. */
  expert?: { name: string; title?: string | null; avatarUrl?: string | null } | null;
  locale: Locale;
  now: number;
  layout: "stack" | "spread";
  headingLevel?: "h2" | "h3";
  cta?: { href: string; label: string };
  /** Set when the cover is above the fold. */
  priority?: boolean;
  className?: string;
}) {
  const t = await getT(locale);
  const H = headingLevel;
  const href = localeHref(locale, `/courses/${course.slug}`);
  const online = course.courseType === "ONLINE";
  const format = t(FORMAT_KEY[course.courseType]);
  const duration = formatDuration(course.totalDurationSec, t, "long");
  const published = bakuDate(course.publishedAt, locale);
  const name = expert?.name || course.tutorDisplayName;
  const spread = layout === "spread";

  const cover = (
    // The title below links to the same page; this one is for the pointer only.
    <Link href={href} tabIndex={-1} aria-hidden="true" className="feature block" {...catAttrs(category)}>
      <CourseCover
        courseId={course.id}
        category={category}
        photoUrl={mediaSrc(course.thumbnailUrl)}
        artRatio={16 / 10}
        labels={{ left: category?.short ?? "AzTU", right: format }}
        priority={priority}
        sizes="(max-width: 1023px) 100vw, 800px"
      />
    </Link>
  );

  const text = (
    <div {...catAttrs(category)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {category ? (
          <Kicker as="span" tone="cat">
            <span lang={category.lang}>{category.name}</span>
          </Kicker>
        ) : null}
        <Tag icon={online ? Monitor : Building2}>{format}</Tag>
        {spread && isRecent(course.publishedAt, now) ? (
          <StatusBadge tone="new">{t("ui.new")}</StatusBadge>
        ) : published ? (
          <Kicker as="span">{published}</Kicker>
        ) : null}
      </div>
      <H className="feature-title mt-4">
        <Link href={href}>{course.title}</Link>
      </H>
      {course.subtitle ? <p className="t-lead mt-4 max-w-[48ch]">{course.subtitle}</p> : null}
      <div className="mt-6 flex items-center gap-3">
        <ExpertAvatar name={name} avatarUrl={expert?.avatarUrl} category={category} size={40} sizes="40px" />
        <div className="min-w-0 leading-tight">
          <div className="font-semibold text-ink">{name}</div>
          {expert?.title ? <div className="t-meta mt-0.5">{expert.title}</div> : null}
        </div>
      </div>
      <div className="facts mt-6 border-t border-line pt-4">
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
            course.ratingCount > 0
              ? t("ui.ratingSummary", { value: formatRating(course.ratingAvg, locale), count: course.ratingCount })
              : undefined
          }
        />
        {course.enrolledCount > 0 ? (
          <span className="f">
            <Users aria-hidden="true" strokeWidth={1.75} />
            {t("ui.participants", { n: formatNumber(course.enrolledCount, locale), count: course.enrolledCount })}
          </span>
        ) : (
          <StatusBadge className="norate">{t("ui.noParticipants")}</StatusBadge>
        )}
      </div>
      {cta ? (
        <Link href={cta.href} className={cn(buttonVariants(), "mt-8")}>
          {cta.label}
          <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
        </Link>
      ) : null}
    </div>
  );

  if (spread) {
    return (
      <div className={cn("g12 gap-y-8", className)}>
        <div className="col-span-4 md:col-span-8 lg:col-span-7">{cover}</div>
        <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8 lg:pl-6">{text}</div>
      </div>
    );
  }
  return (
    <div className={className}>
      {cover}
      <div className="mt-7">{text}</div>
    </div>
  );
}

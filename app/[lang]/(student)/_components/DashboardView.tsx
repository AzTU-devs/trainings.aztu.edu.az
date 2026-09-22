import "server-only";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LinkGo } from "@/components/ui/link-go";
import { EmptyState } from "@/components/common/EmptyState";
import { Dateline } from "@/components/editorial/Dateline";
import { Dept } from "@/components/editorial/Dept";
import { Note } from "@/components/editorial/Note";
import {
  EnrollmentCard,
  type EnrolledCourseMeta,
} from "@/features/enrollment/components/EnrollmentCard";
import type { Enrollment } from "@/features/enrollment/types";
import { categoryServerApi } from "@/features/category/api.server";
import { toCategoryRef } from "@/features/category/style";
import { allPublishedCourses, getCategoryIndex } from "@/features/course/catalog.server";
import { mediaSrc } from "@/features/course/media";
import { getT } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { AccountIntro } from "./AccountIntro";

/**
 * Looks each enrolled course up in the published catalogue, so its poster is
 * the one the participant clicked in the catalogue (category colour, photo,
 * format) and its link carries the real slug.
 *
 * Read-only and cached: the category list and the catalogue walks are the
 * same 60 s entries the home page and the catalogue use. The account pages
 * are per-user (dynamic) anyway, so this changes no route's caching. If
 * anything fails the map is simply empty: posters fall back to the navy
 * "brand" colours seeded by the course id, and links to the course id, as
 * before.
 */
export async function loadEnrolledCourses(
  locale: Locale,
  enrollments: readonly Enrollment[],
): Promise<Map<string, EnrolledCourseMeta>> {
  const out = new Map<string, EnrolledCourseMeta>();
  if (enrollments.length === 0) return out;
  try {
    const [categories, all, t] = await Promise.all([
      categoryServerApi.listCached(60),
      allPublishedCourses(),
      getT(locale),
    ]);
    const index = await getCategoryIndex(categories, { revalidate: 60 });
    const byId = new Map(all.courses.map((c) => [c.id, c] as const));
    for (const e of enrollments) {
      const summary = byId.get(e.courseId);
      const primary = index.primaryOf(e.courseId);
      out.set(e.courseId, {
        slug: summary?.slug ?? null,
        category: primary ? toCategoryRef(primary, t, locale) : null,
        photoUrl: mediaSrc(summary?.thumbnailUrl),
        courseType: summary?.courseType ?? null,
      });
    }
  } catch {
    // Decoration only — see above.
  }
  return out;
}

/** The dashboard's list under the "Davam edin" feature. */
const MORE_ROWS = 4;

/**
 * The dashboard body, kept apart from the page so the page only has to load
 * the session and the enrolments. Every figure on it is derived from those
 * enrolments — nothing is estimated or padded.
 */
export async function DashboardView({
  locale,
  name,
  enrollments,
}: {
  locale: Locale;
  name: string;
  enrollments: Enrollment[];
}) {
  const t = await getT(locale);
  const courses = await loadEnrolledCourses(locale, enrollments);

  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const completed = enrollments.filter((e) => e.status === "COMPLETED");
  const totalProgress = active.length
    ? Math.round(active.reduce((s, e) => s + (e.progressPercent ?? 0), 0) / active.length)
    : 0;

  const inProgress = active
    .slice()
    .sort((a, b) => {
      const av = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const bv = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return bv - av;
    })
    .slice(0, 1 + MORE_ROWS);
  const [resume, ...others] = inProgress;

  // Today in Baku, so the server never greets someone with yesterday's date.
  // The date itself comes from formatDate like every other date on the site
  // ("22 sentyabr 2026", "22 September 2026"); only the weekday name is
  // Intl's. Server-only, so Intl with the az locale is safe here (Node has
  // the data), and en-GB rather than en keeps day-before-month.
  const now = new Date();
  const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku" }).format(now);
  const weekday = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "az", {
    weekday: "long",
    timeZone: "Asia/Baku",
  }).format(now);
  const today = t("student.datelineToday", { weekday, date: formatDate(todayIso, locale) });

  const hasAny = active.length > 0 || completed.length > 0;
  const card = (e: Enrollment) => {
    const meta = courses.get(e.courseId);
    return { course: meta, courseSlug: meta?.slug ?? undefined };
  };

  // "All my courses" sits on the last section opener that is rendered: the
  // list when there is one, otherwise the "Davam edin" feature.
  const allMine = (
    <LinkGo href={localeHref(locale, "/my-courses")} className="t-small">
      {t("student.allMyCourses")}
    </LinkGo>
  );

  // Section numbers follow the sections actually rendered.
  let n = 0;
  const next = () => String(++n).padStart(2, "0");

  const stats = [
    { label: t("student.statActive"), value: String(active.length) },
    { label: t("student.statProgress"), value: t("student.percent", { n: totalProgress }) },
    { label: t("student.statCompleted"), value: String(completed.length) },
  ];

  return (
    <div>
      <Dateline items={[t("student.datelineUniversity"), today]} />

      <AccountIntro
        className="mt-8 md:mt-10"
        title={t("student.greeting", { name })}
        description={
          hasAny ? t("student.summary", { active: active.length, completed: completed.length }) : undefined
        }
        aside={
          // With nothing enrolled the empty state below carries this action.
          hasAny ? (
            <Link href={localeHref(locale, "/courses")} className={buttonVariants({ variant: "outline" })}>
              {t("student.browseCatalog")}
              <ArrowRight aria-hidden="true" data-go />
            </Link>
          ) : null
        }
      />

      {hasAny ? (
        <dl
          aria-label={t("student.dashboardStats")}
          className="mt-10 grid grid-cols-3 border-y border-line-strong md:mt-12"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={cn("min-w-0 py-4 md:py-5", i > 0 ? "border-l border-line pl-3 sm:pl-5" : "pr-3")}
            >
              <dt className="t-kicker text-ink-3">{s.label}</dt>
              <dd className="mt-3 font-display text-[clamp(2rem,1.5rem+1.6vw,3rem)] leading-none tracking-[-0.02em] text-head tabular-nums [font-variation-settings:'SOFT'_30,'WONK'_0]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {resume ? (
        <section aria-labelledby="dash-resume" className="mt-14 md:mt-20">
          <Dept
            number={next()}
            id="dash-resume"
            label={t("student.resumeTitle")}
            aside={others.length ? undefined : allMine}
          />
          <div className="mt-6 md:mt-8">
            <EnrollmentCard enrollment={resume} featured {...card(resume)} />
          </div>
        </section>
      ) : null}

      {others.length ? (
        <section aria-labelledby="dash-more" className="mt-14 md:mt-20">
          <Dept number={next()} id="dash-more" label={t("nav.myCourses")} aside={allMine} />
          {/* Numbered from 01 within the list, as on /my-courses: the section
              opener already carries its own number. */}
          <ol className="mt-2 divide-y divide-line border-b border-line">
            {others.map((e, i) => (
              <li key={e.id}>
                <EnrollmentCard enrollment={e} number={String(i + 1).padStart(2, "0")} {...card(e)} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {!hasAny ? (
        <section aria-labelledby="dash-empty" className="mt-14 md:mt-16">
          <Dept number={next()} id="dash-empty" label={t("nav.myCourses")} as="p" />
          <EmptyState
            compact
            plate={t("student.plateCourses")}
            headingLevel="h2"
            title={t("student.noEnrollments")}
            description={t("student.dashboardEmptyHint")}
            className="mt-6 border-t-0 pt-0"
            action={
              <Link href={localeHref(locale, "/courses")} className={buttonVariants()}>
                {t("student.browseCatalog")}
                <ArrowRight aria-hidden="true" data-go />
              </Link>
            }
          />
        </section>
      ) : !resume ? (
        <Note className="mt-14 md:mt-16">
          <p className="font-semibold text-ink">{t("student.noActive")}</p>
          <p className="mt-1">{t("student.noActiveHint")}</p>
          <p className="mt-3">
            <LinkGo href={localeHref(locale, "/my-courses")} className="t-small">
              {t("student.allMyCourses")}
            </LinkGo>
          </p>
        </Note>
      ) : null}
    </div>
  );
}

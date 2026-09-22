import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Dept } from "@/components/editorial/Dept";
import { Kicker } from "@/components/editorial/Kicker";
import { EnrollmentCard } from "@/features/enrollment/components/EnrollmentCard";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import type { Enrollment } from "@/features/enrollment/types";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AccountIntro } from "../_components/AccountIntro";
import { loadEnrolledCourses } from "../_components/DashboardView";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("nav.myCourses") };
}

export default async function MyCoursesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const enrollments = await enrollmentServerApi.mine().catch(() => []);
  const courses = await loadEnrolledCourses(locale, enrollments);

  // Every enrolment is listed, as before; they are only grouped by where they
  // stand — in progress first, then completed, then anything else (awaiting
  // payment, cancelled, refunded). Empty groups are not rendered, and the
  // section numbers follow the groups that are.
  const groups: { id: string; label: string; items: Enrollment[] }[] = [
    { id: "active", label: t("student.groupActive"), items: enrollments.filter((e) => e.status === "ACTIVE") },
    {
      id: "completed",
      label: t("student.groupCompleted"),
      items: enrollments.filter((e) => e.status === "COMPLETED"),
    },
    {
      id: "other",
      label: t("student.groupOther"),
      items: enrollments.filter((e) => e.status !== "ACTIVE" && e.status !== "COMPLETED"),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div>
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("student.myCoursesTitle")}
        description={t("student.myCoursesSubtitle")}
        aside={
          enrollments.length > 0 ? (
            <Link href={localeHref(locale, "/courses")} className={buttonVariants({ variant: "outline" })}>
              {t("student.browseCatalog")}
              <ArrowRight aria-hidden="true" data-go />
            </Link>
          ) : null
        }
      />

      {enrollments.length === 0 ? (
        <EmptyState
          compact
          plate={t("student.plateCourses")}
          headingLevel="h2"
          title={t("student.noEnrollments")}
          description={t("student.dashboardEmptyHint")}
          className="mt-12 border-line-strong"
          action={
            <Link href={localeHref(locale, "/courses")} className={buttonVariants()}>
              {t("student.browseCatalog")}
              <ArrowRight aria-hidden="true" data-go />
            </Link>
          }
        />
      ) : (
        groups.map((g, gi) => (
          <section key={g.id} aria-labelledby={`mc-${g.id}`} className="mt-12 md:mt-16">
            <Dept
              number={String(gi + 1).padStart(2, "0")}
              id={`mc-${g.id}`}
              label={g.label}
              aside={
                <Kicker as="span" tone="ink-3">
                  {t("ui.courseCount", { n: g.items.length, count: g.items.length })}
                </Kicker>
              }
            />
            <div
              aria-hidden="true"
              className="t-kicker mt-4 hidden grid-cols-[28px_72px_minmax(0,1fr)_minmax(150px,200px)_20px] gap-x-5 border-b border-line pb-3 text-ink-3 sm:grid"
            >
              <span>{t("ui.indexNo")}</span>
              <span className="col-span-2">{t("ui.indexCourse")}</span>
              <span>{t("student.indexProgress")}</span>
            </div>
            <ol className="divide-y divide-line border-b border-line">
              {g.items.map((e, i) => {
                const meta = courses.get(e.courseId);
                return (
                  <li key={e.id}>
                    <EnrollmentCard
                      enrollment={e}
                      course={meta}
                      courseSlug={meta?.slug ?? undefined}
                      number={String(i + 1).padStart(2, "0")}
                    />
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}

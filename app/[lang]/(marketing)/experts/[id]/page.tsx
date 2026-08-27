import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { CourseGrid } from "@/features/course/components/CourseGrid";
import { expertServerApi } from "@/features/expert/api.server";
import { coursesByExpert } from "@/features/expert/directory.server";
import { ExpertProfileCard } from "@/features/expert/components/ExpertProfileCard";
import { fullExpertName, type ExpertProfile } from "@/features/expert/types";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const expert = await expertServerApi.byId(id);
    return {
      title: fullExpertName(expert),
      description: expert.headline ?? expert.bio?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: "Expert" };
  }
}

export default async function PublicExpertPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // Profile and catalogue are independent: a profile that fails to load should
  // not hide the expert's courses, and vice versa.
  const [expert, courses] = await Promise.all([
    expertServerApi.byId(id).catch((): ExpertProfile | null => null),
    coursesByExpert(id),
  ]);

  if (!expert || expert.approvalStatus !== "APPROVED") {
    return (
      <div className="container-fluid max-w-3xl py-20">
        <EmptyState
          title={t("experts.notFoundTitle")}
          description={t("experts.notFoundHint")}
          action={
            <Link href={localeHref(locale, "/experts")}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="size-4" />
                {t("experts.backToExperts")}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const name = fullExpertName(expert);

  return (
    <>
      <section className="surface-paper border-b border-border">
        <div className="container-fluid py-14">
          <Breadcrumbs
            className="mb-10"
            items={[
              { label: t("common.home"), href: localeHref(locale, "/") },
              { label: t("nav.experts"), href: localeHref(locale, "/experts") },
              { label: name },
            ]}
          />
          <div className="max-w-3xl">
            <ExpertProfileCard
              expert={expert}
              labels={{
                reviews: t("experts.reviews", { count: expert.ratingCount }),
                years: t("experts.years", { count: expert.yearsExperience ?? 0 }),
                specialties: t("experts.specialties", {
                  count: expert.expertiseCategoryIds.length,
                }),
                about: t("experts.about"),
                website: t("experts.website"),
                linkedin: t("experts.linkedin"),
              }}
            />
          </div>
        </div>
      </section>

      <section className="container-fluid py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">
              {t("experts.coursesEyebrow")}
            </div>
            <h2 className="font-display mt-4 text-3xl leading-tight">
              {t("experts.coursesBy", { name })}
            </h2>
          </div>
          <Link href={localeHref(locale, "/experts")} className="shrink-0">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              {t("experts.backToExperts")}
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          {courses.length ? (
            <CourseGrid courses={courses} />
          ) : (
            <EmptyState
              title={t("experts.noCourses")}
              description={t("experts.noCoursesHint")}
              action={
                <Link href={localeHref(locale, "/courses")}>
                  <Button variant="outline">{t("home.browseCourses")}</Button>
                </Link>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}

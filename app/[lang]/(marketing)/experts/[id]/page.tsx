import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeading } from "@/components/common/SectionHeading";
import { CourseGrid } from "@/features/course/components/CourseGrid";
import type { Category } from "@/features/category/types";
import { expertServerApi } from "@/features/expert/api.server";
import { coursesByExpert } from "@/features/expert/directory.server";
import {
  ExpertProfileCard,
  type ExpertFact,
} from "@/features/expert/components/ExpertProfileCard";
import { fullExpertName, type ExpertProfile } from "@/features/expert/types";
import { getT } from "@/i18n/server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; id: string }> };

/**
 * Category names for the expertise card, cached for this page's own 300s.
 * Read here rather than through `categoryServerApi.list()`, which is
 * deliberately uncached (a new category must appear in the catalogue at
 * once): an uncached fetch would turn this ISR page into a render per request
 * just to label a few chips. A category that shows up here a few minutes late
 * costs nothing. A failure only hides the card.
 */
function categoriesForExpertise(): Promise<Category[]> {
  return serverFetch<Category[]>(endpoints.public.categories, {
    revalidate: 300,
    tags: ["categories:list"],
  }).catch((): Category[] => []);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  try {
    const expert = await expertServerApi.byId(id);
    const affiliation = [expert.academicTitle, expert.department]
      .filter(Boolean)
      .join(", ");
    return {
      title: fullExpertName(expert),
      description:
        expert.headline ||
        affiliation ||
        expert.bio?.slice(0, 160) ||
        undefined,
    };
  } catch {
    const t = await getT(isLocale(lang) ? lang : defaultLocale);
    return { title: t("experts.metaFallback") };
  }
}

export default async function PublicExpertPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // Profile and catalogue are independent: a profile that fails to load should
  // not hide the expert's courses, and vice versa.
  const [expert, courses, categories] = await Promise.all([
    expertServerApi.byId(id).catch((): ExpertProfile | null => null),
    coursesByExpert(id),
    categoriesForExpertise(),
  ]);

  if (!expert || expert.approvalStatus !== "APPROVED") {
    return (
      // Nested because `container-fluid` sets its own max-width, which beat a
      // `max-w-3xl` on the same element and left the notice page-wide.
      <div className="container-fluid py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title={t("experts.notFoundTitle")}
            description={t("experts.notFoundHint")}
            action={
              <Link
                href={localeHref(locale, "/experts")}
                className={buttonVariants({ variant: "outline" })}
              >
                <ArrowLeft className="size-4" />
                {t("experts.backToExperts")}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const name = fullExpertName(expert);

  // Figures from the published catalogue, which the profile does not carry.
  // Participants are enrolments summed over the expert's courses, the same
  // figure the directory card shows. Neither is listed at zero: with no
  // courses the section below already says so, and an empty count is noise.
  const participants = courses.reduce((n, c) => n + (c.enrolledCount ?? 0), 0);
  const facts: ExpertFact[] = [];
  if (courses.length) {
    facts.push({
      icon: BookOpen,
      label: t("experts.courses", { count: courses.length }),
    });
  }
  if (participants > 0) {
    facts.push({
      icon: Users,
      label: t("experts.students", { count: participants }),
    });
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const areas = expert.expertiseCategoryIds.flatMap((categoryId) => {
    const category = categoryById.get(categoryId);
    return category
      ? [
          {
            id: category.id,
            name: category.name,
            href: `/courses?categoryId=${category.id}`,
          },
        ]
      : [];
  });

  return (
    <>
      <div className="container-fluid pt-6 sm:pt-10">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: t("common.home"), href: localeHref(locale, "/") },
            { label: t("nav.experts"), href: localeHref(locale, "/experts") },
            { label: name },
          ]}
        />
        <ExpertProfileCard
          expert={expert}
          locale={locale}
          facts={facts}
          expertise={{ title: t("experts.expertise"), areas }}
          labels={{
            reviews: t("experts.reviews", { count: expert.ratingCount }),
            years: t("experts.years", { count: expert.yearsExperience ?? 0 }),
            specialties: t("experts.specialties", {
              count: expert.expertiseCategoryIds.length,
            }),
            about: t("experts.about"),
            website: t("experts.website"),
            linkedin: t("experts.linkedin"),
            eyebrow: t("experts.profileEyebrow"),
          }}
          details={{
            education: t("experts.education"),
            certifications: t("experts.certifications"),
            languages: t("experts.languages"),
            googleScholar: t("experts.googleScholar"),
            researchGate: t("experts.researchGate"),
            orcid: t("experts.orcid"),
            github: t("experts.github"),
          }}
        />
      </div>

      <section className="container-fluid pb-20 pt-16 sm:pb-24 sm:pt-20">
        {/* No "all experts" action here: the breadcrumb above already leads
            back, and on a phone the button sat between this heading and the
            courses it introduces. */}
        <SectionHeading
          eyebrow={t("experts.coursesEyebrow")}
          title={t("experts.coursesBy", { name })}
        />

        <div className="mt-10">
          {courses.length ? (
            <CourseGrid courses={courses} />
          ) : (
            <EmptyState
              title={t("experts.noCourses")}
              description={t("experts.noCoursesHint")}
              action={
                <Link
                  href={localeHref(locale, "/courses")}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <BookOpen className="size-4" />
                  {t("home.browseCourses")}
                </Link>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}

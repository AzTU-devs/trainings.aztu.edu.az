import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Users, Globe, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CurriculumAccordion } from "@/features/course/components/CurriculumAccordion";
import { EnrollCta } from "@/features/course/components/EnrollCta";
import { ReviewsSection } from "@/features/review/components/ReviewsSection";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseServerApi } from "@/features/course/api.server";
import {
  formatCompact,
  formatDuration,
  formatPrice,
  formatRating,
} from "@/lib/utils/format";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import type { ApiError } from "@/types/api";

type Props = { params: Promise<{ slug: string; lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const c = await courseServerApi.bySlug(slug);
    return {
      title: c.title,
      description: c.subtitle ?? c.description?.slice(0, 160) ?? undefined,
      openGraph: {
        title: c.title,
        description: c.subtitle ?? undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "Course" };
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  let course;
  try {
    course = await courseServerApi.bySlug(slug);
  } catch (err) {
    if ((err as ApiError).status === 404) notFound();
    throw err;
  }

  const totalSeconds =
    course.onlineDetails?.totalVideoSeconds ??
    course.modules.reduce(
      (s, m) => s + m.lessons.reduce((x, l) => x + (l.durationSeconds ?? 0), 0),
      0,
    );
  const lessonCount = course.modules.reduce(
    (s, m) => s + m.lessons.length,
    0,
  );

  return (
    <>
      <section className="surface-paper border-b border-border">
        <div className="container-fluid grid gap-8 py-12 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Breadcrumbs
              items={[
                { label: "Home", href: localeHref(locale, "/") },
                { label: t("nav.courses"), href: localeHref(locale, "/courses") },
                { label: course.title },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={course.courseType === "ONLINE" ? "default" : "secondary"}>
                {course.courseType === "ONLINE"
                  ? t("common.online")
                  : t("common.offline")}
              </Badge>
              <Badge variant="outline">{course.level}</Badge>
              {course.free ? <Badge variant="success">{t("common.free")}</Badge> : null}
            </div>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">
              {course.title}
            </h1>
            {course.subtitle ? (
              <p className="text-lg text-muted-foreground">{course.subtitle}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-gold-500 text-gold-500" />
                <span className="font-medium text-foreground">
                  {formatRating(course.ratingAvg)}
                </span>{" "}
                ({t("courseDetail.ratingsCount", {
                  count: formatCompact(course.ratingCount),
                })})
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {t("courseDetail.studentsCount", {
                  count: formatCompact(course.enrolledCount),
                })}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="size-4" />
                {course.language?.toUpperCase()}
              </span>
            </div>
            <p className="text-sm">
              {t("courseDetail.createdBy")}{" "}
              <Link
                href={localeHref(locale, `/experts/${course.tutorId}`)}
                className="font-medium text-primary hover:underline"
              >
                {course.tutorDisplayName}
              </Link>
            </p>
          </div>

          <Card className="self-start lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-6">
              <div className="text-3xl font-bold">
                {course.free
                  ? t("common.free")
                  : formatPrice(course.price, course.currency)}
              </div>
              <EnrollCta course={course} />
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4" />
                  {t("courseDetail.lessonsTotal", {
                    lessons: lessonCount,
                    duration: formatDuration(totalSeconds),
                  })}
                </div>
                {course.onlineDetails?.hasCertificate ? (
                  <div>{t("courseDetail.certificate")}</div>
                ) : null}
                {course.offlineDetails ? (
                  <div>
                    {course.offlineDetails.city ?? ""}
                    {course.offlineDetails.studentLimit
                      ? ` · ${t("courseDetail.seats", {
                          enrolled: course.offlineDetails.enrolledCount,
                          limit: course.offlineDetails.studentLimit,
                        })}`
                      : ""}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto grid gap-12 px-4 py-12 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {course.learningOutcomes ? (
            <div className="space-y-3">
              <h2 className="font-display text-xl leading-snug">{t("courseDetail.whatYouLearn")}</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {course.learningOutcomes}
              </p>
            </div>
          ) : null}

          {course.description ? (
            <div className="space-y-3">
              <h2 className="font-display text-xl leading-snug">{t("courseDetail.description")}</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {course.description}
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            <h2 className="font-display text-xl leading-snug">{t("courseDetail.curriculum")}</h2>
            <CurriculumAccordion
              modules={course.modules}
              emptyMessage={t("courseDetail.curriculumEmpty")}
            />
          </div>

          {course.requirements ? (
            <div className="space-y-3">
              <h2 className="font-display text-xl leading-snug">{t("courseDetail.requirements")}</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {course.requirements}
              </p>
            </div>
          ) : null}

          <ReviewsSection
            courseId={course.id}
            ratingAvg={course.ratingAvg}
            ratingCount={course.ratingCount}
          />
        </div>

        <aside className="space-y-4">
          <h3 className="text-lg font-semibold">{t("courseDetail.aboutExpert")}</h3>
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-800 text-base font-semibold text-white"
                >
                  {course.tutorDisplayName
                    ?.split(/\s+/)
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {course.tutorDisplayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCompact(course.enrolledCount)} students
                  </div>
                </div>
              </div>
              <Link
                href={localeHref(locale, `/experts/${course.tutorId}`)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("courseDetail.viewProfile")} →
              </Link>
            </CardContent>
          </Card>
        </aside>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.subtitle ?? course.description ?? course.title,
          inLanguage: course.language,
          provider: { "@type": "Organization", name: "EduPlatform" },
          aggregateRating:
            course.ratingCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: course.ratingAvg,
                  ratingCount: course.ratingCount,
                }
              : undefined,
          offers: {
            "@type": "Offer",
            price: course.free ? "0" : course.price,
            priceCurrency: course.currency,
            availability: "https://schema.org/InStock",
          },
        }}
      />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookOpen, Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { EnrollmentCard } from "@/features/enrollment/components/EnrollmentCard";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AccountIntro } from "../_components/AccountIntro";

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

  return (
    <div className="space-y-8">
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("student.myCoursesTitle")}
        description={t("student.myCoursesSubtitle")}
        aside={
          enrollments.length > 0 ? (
            <Link
              href={localeHref(locale, "/courses")}
              className={buttonVariants({ variant: "outline" })}
            >
              <Compass />
              {t("student.browseCatalog")}
            </Link>
          ) : null
        }
      />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<BookOpen strokeWidth={1.75} />}
          title={t("student.noEnrollments")}
          description={t("student.dashboardEmptyHint")}
          action={
            <Link href={localeHref(locale, "/courses")} className={buttonVariants()}>
              {t("student.browseCatalog")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((e) => (
            <EnrollmentCard key={e.id} enrollment={e} />
          ))}
        </div>
      )}
    </div>
  );
}

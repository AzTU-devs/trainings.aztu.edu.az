import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { EnrollmentCard } from "@/features/enrollment/components/EnrollmentCard";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "My courses" };

type Props = { params: Promise<{ lang: string }> };

export default async function MyCoursesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const enrollments = await enrollmentServerApi.mine().catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl leading-tight">
        {t("student.myCoursesTitle")}
      </h1>

      {enrollments.length === 0 ? (
        <EmptyState
          title={t("student.noEnrollments")}
          action={
            <Link href={localeHref(locale, "/courses")}>
              <Button>{t("student.browseCatalog")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <EnrollmentCard key={e.id} enrollment={e} />
          ))}
        </div>
      )}
    </div>
  );
}

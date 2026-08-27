import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { listExperts } from "@/features/expert/directory.server";
import { ExpertCard } from "@/features/expert/components/ExpertCard";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Experts",
  description:
    "Meet the AzTU EduPlatform experts — faculty and industry specialists teaching online and in person.",
};

type Props = { params: Promise<{ lang: string }> };

export default async function ExpertsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const experts = await listExperts();

  return (
    <>
      <section className="surface-paper border-b border-border">
        <div className="container-fluid flex flex-col gap-8 py-16 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">
              {t("experts.eyebrow")}
            </div>
            <h1 className="font-display mt-5 text-balance text-4xl leading-[1.12] sm:text-5xl">
              {t("experts.title")}
            </h1>
            <p className="mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              {t("experts.subtitle")}
            </p>
          </div>
          {experts.length ? (
            <p className="shrink-0 text-sm text-muted-foreground">
              {t("experts.count", { count: experts.length })}
            </p>
          ) : null}
        </div>
      </section>

      <div className="container-fluid py-16">
        {experts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {experts.map((e) => (
              <ExpertCard
                key={e.id}
                expert={e}
                labels={{
                  courses: t("experts.courses", { count: e.courseCount }),
                  students: t("experts.students", { count: e.enrolledCount }),
                  online: t("common.online"),
                  offline: t("common.offline"),
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("experts.empty")}
            description={t("experts.emptyHint")}
            action={
              <Link href={localeHref(locale, "/courses")}>
                <Button variant="outline" className="gap-2">
                  <Users className="size-4" />
                  {t("home.browseCourses")}
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Award, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { EnrollmentCard } from "@/features/enrollment/components/EnrollmentCard";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { fullName } from "@/types/user";

export const metadata: Metadata = { title: "Dashboard" };

type Props = { params: Promise<{ lang: string }> };

export default async function DashboardPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);
  const user = await getSession();

  const enrollments = await enrollmentServerApi.mine().catch(() => []);

  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const completed = enrollments.filter((e) => e.status === "COMPLETED");
  const totalProgress = active.length
    ? Math.round(
        active.reduce((s, e) => s + (e.progressPercent ?? 0), 0) / active.length,
      )
    : 0;

  const inProgress = active
    .slice()
    .sort((a, b) => {
      const av = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
      const bv = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
      return bv - av;
    })
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative space-y-1">
          <p className="text-sm font-medium text-primary">
            {new Date().toLocaleDateString(locale, { weekday: "long" })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("student.greeting", { name: user ? fullName(user) : "" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {active.length > 0
              ? `${active.length} active · ${completed.length} completed`
              : t("student.noEnrollments")}
          </p>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <StatTile
            icon={<BookOpen className="size-4" />}
            label="Active courses"
            value={String(active.length)}
          />
          <StatTile
            icon={<Activity className="size-4" />}
            label="Avg. progress"
            value={`${totalProgress}%`}
          />
          <StatTile
            icon={<Award className="size-4" />}
            label="Completed"
            value={String(completed.length)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">{t("student.continueLearning")}</h2>
          {active.length > 3 ? (
            <Link
              href={localeHref(locale, "/my-courses")}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("common.viewAll")} <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
        {inProgress.length === 0 ? (
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
            {inProgress.map((e) => (
              <EnrollmentCard key={e.id} enrollment={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

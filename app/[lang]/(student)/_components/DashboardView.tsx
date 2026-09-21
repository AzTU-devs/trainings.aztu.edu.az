import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowRight, Award, BookOpen, Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { EnrollmentCard } from "@/features/enrollment/components/EnrollmentCard";
import type { Enrollment } from "@/features/enrollment/types";
import { getT } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import { AccountIntro } from "./AccountIntro";

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
  const [resume, ...others] = inProgress;

  // Pinned to Baku so the server never greets someone with yesterday's date.
  const today = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Baku",
  }).format(new Date());

  const hasAny = active.length > 0 || completed.length > 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      <AccountIntro
        eyebrow={today.charAt(0).toLocaleUpperCase(locale) + today.slice(1)}
        title={t("student.greeting", { name })}
        description={
          hasAny
            ? t("student.summary", { active: active.length, completed: completed.length })
            : undefined
        }
        aside={
          // With nothing enrolled the empty state below carries this action.
          hasAny ? (
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

      {hasAny ? (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <StatTile
            icon={<BookOpen />}
            label={t("student.statActive")}
            value={String(active.length)}
          />
          <StatTile
            icon={<Activity />}
            label={t("student.statProgress")}
            value={`${totalProgress}%`}
          />
          <StatTile
            icon={<Award />}
            label={t("student.statCompleted")}
            value={String(completed.length)}
          />
        </div>
      ) : null}

      <section aria-labelledby="continue-learning" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 id="continue-learning" className="font-display text-2xl leading-tight">
            {t("student.continueLearning")}
          </h2>
          {active.length > 3 ? (
            <Link
              href={localeHref(locale, "/my-courses")}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "group -mr-2")}
            >
              {t("common.viewAll")}
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ) : null}
        </div>

        {!resume ? (
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
          <div className="space-y-4">
            <EnrollmentCard enrollment={resume} featured />
            {others.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {others.map((e) => (
                  <EnrollmentCard key={e.id} enrollment={e} />
                ))}
              </div>
            ) : null}
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
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    // Three across even on a phone, where the icon steps aside so the figure
    // and its label have the room.
    <div className="flex min-w-0 flex-col gap-3 rounded-3xl border border-border/80 bg-card px-3.5 py-4 elev-1 sm:p-5 lg:flex-row lg:items-center lg:gap-4">
      <span
        aria-hidden
        className="hidden size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100 sm:grid [&_svg]:size-5"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-2xl leading-none tabular-nums sm:text-3xl">{value}</div>
        <div className="mt-1.5 text-xs leading-snug text-muted-foreground sm:text-sm">
          {label}
        </div>
      </div>
    </div>
  );
}

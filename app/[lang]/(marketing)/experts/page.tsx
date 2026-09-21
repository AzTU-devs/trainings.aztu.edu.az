import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageIntro } from "@/components/common/PageIntro";
import { Stagger, StaggerItem } from "@/components/motion";
import { listExperts } from "@/features/expert/directory.server";
import {
  ExpertCard,
  ExpertInviteCard,
} from "@/features/expert/components/ExpertCard";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return {
    title: t("experts.metaTitle"),
    description: t("experts.metaDescription"),
  };
}

/**
 * Column spans for the invitation tile, per breakpoint of the grid below
 * (2 columns at sm, 3 at lg, 4 at xl): it takes the rest of the last row, or
 * a row of its own when that row is full. Static strings so Tailwind sees
 * every class.
 */
const SM_SPAN = ["sm:col-span-2", "sm:col-span-1"];
const LG_SPAN = ["lg:col-span-3", "lg:col-span-2", "lg:col-span-1"];
const XL_SPAN = ["xl:col-span-4", "xl:col-span-3", "xl:col-span-2", "xl:col-span-1"];

export default async function ExpertsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const experts = await listExperts();
  const n = experts.length;

  return (
    <>
      <PageIntro
        eyebrow={t("experts.eyebrow")}
        title={t("experts.title")}
        description={t("experts.subtitle")}
        aside={
          n ? (
            <div className="flex lg:justify-end">
              <span className="inline-flex h-10 items-center gap-2.5 rounded-full border border-border/80 bg-card pl-1.5 pr-4 text-sm font-medium text-foreground elev-1">
                <span className="grid size-7 place-items-center rounded-full bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100">
                  <Users className="size-3.5" />
                </span>
                {t("experts.count", { count: n })}
              </span>
            </div>
          ) : null
        }
      />

      <div className="container-fluid pb-20 sm:pb-24">
        {n ? (
          <Stagger className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {experts.map((e) => (
              <StaggerItem key={e.id} className="h-full">
                <ExpertCard
                  expert={e}
                  locale={locale}
                  labels={{
                    courses: t("experts.courses", { count: e.courseCount }),
                    students: t("experts.students", { count: e.enrolledCount }),
                    online: t("common.online"),
                    offline: t("common.offline"),
                    view: t("experts.viewProfile"),
                  }}
                />
              </StaggerItem>
            ))}
            {/* The directory ends in the way to become an expert, filling the
                last row rather than leaving it ragged — the same invitation
                the home page's experts section closes with. */}
            <StaggerItem
              className={cn("h-full", SM_SPAN[n % 2], LG_SPAN[n % 3], XL_SPAN[n % 4])}
            >
              <ExpertInviteCard
                title={t("home.becomeExpertTitle")}
                description={t("home.becomeExpertDesc")}
                cta={t("home.becomeExpertCta")}
              />
            </StaggerItem>
          </Stagger>
        ) : (
          <EmptyState
            title={t("experts.empty")}
            description={t("experts.emptyHint")}
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
    </>
  );
}

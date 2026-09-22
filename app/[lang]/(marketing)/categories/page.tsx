import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryServerApi } from "@/features/category/api.server";
import { categoryDescription } from "@/features/category/label";
import { toCategoryRef } from "@/features/category/style";
import type { Category } from "@/features/category/types";
import { CategoryIndexList, type CategoryIndexItem } from "@/features/category/components/CategoryIndex";
import { getCategoryIndex } from "@/features/course/catalog.server";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { PageIntro } from "@/components/common/PageIntro";
import { buttonVariants } from "@/components/ui/button";
import { LinkGo } from "@/components/ui/link-go";
import { formatNumber } from "@/lib/utils/format";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

// Rendered per request. The page-level window dominates the fetch cache, so
// caching it for ten minutes kept newly added categories off the site for that
// long however fresh the data underneath was. Per request the API sees one
// small, uncached category query (see categoryServerApi.list); the category
// index behind the counts (getCategoryIndex: one course list per active
// category, more pages only past 100 courses) is served from the data cache
// and refetched at most once a minute, not per request.
export const revalidate = 0;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return {
    title: t("categoriesPage.metaTitle"),
    description: t("categoriesPage.metaDescription"),
  };
}

export default async function CategoriesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const categories = await categoryServerApi.list().catch((): Category[] => []);
  const active = categories.filter((c) => c.active);
  // Added, read-only (60 s): each category's published courses, for the
  // counts, the newest course line and the rule that an empty category is
  // never offered as a link (D6).
  const index = active.length ? await getCategoryIndex(active).catch(() => null) : null;

  // Every active category; without the index the rows still render, with no
  // count (unknown, not zero), so a failed walk never hides a category.
  const entries: CategoryIndexItem[] = (index?.entries ?? active.map((category) => ({ category, count: null, latest: null })))
    .map((e) => ({
      ref: toCategoryRef(e.category, t, locale),
      count: e.count,
      description: categoryDescription(e.category, locale),
      latestTitle: e.latest?.title ?? null,
    }));
  const populated = entries.filter((e) => e.count === null || e.count > 0).length;

  const breadcrumbs = (
    <Breadcrumbs
      items={[{ label: t("common.home"), href: localeHref(locale, "/") }, { label: t("categoriesPage.title") }]}
    />
  );

  return (
    <>
      <PageIntro
        breadcrumbs={breadcrumbs}
        eyebrow={t("categoriesPage.kicker")}
        title={t("categoriesPage.title")}
        count={populated ? formatNumber(populated, locale) : undefined}
        description={t("categoriesPage.lead")}
        aside={
          populated ? (
            <div className="flex lg:justify-end">
              <LinkGo href={localeHref(locale, "/courses")}>{t("ui.allCourses")}</LinkGo>
            </div>
          ) : null
        }
      />

      <section className="wrap pt-12 pb-24 lg:pt-16 lg:pb-32" aria-label={t("ui.fields")}>
        {active.length === 0 ? (
          <EmptyState
            plate={t("categoriesPage.emptyPlate")}
            title={t("categoriesPage.empty")}
            description={t("categoriesPage.emptyHint")}
            headingLevel="h2"
            action={
              <Link href={localeHref(locale, "/categories")} className={buttonVariants({ variant: "outline" })}>
                {t("common.retry")}
              </Link>
            }
          />
        ) : (
          <>
            <CategoryIndexList
              entries={entries}
              locale={locale}
              numbered
              hrefFor={(ref) => localeHref(locale, `/courses?categoryId=${ref.id}`)}
            />
            <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-line-strong pt-6 lg:mt-20">
              <LinkGo href={localeHref(locale, "/courses")}>{t("ui.allCourses")}</LinkGo>
              <p className="t-small flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-2">
                <span>{t("categoriesPage.applyLine")}</span>
                <LinkGo href={localeHref(locale, "/register/tutor")}>{t("categoriesPage.apply")}</LinkGo>
              </p>
            </div>
          </>
        )}
      </section>
    </>
  );
}

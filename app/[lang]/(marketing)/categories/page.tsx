import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { categoryServerApi } from "@/features/category/api.server";
import { CategoryGrid } from "@/features/category/components/CategoryGrid";
import { categoryDescription, categoryLabel } from "@/features/category/label";
import { EmptyState } from "@/components/common/EmptyState";
import { PageIntro } from "@/components/common/PageIntro";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

// Rendered per request. The page-level window dominates the fetch cache, so
// caching it for ten minutes kept newly added categories off the site for that
// long however fresh the data underneath was. The only work per request is one
// small category query — see categoryServerApi.list.
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

  const categories = await categoryServerApi.list().catch(() => []);
  const active = categories.filter((c) => c.active);

  return (
    <>
      <PageIntro
        eyebrow={t("nav.categories")}
        title={t("categoriesPage.title")}
        description={t("categoriesPage.subtitle")}
        aside={
          active.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {/* A plain count, not a control: no border, no fill, so the link
                  beside it is the only thing that reads as clickable. */}
              <span className="inline-flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
                <LayoutGrid aria-hidden className="size-4" />
                {t("categoriesPage.count", { count: active.length })}
              </span>
              <Link
                href={localeHref(locale, "/courses")}
                className={buttonVariants({ variant: "soft", className: "group" })}
              >
                {t("home.browseCourses")}
                <ArrowRight
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          ) : null
        }
      />

      <div className="container-fluid pb-20">
        {active.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid strokeWidth={1.75} />}
            title={t("categoriesPage.empty")}
            description={t("categoriesPage.emptyHint")}
          />
        ) : (
          <CategoryGrid
            categories={active}
            exploreLabel={t("categoriesPage.explore")}
            labelFor={(c) => categoryLabel(c, t, locale)}
            descriptionFor={(c) => categoryDescription(c, locale)}
            hrefFor={(c) => localeHref(locale, `/courses?categoryId=${c.id}`)}
          />
        )}
      </div>
    </>
  );
}

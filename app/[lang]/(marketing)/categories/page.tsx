import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryServerApi } from "@/features/category/api.server";
import { CategoryGrid } from "@/features/category/components/CategoryGrid";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionHeading } from "@/components/common/SectionHeading";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse course categories on EduPlatform.",
};

type Props = { params: Promise<{ lang: string }> };

export default async function CategoriesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const categories = await categoryServerApi.list().catch(() => []);
  const active = categories.filter((c) => c.active);

  return (
    <div className="container-fluid space-y-8 py-12">
      <SectionHeading
        eyebrow={t("nav.categories")}
        title={t("categoriesPage.title")}
        description={t("categoriesPage.subtitle")}
      />

      {active.length === 0 ? (
        <EmptyState
          title={t("categoriesPage.empty")}
          description={t("categoriesPage.emptyHint")}
        />
      ) : (
        <CategoryGrid
          categories={active}
          exploreLabel={t("home.exploreCategory")}
          hrefFor={(c) => localeHref(locale, `/courses?categoryId=${c.id}`)}
        />
      )}
    </div>
  );
}

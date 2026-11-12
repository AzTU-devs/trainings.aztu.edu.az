import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogIndex } from "@/features/course/catalog-index.server";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { CategoryGrid, type CategoryItem } from "@/features/category/components/CategoryTiles";
import { PageHeader } from "@/components/layout/PageHeader";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";

// Never cached as a page: a category added in the dashboard has to appear at
// once. The category list itself is fetched uncached (see api.server.ts).
export const revalidate = 0;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const t = await getT(isLocale(lang) ? lang : "az");
  return { title: t("categoriesPage2.title"), description: t("categoriesPage2.sub") };
}

export default async function CategoriesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);
  const index = await getCatalogIndex();

  const items: CategoryItem[] = index.categories
    .map((c) => {
      const count = index.countByCategory[c.id] ?? 0;
      const descKey = `categoryDesc.${c.slug}`;
      const desc = t(descKey);
      return {
        id: c.id,
        name: categoryLabel(c, t, locale),
        description: desc !== descKey ? desc : null,
        count,
        countLabel: t("ui.courseCount", { count }),
        style: categoryStyle(c),
        href: `/courses?categoryId=${c.id}`,
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <PageHeader
        id="cats-h1"
        title={t("categoriesPage2.title")}
        lead={t("categoriesPage2.sub")}
        crumbs={[{ label: t("ui.home"), href: "/" }, { label: t("ui.navCategories") }]}
        crumbsLabel={t("ui.breadcrumb")}
      />
      <section className="wrap pb-16 pt-2 lg:pb-24" aria-label={t("categoriesPage2.title")}>
        {items.length ? (
          <CategoryGrid items={items} emptyLabel={t("ui.noCoursesYet")} showDescription heading="h2" />
        ) : (
          <div className="soft-empty">
            <p className="font-semibold">{t("categoriesPage2.empty")}</p>
          </div>
        )}
      </section>
    </>
  );
}

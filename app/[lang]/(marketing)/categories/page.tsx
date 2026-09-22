import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogIndex } from "@/features/course/catalog-index.server";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { CategoryTile, type CategoryItem } from "@/features/category/components/CategoryTiles";
import { LocaleLink } from "@/i18n/LocaleLink";
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
      <section className="relative isolate overflow-x-clip" aria-labelledby="cats-h1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
          <div className="absolute -top-72 right-[-8%] size-[760px] rounded-full bg-[radial-gradient(closest-side,var(--gold-tint),transparent)]" />
        </div>
        <div className="wrap pt-8 lg:pt-14">
          <nav aria-label={t("ui.breadcrumb")} className="flex items-center gap-2 text-[13.5px] text-ink-3">
            <LocaleLink href="/" className="hover:text-ink">
              {t("ui.home")}
            </LocaleLink>
            <span aria-hidden>/</span>
            <span className="text-ink-2" aria-current="page">
              {t("ui.navCategories")}
            </span>
          </nav>
          <div className="mt-4 grid items-end gap-x-8 gap-y-6 lg:grid-cols-12">
            <h1 id="cats-h1" className="d-lg lg:col-span-7">
              {t("categoriesPage2.title")}
            </h1>
            <p className="lead lg:col-span-5 lg:pb-1.5">{t("categoriesPage2.sub")}</p>
          </div>
        </div>
      </section>
      <section className="wrap pb-20 pt-12 lg:pb-28 lg:pt-16" aria-label={t("categoriesPage2.title")}>
        {items.length ? (
          <div className="grid grid-cols-2 gap-3 lg:auto-rows-[232px] lg:grid-cols-12 lg:gap-4">
            {items.map((item, i) => (
              <CategoryTile
                key={item.id}
                item={item}
                size={i % 5 < 2 ? "wide" : "wide"}
                spanTwoOnPhone={i === items.length - 1 && items.length % 2 === 1}
              />
            ))}
          </div>
        ) : (
          <div className="soft-empty">
            <p className="font-semibold">{t("categoriesPage2.empty")}</p>
          </div>
        )}
      </section>
    </>
  );
}

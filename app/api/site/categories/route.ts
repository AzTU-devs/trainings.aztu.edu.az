import { NextResponse } from "next/server";
import { getCatalogIndex } from "@/features/course/catalog-index.server";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getT } from "@/i18n/server";

/**
 * The categories menu in the header: every active subject area with its name
 * in the page's language, its colour family and its course count.
 *
 * The header is a client component on every page, so it asks here once it is
 * opened instead of making every layout fetch the catalogue index. The index
 * itself is cached (see catalog-index.server.ts); this response may be too,
 * briefly, since a count that is a minute old is harmless.
 */
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang");
  const locale: Locale = lang && isLocale(lang) ? lang : defaultLocale;
  const [t, index] = await Promise.all([getT(locale), getCatalogIndex()]);

  const items = index.categories.map((c) => {
    const count = index.countByCategory[c.id] ?? 0;
    return {
      id: c.id,
      name: categoryLabel(c, t, locale),
      count,
      countLabel: count > 0 ? t("ui.courseCount", { count }) : t("ui.noCoursesYet"),
      ...categoryStyle(c),
    };
  });

  return NextResponse.json(
    { items, total: index.total },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
  );
}

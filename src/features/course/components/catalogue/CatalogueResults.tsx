import Link from "next/link";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import type { Page } from "@/types/api";
import { formatNumber } from "@/lib/utils/format";
import type { CategoryRef } from "@/features/category/style";
import { EmptyState } from "@/components/common/EmptyState";
import { Kicker } from "@/components/editorial/Kicker";
import { Note } from "@/components/editorial/Note";
import { buttonVariants } from "@/components/ui/button";
import { CategoryChip } from "@/components/ui/chip";
import { FeatureCourse } from "../FeatureCourse";
import { IndexList, IndexRow } from "../IndexRow";
import { PosterGrid } from "../PosterCard";
import type { CourseSummary } from "../../types";
import { Pager } from "./Pager";
import s from "./catalogue.module.css";

export type ResultItem = { course: CourseSummary; category: CategoryRef | null };

/**
 * The result block: the live count (announced politely when filters change),
 * then — by how many courses matched — the empty state with the fields that
 * do have courses, a single cover story, the index list, or the poster grid;
 * and the pager. A page number past the last page (an old or hand-edited
 * link) is its own state: the results exist, just not on that page.
 */
export async function CatalogueResults({
  locale,
  data,
  items,
  view,
  now,
  q,
  hasFilters,
  sparse,
  catalogueTotal,
  expert,
  otherFields,
  params,
}: {
  locale: Locale;
  data: Page<CourseSummary>;
  /** data.content with each course's primary category. */
  items: ResultItem[];
  view: "grid" | "list";
  now: number;
  q?: string;
  /** A filter other than the search text is set (what "clear filters" would remove). */
  hasFilters: boolean;
  /** The whole catalogue is below the sparse threshold (adds the "N courses right now" note). */
  sparse: boolean;
  catalogueTotal: number | null;
  /** The one result's expert, when there is exactly one. */
  expert?: { name: string; title?: string | null; avatarUrl?: string | null } | null;
  /** Categories with courses, for the empty state's way out. */
  otherFields: { category: CategoryRef; count: string | undefined }[];
  params: Record<string, string | string[] | undefined>;
}) {
  const t = await getT(locale);
  const total = data.totalElements;
  const outOfRange = items.length === 0 && total > 0 && data.page >= data.totalPages;

  // The empty states' links keep the params `keep` accepts and set `page`
  // only when asked (a changed selection starts at the first page).
  const coursesHref = localeHref(locale, "/courses");
  const hrefKeeping = (keep: (key: string) => boolean, page?: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page" || !v || !keep(k)) continue;
      u.set(k, String(v));
    }
    if (page) u.set("page", String(page));
    const qs = u.toString();
    return qs ? `${coursesHref}?${qs}` : coursesHref;
  };

  const head = (
    <div className="mb-6 flex items-baseline justify-between gap-4 lg:mb-8">
      <h2 id="catalogue-results-h" className="t-kicker text-ink-2" aria-live="polite">
        {total > 0 ? t("ui.courseCount", { n: formatNumber(total, locale), count: total }) : t("courses.noResults")}
      </h2>
      {data.totalPages > 1 && data.page < data.totalPages ? (
        <span className="t-kicker text-ink-3">
          {t("courses.pageOf", { page: data.page + 1, total: data.totalPages })}
        </span>
      ) : null}
    </div>
  );

  if (outOfRange) {
    const last = data.totalPages - 1;
    return (
      <>
        {head}
        <EmptyState
          plate={t("courses.emptyPlate")}
          title={t("courses.outOfRangeTitle")}
          description={t("courses.outOfRangeHint", { total: data.totalPages })}
          className="py-6 lg:py-10"
          action={
            <>
              {last > 0 ? (
                <Link href={hrefKeeping(() => true, last)} className={buttonVariants()}>
                  {t("courses.lastPage")}
                </Link>
              ) : null}
              <Link
                href={hrefKeeping(() => true)}
                className={buttonVariants(last > 0 ? { variant: "outline" } : undefined)}
              >
                {t("courses.firstPage")}
              </Link>
            </>
          }
        />
      </>
    );
  }

  if (items.length === 0) {
    // What the main action removes: the filters when there are any (keeping
    // the search text and the view, as the toolbar's "clear" does), else the
    // search itself. With neither, the whole catalogue is empty and there is
    // nothing to clear.
    const clear = hasFilters
      ? { href: hrefKeeping((k) => k === "q" || k === "view"), label: t("common.clearFilters") }
      : q
        ? { href: hrefKeeping((k) => k !== "q"), label: t("courses.clearSearch") }
        : null;
    return (
      <>
        {head}
        <EmptyState
          plate={t("courses.emptyPlate")}
          title={
            q ? t("courses.emptyQuery", { q }) : hasFilters ? t("courses.emptyFilters") : t("courses.emptyCatalogue")
          }
          description={
            hasFilters
              ? t("courses.emptyAdvice")
              : q
                ? t("courses.emptySearchAdvice")
                : t("courses.emptyCatalogueHint")
          }
          className="py-6 lg:py-10"
          action={
            <>
              {clear ? (
                <Link href={clear.href} className={buttonVariants()}>
                  {clear.label}
                </Link>
              ) : null}
              <Link href={localeHref(locale, "/")} className={buttonVariants(clear ? { variant: "outline" } : undefined)}>
                {t("courses.backHome")}
              </Link>
              {/* The way out, in the same column: the fields that do have courses.
                  Full width, so it starts its own line under the buttons. */}
              {otherFields.length ? (
                <div className="mt-7 w-full">
                  <Kicker className="mb-3">{t("courses.emptyFields")}</Kicker>
                  <div className="flex flex-wrap gap-2">
                    {otherFields.map(({ category, count }) => (
                      <CategoryChip
                        key={category.id}
                        href={localeHref(locale, `/courses?categoryId=${category.id}`)}
                        category={category}
                        label={category.name}
                        count={count}
                        className="max-w-full"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          }
        />
      </>
    );
  }

  if (total === 1 && items.length === 1) {
    const { course, category } = items[0];
    return (
      <>
        {head}
        <article className="border-t border-line-strong pt-8">
          <FeatureCourse
            course={course}
            category={category}
            expert={expert}
            locale={locale}
            now={now}
            layout="spread"
            headingLevel="h3"
            priority
            cta={{ href: localeHref(locale, `/courses/${course.slug}`), label: t("ui.viewCourse") }}
          />
        </article>
        {sparse && catalogueTotal !== null ? (
          <Note className="mt-14 max-w-[62ch]">
            {t("courses.sparseNote", { n: formatNumber(catalogueTotal, locale), count: catalogueTotal })}
          </Note>
        ) : null}
      </>
    );
  }

  const offset = data.page * data.size;
  return (
    <>
      {head}
      {view === "list" ? (
        <IndexList locale={locale} head peek id="catalogue-index" className={s.index}>
          {items.map(({ course, category }, i) => (
            <IndexRow key={course.id} course={course} category={category} locale={locale} number={offset + i + 1} />
          ))}
        </IndexList>
      ) : (
        // The first row (3 columns, or 2) sits at the fold: its covers load eagerly.
        <PosterGrid items={items} locale={locale} now={now} cols={total === 2 ? 2 : 3} eager={total === 2 ? 2 : 3} />
      )}
      <Pager locale={locale} page={data.page} totalPages={data.totalPages} params={params} className="mt-16 lg:mt-20" />
    </>
  );
}

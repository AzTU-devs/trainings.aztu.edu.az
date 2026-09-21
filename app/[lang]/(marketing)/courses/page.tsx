import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, CloudOff, Search, SearchX } from "lucide-react";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { categoryLabel } from "@/features/category/label";
import { CourseGrid } from "@/features/course/components/CourseGrid";
import { FilterSidebar } from "@/features/course/components/FilterSidebar";
import { EmptyState } from "@/components/common/EmptyState";
import { PageIntro } from "@/components/common/PageIntro";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { parseFiltersFromSearchParams } from "@/features/course/filters";

type SP = Promise<Record<string, string | undefined>>;
type Props = { params: Promise<{ lang: string }>; searchParams: SP };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("courses.metaTitle"), description: t("courses.metaDescription") };
}

export default async function CoursesPage({ params, searchParams }: Props) {
  const [{ lang }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // The catalogue is one request: `GET /api/public/courses` applies the free
  // text and every filter together, so a filtered page 2 is as correct as page 1
  // and searching no longer costs the visitor their filters.
  const query = parseFiltersFromSearchParams(raw);
  const q = query.q;

  const [categories, data] = await Promise.all([
    categoryServerApi.list().catch(() => []),
    courseServerApi.list(query).catch(() => null),
  ]);

  // The catalogue can fail to load; when it does the page still keeps its
  // header and its search field, so the visitor has somewhere to go rather than
  // an unbranded error card floating on an empty page.
  if (!data) {
    return (
      <>
        <CatalogueHeader
          locale={locale}
          eyebrow={t("courses.eyebrow")}
          title={t("courses.title")}
          subtitle={t("courses.loadErrorHint")}
          searchLabel={t("common.search")}
          q={q}
          params={raw}
        />
        <div className="container-fluid pb-20">
          <EmptyState
            icon={<CloudOff strokeWidth={1.75} />}
            title={t("courses.loadError")}
            action={
              <Link
                href={localeHref(locale, "/courses")}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("common.retry")}
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <CatalogueHeader
        locale={locale}
        eyebrow={t("courses.eyebrow")}
        title={q ? `“${q}”` : t("courses.title")}
        subtitle={q ? t("courses.searchSubtitle") : t("courses.subtitle")}
        searchLabel={t("common.search")}
        q={q}
        params={raw}
      />

      {/* `grid-cols-1` rather than the implicit auto column: the filter panel's
          category row scrolls sideways on a phone, and an auto column would
          grow to that row's full width instead of letting it scroll. */}
      <div className="container-fluid grid grid-cols-1 gap-5 pb-20 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-8">
        <FilterSidebar
          total={data.totalElements}
          categories={categories
            .filter((c) => c.active)
            .map((c) => ({ id: c.id, name: categoryLabel(c, t, locale) }))}
        />

        <div className="min-w-0 space-y-5">
          {/* The mobile filter bar already carries the count; this row is its
              wide-screen counterpart, beside the grid it describes. */}
          <div className="hidden min-h-10 items-center justify-between gap-4 lg:flex">
            <p className="text-sm font-medium text-muted-foreground">
              {t("courses.results", { count: data.totalElements })}
            </p>
            {data.totalPages > 1 ? (
              <p className="text-sm text-muted-foreground">
                {t("courses.pageOf", { page: data.page + 1, total: data.totalPages })}
              </p>
            ) : null}
          </div>

          {data.content.length === 0 ? (
            <EmptyState
              icon={<SearchX strokeWidth={1.75} />}
              title={t("courses.empty")}
              description={t("courses.emptyHint")}
              action={
                <Link
                  href={localeHref(locale, "/courses")}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("common.clearFilters")}
                </Link>
              }
            />
          ) : (
            <>
              <CourseGrid courses={data.content} />
              <Pagination
                locale={locale}
                page={data.page}
                totalPages={data.totalPages}
                params={raw}
                prevLabel={t("common.previous")}
                nextLabel={t("common.next")}
                pageOfLabel={t("courses.pageOf", {
                  page: data.page + 1,
                  total: data.totalPages,
                })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * The catalogue's opening: title, a line of context and the search pill. Shared
 * by the loaded and the failed state so the page never renders without its
 * title and search field.
 */
function CatalogueHeader({
  locale,
  eyebrow,
  title,
  subtitle,
  searchLabel,
  q,
  params,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  subtitle: string;
  searchLabel: string;
  q?: string;
  params: Record<string, string | undefined>;
}) {
  return (
    <PageIntro
      eyebrow={eyebrow}
      title={title}
      description={subtitle}
      aside={
        <form
          action={localeHref(locale, "/courses")}
          role="search"
          className="relative w-full lg:w-[26rem]"
        >
          <Search
            aria-hidden
            className="pointer-events-none absolute left-5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
          />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="h-14 rounded-full border-border/80 pl-12 pr-16 text-[15px] elev-1"
          />
          {/* Wrapped because the button's own `.sheen` sets position: relative,
              which would override `absolute` on the button itself. */}
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <Button type="submit" size="icon" aria-label={searchLabel}>
              <ArrowRight aria-hidden />
            </Button>
          </span>
          {/*
            A GET form replaces the query string wholesale, so the active filters
            ride along as hidden fields — searching narrows the current selection
            instead of silently clearing it. `page` is left out on purpose: a new
            search starts at the first page.
          */}
          {Object.entries(params).map(([key, value]) =>
            value && key !== "q" && key !== "page" ? (
              <input key={key} type="hidden" name={key} value={value} />
            ) : null,
          )}
        </form>
      }
    />
  );
}

function Pagination({
  locale,
  page,
  totalPages,
  params,
  prevLabel,
  nextLabel,
  pageOfLabel,
}: {
  locale: Locale;
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
  prevLabel: string;
  nextLabel: string;
  pageOfLabel: string;
}) {
  if (totalPages <= 1) return null;
  const make = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page") continue;
      if (v) u.set(k, v);
    }
    u.set("page", String(p));
    return localeHref(locale, `/courses?${u.toString()}`);
  };
  const prev = Math.max(0, page - 1);
  const next = Math.min(totalPages - 1, page + 1);
  const pill =
    "inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-5 text-sm font-semibold elev-1 transition-[border-color,background-color,color] duration-200";
  return (
    <div className="flex items-center justify-center gap-2 pt-6 sm:gap-3">
      <Link
        href={make(prev)}
        aria-disabled={page === 0}
        className={cn(
          pill,
          page === 0
            ? "pointer-events-none opacity-40"
            : "hover:border-primary/40 hover:text-primary",
        )}
      >
        <ChevronLeft aria-hidden className="-ml-1 size-4" />
        {prevLabel}
      </Link>
      <span className="inline-flex h-11 items-center rounded-full bg-navy-50 px-4 text-sm font-semibold text-navy-700 dark:bg-navy-900/60 dark:text-navy-100">
        {pageOfLabel}
      </span>
      <Link
        href={make(next)}
        aria-disabled={page >= totalPages - 1}
        className={cn(
          pill,
          page >= totalPages - 1
            ? "pointer-events-none opacity-40"
            : "hover:border-primary/40 hover:text-primary",
        )}
      >
        {nextLabel}
        <ChevronRight aria-hidden className="-mr-1 size-4" />
      </Link>
    </div>
  );
}

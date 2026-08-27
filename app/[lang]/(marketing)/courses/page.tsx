import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { CourseGrid } from "@/features/course/components/CourseGrid";
import { FilterSidebar } from "@/features/course/components/FilterSidebar";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import {
  applyClientFilters,
  parseFiltersFromSearchParams,
} from "@/features/course/filters";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse every online and in-person course on the AzTU EduPlatform catalogue.",
};

type SP = Promise<Record<string, string | undefined>>;
type Props = { params: Promise<{ lang: string }>; searchParams: SP };

export default async function CoursesPage({ params, searchParams }: Props) {
  const [{ lang }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const { type, categoryId, q, page, size, client } =
    parseFiltersFromSearchParams(raw);

  const searching = Boolean(q);

  const [categories, data] = await Promise.all([
    categoryServerApi.list().catch(() => []),
    (async () => {
      try {
        // The backend /courses/search endpoint only accepts `q`, `page`, `size`
        // (see endpoints.public.coursesSearch + courseServerApi.search) — it does
        // NOT support `type`/`categoryId`. So while searching we post-filter by
        // `type` client-side and hide the Category filter (needs a server filter).
        return searching
          ? await courseServerApi.search(q!, page, size)
          : await courseServerApi.list({ type, categoryId, page, size });
      } catch {
        return null;
      }
    })(),
  ]);

  // The catalogue can fail to load; when it does the page still keeps its
  // header and its search field, so the visitor has somewhere to go rather than
  // an unbranded error card floating on an empty page.
  if (!data) {
    return (
      <>
        <CatalogueHeader
          locale={locale}
          title={t("courses.title")}
          subtitle={t("courses.loadError")}
          searchLabel={t("common.search")}
          q={q}
        />
        <div className="container-fluid py-16">
          <EmptyState
            title={t("courses.loadError")}
            description={t("courses.loadErrorHint")}
            action={
              <Link href={localeHref(locale, "/courses")}>
                <Button variant="outline">{t("common.retry")}</Button>
              </Link>
            }
          />
        </div>
      </>
    );
  }

  // While searching the backend can't apply the `type` filter, so post-filter
  // the search results here to honor the selected mode.
  const typeFiltered =
    searching && type
      ? data.content.filter((c) => c.courseType === type)
      : data.content;
  const filtered = applyClientFilters(typeFiltered, client);

  return (
    <>
      <CatalogueHeader
        locale={locale}
        title={q ? `“${q}”` : t("courses.title")}
        subtitle={t("courses.results", { count: data.totalElements })}
        searchLabel={t("common.search")}
        q={q}
      />

      <div className="container-fluid grid gap-10 py-12 lg:grid-cols-[260px_1fr]">
        <FilterSidebar
          total={data.totalElements}
          visible={filtered.length}
          // Category needs a server-side filter the search endpoint doesn't support,
          // so hide it while searching rather than showing an inactive control.
          searching={searching}
          categories={categories
            .filter((c) => c.active)
            .map((c) => ({ id: c.id, name: c.name }))}
        />

        <div className="space-y-6">
          {filtered.length === 0 ? (
            <EmptyState
              title={t("courses.empty")}
              description={t("courses.emptyHint")}
              action={
                <Link href={localeHref(locale, "/courses")}>
                  <Button variant="outline">{t("common.clearFilters")}</Button>
                </Link>
              }
            />
          ) : (
            <>
              <CourseGrid courses={filtered} />
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
 * The catalogue's own header band. Shared by the loaded and the failed state so
 * the page never renders without its title and search field.
 */
function CatalogueHeader({
  locale,
  title,
  subtitle,
  searchLabel,
  q,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  searchLabel: string;
  q?: string;
}) {
  return (
    <section className="surface-tint relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-lines-soft fade-edges"
      />
      <div className="container-fluid relative flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-tight">{title}</h1>
          <p className="mt-2.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <form
          action={localeHref(locale, "/courses")}
          className="relative w-full sm:max-w-sm"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="rounded-full bg-background pl-10"
          />
        </form>
      </div>
    </section>
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
  return (
    <div className="flex items-center justify-center gap-3 pt-6">
      <Link
        href={make(prev)}
        aria-disabled={page === 0}
        className={
          "rounded-full border border-border px-4 py-2 text-sm transition-colors " +
          (page === 0
            ? "pointer-events-none opacity-40"
            : "hover:border-primary/40 hover:bg-accent")
        }
      >
        {prevLabel}
      </Link>
      <span className="text-sm text-muted-foreground">{pageOfLabel}</span>
      <Link
        href={make(next)}
        aria-disabled={page >= totalPages - 1}
        className={
          "rounded-full border border-border px-4 py-2 text-sm transition-colors " +
          (page >= totalPages - 1
            ? "pointer-events-none opacity-40"
            : "hover:border-primary/40 hover:bg-accent")
        }
      >
        {nextLabel}
      </Link>
    </div>
  );
}

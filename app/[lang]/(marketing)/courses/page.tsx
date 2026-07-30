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
  description: "Browse all online and offline courses on EduPlatform.",
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

  if (!data) {
    return (
      <div className="container-fluid py-12">
        <EmptyState
          title={t("courses.loadError")}
          description={t("courses.loadErrorHint")}
        />
      </div>
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
    <div className="container-fluid grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {q ? `“${q}”` : t("courses.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("courses.results", { count: data.totalElements })}
            </p>
          </div>
          <form
            action={localeHref(locale, "/courses")}
            className="relative w-full max-w-sm"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder={t("common.search")}
              className="h-10 rounded-full bg-muted/40 pl-10"
            />
          </form>
        </div>

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
    <div className="flex items-center justify-center gap-2 pt-4">
      <Link
        href={make(prev)}
        aria-disabled={page === 0}
        className={
          "rounded-md border px-3 py-1.5 text-sm " +
          (page === 0 ? "pointer-events-none opacity-50" : "hover:bg-accent")
        }
      >
        {prevLabel}
      </Link>
      <span className="text-sm text-muted-foreground">{pageOfLabel}</span>
      <Link
        href={make(next)}
        aria-disabled={page >= totalPages - 1}
        className={
          "rounded-md border px-3 py-1.5 text-sm " +
          (page >= totalPages - 1
            ? "pointer-events-none opacity-50"
            : "hover:bg-accent")
        }
      >
        {nextLabel}
      </Link>
    </div>
  );
}

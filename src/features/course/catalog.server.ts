import "server-only";
import { cache } from "react";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { Category } from "@/features/category/types";
import { primaryCategoryId } from "@/features/category/style";
import { courseServerApi } from "./api.server";
import type { CourseSummary } from "./types";

/**
 * Read-only catalogue walks the redesign needs (IMPLEMENTATION D11, D12). Both
 * reuse cached fetches; neither lowers a route's ISR period, because callers
 * on 300 s routes pass `revalidate: 300`.
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 10; // 1,000 courses: past that the counts are hidden (complete = false).

/**
 * Every published course, up to the page cap. The params are the same, in the
 * same key order, as the expert directory's walk (directory.server.ts), so
 * Next dedupes the fetches and they share the 60 s cache entries.
 */
export const allPublishedCourses = cache(
  async (): Promise<{ courses: CourseSummary[]; total: number; complete: boolean }> => {
    const first = await courseServerApi.list({ page: 0, size: PAGE_SIZE });
    const courses = [...first.content];
    const pages = Math.min(first.totalPages, MAX_PAGES);
    if (pages > 1) {
      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) => courseServerApi.list({ page: i + 1, size: PAGE_SIZE })),
      );
      for (const p of rest) courses.push(...p.content);
    }
    return { courses, total: first.totalElements, complete: courses.length === first.totalElements };
  },
);

/** One category's published courses (API order, newest first), following pages up to the cap. */
const categoryCourses = cache(
  async (categoryId: string, revalidate: number): Promise<{ total: number; courses: CourseSummary[] }> => {
    const get = (page: number) =>
      serverFetch<Page<CourseSummary>>(endpoints.public.courses, {
        searchParams: { categoryId, page, size: PAGE_SIZE },
        revalidate,
        tags: ["courses:list"],
      });
    const first = await get(0);
    const courses = [...first.content];
    const pages = Math.min(first.totalPages, MAX_PAGES);
    if (pages > 1) {
      const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => get(i + 1)));
      for (const p of rest) courses.push(...p.content);
    }
    return { total: first.totalElements, courses };
  },
);

export type CategoryIndexEntry = {
  category: Category;
  /** Published courses in the category; null when its fetch failed (unknown, still a link). */
  count: number | null;
  /**
   * The newest course whose primary category is this one (D11), else the
   * newest member, or null. A course in two categories therefore headlines
   * only the row it is coloured as, and neighbouring rows do not repeat it.
   */
  latest: CourseSummary | null;
  /** API order, newest first. */
  courses: CourseSummary[];
};

export type CategoryIndex = {
  /** Every active category, in sortOrder (ties by slug). */
  entries: CategoryIndexEntry[];
  /** courseId → the ids of the active categories it belongs to. */
  courseCats: Map<string, string[]>;
  /** D11: the course's primary category (lowest sortOrder, ties by slug), or null. */
  primaryOf(courseId: string): Category | null;
};

/**
 * The "category index": for every active category, its published courses.
 * It gives the per-category counts, the newest course per category, and —
 * because `CourseSummary` carries no category ids — the course → categories
 * map that colours every card honestly.
 */
export async function getCategoryIndex(
  categories: readonly Category[],
  opts: { revalidate?: 60 | 300 } = {},
): Promise<CategoryIndex> {
  const revalidate = opts.revalidate ?? 60;
  const active = categories
    .filter((c) => c.active !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  const results = await Promise.allSettled(active.map((c) => categoryCourses(c.id, revalidate)));

  const entries: CategoryIndexEntry[] = active.map((category, i) => {
    const r = results[i];
    if (r.status === "rejected") return { category, count: null, latest: null, courses: [] };
    // `latest` is settled below, once every course's primary category is known.
    return { category, count: r.value.total, latest: null, courses: r.value.courses };
  });

  const courseCats = new Map<string, string[]>();
  for (const e of entries) {
    for (const c of e.courses) {
      const ids = courseCats.get(c.id);
      if (ids) ids.push(e.category.id);
      else courseCats.set(c.id, [e.category.id]);
    }
  }

  const byId = new Map(active.map((c) => [c.id, c] as const));
  const primaryIdOf = (courseId: string) => primaryCategoryId(courseCats.get(courseId) ?? [], byId);

  // Courses are in API order (newest first), so the first match is the newest.
  for (const e of entries) {
    e.latest = e.courses.find((c) => primaryIdOf(c.id) === e.category.id) ?? e.courses[0] ?? null;
  }

  return {
    entries,
    courseCats,
    primaryOf(courseId: string) {
      const id = primaryIdOf(courseId);
      return id ? (byId.get(id) ?? null) : null;
    },
  };
}

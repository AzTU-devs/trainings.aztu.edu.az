"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { qk } from "@/lib/query/keys";
import type { Page } from "@/types/api";
import type { Category } from "@/features/category/types";
import type { CourseSummary } from "@/features/course/types";

/** The header's categories, fetched lazily as before (the same query and cache key). */
export function useHeaderCategories(enabled: boolean) {
  const query = useQuery({
    queryKey: qk.categories.all(),
    queryFn: () => request<Category[]>({ url: endpoints.public.categories, method: "GET" }),
    enabled,
    staleTime: 5 * 60_000,
  });
  const categories = (query.data ?? [])
    .filter((c) => c.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return { ...query, categories };
}

/** The most categories a header menu lists. */
export const MENU_CAP = 12;

/**
 * The categories a menu shows, at most MENU_CAP: those with courses (or whose
 * count is still unknown) first, in sortOrder, then the empty ones — so a
 * dashboard full of empty categories never pushes a real one out of the menu.
 */
export function menuOrder(categories: Category[], counts: Record<string, number | undefined>): Category[] {
  const open = categories.filter((c) => counts[c.id] !== 0);
  const empty = categories.filter((c) => counts[c.id] === 0);
  return [...open, ...empty].slice(0, MENU_CAP);
}

/**
 * Published-course counts per category for the mega menu and the mobile menu
 * (D10): one `GET /api/public/courses?categoryId=…&size=1` per category, read
 * for `totalElements`, only once a menu is open. Client-side on purpose: a
 * layout-level fetch would make every public route dynamic. The cost is known
 * and accepted: the first open in a visit sends one request per active
 * category (7 in production) besides the category list; later opens and
 * pages reuse the React Query cache for 5 minutes. The API has no per-category
 * count, and a course summary carries no category ids, so one catalogue
 * request cannot answer this.
 *
 * Returns id → count, or undefined while that count is loading or failed
 * (callers then show the name without a count and keep it a link).
 */
export function useCategoryCounts(categories: Category[], enabled: boolean): Record<string, number | undefined> {
  const results = useQueries({
    queries: categories.map((c) => {
      const params = { categoryId: c.id, size: 1 };
      return {
        queryKey: qk.courses.list(params),
        queryFn: () =>
          request<Page<CourseSummary>>({ url: endpoints.public.courses, method: "GET", params }),
        enabled,
        staleTime: 5 * 60_000,
        select: (page: Page<CourseSummary>) => page.totalElements,
      };
    }),
  });
  const out: Record<string, number | undefined> = {};
  categories.forEach((c, i) => {
    out[c.id] = results[i]?.data;
  });
  return out;
}

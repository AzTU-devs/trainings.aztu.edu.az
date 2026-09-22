import "server-only";
import { cache } from "react";
import { categoryServerApi } from "@/features/category/api.server";
import type { Category } from "@/features/category/types";
import { SHOWCASE } from "@/features/showcase/flag";
import { mockIndex } from "@/features/showcase/source.server";
import { courseServerApi } from "./api.server";

/**
 * What the catalogue's colour and counts need but the course list does not
 * carry: which category each course belongs to, how many courses each
 * category and each format has, and the total.
 *
 * Course list items have no category field, so this asks the catalogue once
 * per category (the same cached `GET /api/public/courses` the catalogue page
 * uses, filtered by `categoryId`). With a handful of categories that is a
 * handful of cached requests; `cache()` makes every component on one page share
 * a single index.
 *
 * Only active top-level categories count: they are what the site shows as
 * subject areas. A course in several of them is coloured by the first, in the
 * dashboard's sort order.
 */
export type CatalogIndex = {
  categories: Category[];
  countByCategory: Record<string, number>;
  categoryOfCourse: Record<string, string>;
  /** An expert's main subject area: the first category one of their courses is in. */
  categoryOfExpert: Record<string, string>;
  total: number;
  online: number;
  offline: number;
};

const EMPTY: CatalogIndex = {
  categories: [],
  countByCategory: {},
  categoryOfCourse: {},
  categoryOfExpert: {},
  total: 0,
  online: 0,
  offline: 0,
};

/** Largest page the API serves; a category past this is counted, not mapped. */
const PAGE = 100;

export const getCatalogIndex = cache(async (): Promise<CatalogIndex> => {
  if (SHOWCASE) return mockIndex();
  const all = await categoryServerApi.list().catch(() => null);
  if (!all) return EMPTY;
  const categories = all
    .filter((c) => c.active && !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const [perCategory, total, online, offline] = await Promise.all([
    Promise.all(
      categories.map((c) =>
        courseServerApi.list({ categoryId: c.id, page: 0, size: PAGE }).catch(() => null),
      ),
    ),
    courseServerApi.list({ page: 0, size: 1 }).catch(() => null),
    courseServerApi.list({ type: "ONLINE", page: 0, size: 1 }).catch(() => null),
    courseServerApi.list({ type: "OFFLINE", page: 0, size: 1 }).catch(() => null),
  ]);

  const countByCategory: Record<string, number> = {};
  const categoryOfCourse: Record<string, string> = {};
  const categoryOfExpert: Record<string, string> = {};
  categories.forEach((c, i) => {
    const page = perCategory[i];
    countByCategory[c.id] = page?.totalElements ?? 0;
    for (const course of page?.content ?? []) {
      categoryOfCourse[course.id] ??= c.id;
      if (course.tutorId) categoryOfExpert[course.tutorId] ??= c.id;
    }
  });

  return {
    categories,
    countByCategory,
    categoryOfCourse,
    categoryOfExpert,
    total: total?.totalElements ?? 0,
    online: online?.totalElements ?? 0,
    offline: offline?.totalElements ?? 0,
  };
});

/** The category a course is shown under, or null when it has none. */
export function categoryOf(index: CatalogIndex, courseId: string): Category | null {
  const id = index.categoryOfCourse[courseId];
  return id ? index.categories.find((c) => c.id === id) ?? null : null;
}

/** The category an expert is shown under (their colour), or null. */
export function categoryOfExpert(index: CatalogIndex, expertId: string): Category | null {
  const id = index.categoryOfExpert[expertId];
  return id ? index.categories.find((c) => c.id === id) ?? null : null;
}

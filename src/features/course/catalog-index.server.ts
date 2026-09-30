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
  oneTime: number;
};

const EMPTY: CatalogIndex = {
  categories: [],
  countByCategory: {},
  categoryOfCourse: {},
  categoryOfExpert: {},
  total: 0,
  online: 0,
  offline: 0,
  oneTime: 0,
};

/** Largest page the API serves; a category past this is counted, not mapped. */
const PAGE = 100;

/**
 * The platform's own index, whatever the catalogue pages show. Experts are
 * real while the catalogue can still be sample content (see
 * src/features/showcase/flag.ts), and a real expert's categories and courses
 * only mean something against the real categories.
 */
export const getRealCatalogIndex = cache(async (): Promise<CatalogIndex> => {
  const all = await categoryServerApi.list().catch(() => null);
  if (!all) return EMPTY;
  const categories = all
    .filter((c) => c.active && !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  // An API without ONE_TIME answers `type=ONE_TIME` with a 400, which counts as
  // none — the right figure for it.
  const [perCategory, total, online, offline, oneTime] = await Promise.all([
    Promise.all(
      categories.map((c) =>
        courseServerApi.list({ categoryId: c.id, page: 0, size: PAGE }).catch(() => null),
      ),
    ),
    courseServerApi.list({ page: 0, size: 1 }).catch(() => null),
    courseServerApi.list({ type: "ONLINE", page: 0, size: 1 }).catch(() => null),
    courseServerApi.list({ type: "OFFLINE", page: 0, size: 1 }).catch(() => null),
    courseServerApi.list({ type: "ONE_TIME", page: 0, size: 1 }).catch(() => null),
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
    oneTime: oneTime?.totalElements ?? 0,
  };
});

/** The index the catalogue pages use: the sample one while SHOWCASE is on. */
export const getCatalogIndex = cache(
  async (): Promise<CatalogIndex> => (SHOWCASE ? mockIndex() : getRealCatalogIndex()),
);

/**
 * The index that matches a piece of content: the catalogue's for sample
 * content, the platform's own for anything real — a real expert, or a real
 * course reached by its link while the catalogue shows samples.
 */
export function indexFor(sample: boolean): Promise<CatalogIndex> {
  return sample ? getCatalogIndex() : getRealCatalogIndex();
}

/** The category a course is shown under, or null when it has none. */
export function categoryOf(index: CatalogIndex, courseId: string): Category | null {
  const id = index.categoryOfCourse[courseId];
  return id ? index.categories.find((c) => c.id === id) ?? null : null;
}

type ExpertRef = { id: string; expertiseCategoryIds?: readonly string[] | null };

/**
 * An expert's areas of expertise that are catalogue categories, in the
 * catalogue's order. Ids of inactive or sub-categories drop out, as they do
 * everywhere the site lists subject areas.
 */
export function categoriesOfExpert(index: CatalogIndex, expert: ExpertRef): Category[] {
  const ids = expert.expertiseCategoryIds ?? [];
  return ids.length ? index.categories.filter((c) => ids.includes(c.id)) : [];
}

/**
 * The category an expert is shown under (their colour and label): the first
 * area of expertise they picked, else the first category one of their courses
 * is in. Null when neither is known — an expert who only named areas of their
 * own is drawn in the brand navy.
 */
export function categoryOfExpert(index: CatalogIndex, expert: ExpertRef): Category | null {
  const picked = categoriesOfExpert(index, expert)[0];
  if (picked) return picked;
  const id = index.categoryOfExpert[expert.id];
  return id ? index.categories.find((c) => c.id === id) ?? null : null;
}

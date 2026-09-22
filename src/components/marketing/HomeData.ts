import "server-only";
import { cache } from "react";
import type { Page } from "@/types/api";
import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/format";
import { categoryServerApi } from "@/features/category/api.server";
import type { Category } from "@/features/category/types";
import { toCategoryRef, type CategoryRef } from "@/features/category/style";
import { courseServerApi } from "@/features/course/api.server";
import { allPublishedCourses, getCategoryIndex, type CategoryIndex } from "@/features/course/catalog.server";
import { catalogueStats, type CatalogueStats } from "@/features/course/catalog";
import type { CourseSummary } from "@/features/course/types";
import { expertServerApi } from "@/features/expert/api.server";
import { listExperts } from "@/features/expert/directory.server";
import type { ExpertProfile, ExpertSummary } from "@/features/expert/types";

/**
 * The cover story and "Son əlavələr" read the newest page of the catalogue.
 * The same parameters as before the redesign, so the request (and its 60 s
 * cache entry) is unchanged.
 */
export const FEATURED_QUERY = { size: 7 } as const;

type AllPublished = Awaited<ReturnType<typeof allPublishedCourses>>;

export type HomeData = {
  /** Fresh on every request, as the home page has always read it (never cached). */
  categories: Promise<Category[]>;
  /** The newest seven courses (API order = published_at desc), or null on failure. */
  latest: Promise<Page<CourseSummary> | null>;
  /** Every published course (shares its cache entries with listExperts), or null. */
  all: Promise<AllPublished | null>;
  /** Per-category counts, newest course, course → categories (60 s), or null. */
  index: Promise<CategoryIndex | null>;
  /** Every expert with a published course; [] on failure (listExperts' own rule). */
  experts: Promise<ExpertSummary[]>;
};

/**
 * Starts every read the landing page needs, once per request. Each section is
 * its own async component under <Suspense>, awaits only the promise it needs,
 * and so streams as soon as its data lands; the hero never waits. Every
 * promise settles to a value (failures become null or []), so an unawaited
 * one can never surface as an unhandled rejection.
 */
export const loadHome = cache((): HomeData => {
  const categories = categoryServerApi.list().catch((): Category[] => []);
  return {
    categories,
    latest: courseServerApi.list(FEATURED_QUERY).catch(() => null),
    all: allPublishedCourses().catch(() => null),
    index: categories.then((cats) => (cats.length ? getCategoryIndex(cats) : null)).catch(() => null),
    experts: listExperts().catch((): ExpertSummary[] => []),
  };
});

/**
 * The server's clock, read once per request (D17): every "Yeni" badge on the
 * page compares against the same instant, and no client component ever
 * computes it, so the badge cannot differ between the two renders.
 */
export const renderTime = cache((): number => Date.now());

/** Catalogue-wide numbers (format and level splits, freshness), or null when the walk failed. */
export const loadStats = cache(async (): Promise<(CatalogueStats & { complete: boolean; apiTotal: number }) | null> => {
  const all = await loadHome().all;
  if (!all) return null;
  return { ...catalogueStats(all.courses), complete: all.complete, apiTotal: all.total };
});

/**
 * One expert's public profile (300 s, the same cached request listExperts and
 * the profile page make, so Next dedupes it). Null when it fails: a
 * non-approved expert 404s.
 */
export const loadProfile = cache(
  (id: string): Promise<ExpertProfile | null> => expertServerApi.byId(id).catch(() => null),
);

export type SectionKey = "new" | "find" | "fields" | "experts" | "how" | "faq";

/** The page order. A section's number depends only on the sections before it. */
const ORDER: readonly SectionKey[] = ["new", "find", "fields", "experts", "how", "faq"];

/** Whether a section renders: only three of them can be empty. */
const isShown = cache(async (key: SectionKey): Promise<boolean> => {
  const home = loadHome();
  switch (key) {
    case "new":
      return Boolean((await home.latest)?.content.length);
    case "fields":
      return (await home.categories).some((c) => c.active !== false);
    case "experts":
      return (await home.experts).length > 0;
    default:
      return true;
  }
});

/**
 * A section's department number ("01", "02", …), counted over the sections
 * that actually render, so omitting an empty one never leaves a gap. It waits
 * only for the data of the sections above it (the cover story never waits
 * for the expert directory). Null when the section itself is omitted.
 */
export const sectionNumber = cache(async (key: SectionKey): Promise<string | null> => {
  const upTo = ORDER.slice(0, ORDER.indexOf(key) + 1);
  const shown = await Promise.all(upTo.map((k) => isShown(k)));
  if (!shown[shown.length - 1]) return null;
  return String(shown.filter(Boolean).length).padStart(2, "0");
});

/**
 * A course's poster category (D11), localised. Null when the index failed or
 * the course has no active category, which gives the navy `brand` poster.
 */
export function courseCategory(
  index: CategoryIndex | null,
  courseId: string,
  t: TFunction,
  locale: Locale,
): CategoryRef | null {
  const cat = index?.primaryOf(courseId) ?? null;
  return cat ? toCategoryRef(cat, t, locale) : null;
}

/** An expert's most-enrolled published course (the /experts ordering), for their colour. */
export function topCourseOf(expertId: string, courses: readonly CourseSummary[]): string | null {
  let best: CourseSummary | null = null;
  for (const c of courses) {
    if (c.tutorId === expertId && (!best || c.enrolledCount > best.enrolledCount)) best = c;
  }
  return best?.id ?? null;
}

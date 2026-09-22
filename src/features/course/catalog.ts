import type { CourseLevel, CourseListParams, CourseSummary, CourseType, DurationBucket } from "./types";

/**
 * Pure functions over the published catalogue the page already has: facet
 * counts, catalogue stats, the home finder's matrix and two display rules.
 * They mirror the API's filters (CourseCatalogRepositoryImpl) exactly, so a
 * count shown next to an option is the number of results that option gives.
 */

/**
 * A copy of `CourseCatalogFilter.DurationBucket`: [min inclusive, max exclusive)
 * seconds. A null duration is in no bucket, as in the API's SQL.
 */
export const DURATION_BUCKETS: Record<DurationBucket, readonly [number, number]> = {
  lt2: [0, 7_200],
  "2to6": [7_200, 21_600],
  "6to17": [21_600, 61_200],
  gt17: [61_200, Number.POSITIVE_INFINITY],
};

export function bucketOf(seconds: number | null | undefined): DurationBucket | null {
  if (seconds === null || seconds === undefined) return null;
  for (const key of Object.keys(DURATION_BUCKETS) as DurationBucket[]) {
    const [min, max] = DURATION_BUCKETS[key];
    if (seconds >= min && seconds < max) return key;
  }
  return null;
}

export type CatalogueFilters = {
  type?: CourseType;
  categoryId?: string;
  level?: CourseLevel;
  duration?: DurationBucket;
  ratingMin?: number;
  language?: string;
};

/** The facet-relevant part of a parsed catalogue query (parseFiltersFromSearchParams). */
export function filtersFrom(params: CourseListParams): CatalogueFilters {
  return {
    type: params.type,
    categoryId: params.categoryId,
    level: params.level,
    duration: params.durationBucket,
    ratingMin: params.ratingMin,
    language: params.language,
  };
}

/** Does a course pass every filter (except `skip`)? `cats` = the course's category ids. */
export function matches(
  course: CourseSummary,
  cats: readonly string[],
  f: CatalogueFilters,
  skip?: keyof CatalogueFilters,
): boolean {
  if (skip !== "type" && f.type && course.courseType !== f.type) return false;
  if (skip !== "categoryId" && f.categoryId && !cats.includes(f.categoryId)) return false;
  if (skip !== "level" && f.level && course.level !== f.level) return false;
  if (skip !== "duration" && f.duration && bucketOf(course.totalDurationSec) !== f.duration) return false;
  if (skip !== "ratingMin" && f.ratingMin !== undefined && !(Number(course.ratingAvg) >= f.ratingMin)) return false;
  if (skip !== "language" && f.language && course.language?.toLowerCase() !== f.language.toLowerCase()) return false;
  return true;
}

/** The option values each facet offers (the rating options are the catalogue's floors). */
export const FACET_OPTIONS = {
  type: ["ONLINE", "OFFLINE"] as CourseType[],
  level: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL"] as CourseLevel[],
  duration: ["lt2", "2to6", "6to17", "gt17"] as DurationBucket[],
  rating: ["4.5", "4", "3.5", "3"],
};

export type FacetCounts = {
  type: Record<string, number>;
  level: Record<string, number>;
  duration: Record<string, number>;
  rating: Record<string, number>;
  categoryId: Record<string, number>;
  /** Courses matching every filter except the category (the "Hamısı" chip). */
  all: number;
};

/**
 * For each facet and option: how many courses match with that option chosen
 * and every OTHER active filter applied (standard cross-filter counts).
 */
export function facetCounts(
  courses: readonly CourseSummary[],
  courseCats: ReadonlyMap<string, readonly string[]>,
  f: CatalogueFilters,
): FacetCounts {
  const out: FacetCounts = { type: {}, level: {}, duration: {}, rating: {}, categoryId: {}, all: 0 };
  for (const c of courses) {
    const cats = courseCats.get(c.id) ?? [];
    if (matches(c, cats, f, "type")) out.type[c.courseType] = (out.type[c.courseType] ?? 0) + 1;
    if (matches(c, cats, f, "level")) out.level[c.level] = (out.level[c.level] ?? 0) + 1;
    if (matches(c, cats, f, "duration")) {
      const b = bucketOf(c.totalDurationSec);
      if (b) out.duration[b] = (out.duration[b] ?? 0) + 1;
    }
    if (matches(c, cats, f, "ratingMin")) {
      const r = Number(c.ratingAvg);
      for (const floor of FACET_OPTIONS.rating) if (r >= Number(floor)) out.rating[floor] = (out.rating[floor] ?? 0) + 1;
    }
    if (matches(c, cats, f, "categoryId")) {
      out.all += 1;
      for (const id of cats) out.categoryId[id] = (out.categoryId[id] ?? 0) + 1;
    }
  }
  return out;
}

export type CatalogueStats = {
  total: number;
  byType: Record<CourseType, number>;
  byLevel: Record<CourseLevel, number>;
  /** The newest publishedAt (ISO), or null. */
  updatedAt: string | null;
  allFree: boolean;
};

export function catalogueStats(courses: readonly CourseSummary[]): CatalogueStats {
  const byType: Record<CourseType, number> = { ONLINE: 0, OFFLINE: 0 };
  const byLevel: Record<CourseLevel, number> = { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0, ALL: 0 };
  let updatedAt: string | null = null;
  let updatedMs = -Infinity;
  let allFree = true;
  for (const c of courses) {
    byType[c.courseType] += 1;
    byLevel[c.level] += 1;
    if (!c.free) allFree = false;
    const ms = c.publishedAt ? Date.parse(c.publishedAt) : NaN;
    if (Number.isFinite(ms) && ms > updatedMs) {
      updatedMs = ms;
      updatedAt = c.publishedAt ?? null;
    }
  }
  return { total: courses.length, byType, byLevel, updatedAt, allFree: courses.length > 0 && allFree };
}

/**
 * The home finder's counts for every combination of category · level · type,
 * keyed "cat|level|type" with "" meaning "any". A course in two categories is
 * counted in each category, but once under "any".
 */
export function finderMatrix(
  courses: readonly CourseSummary[],
  courseCats: ReadonlyMap<string, readonly string[]>,
): Record<string, number> {
  const out: Record<string, number> = {};
  const bump = (k: string) => (out[k] = (out[k] ?? 0) + 1);
  for (const c of courses) {
    const cats = ["", ...(courseCats.get(c.id) ?? [])];
    for (const cat of cats) {
      for (const level of ["", c.level]) {
        for (const type of ["", c.courseType]) bump(`${cat}|${level}|${type}`);
      }
    }
  }
  return out;
}

/** The display-title step-down rule (`.t-display-xl.is-long`): long titles or long words. */
export function isLong(title: string): boolean {
  return title.length > 38 || title.split(/\s+/).some((w) => w.length > 15);
}

/**
 * The "Yeni" badge: published within `days` of `now`. `now` is taken once on
 * the server (the page) and passed down — never computed in a client
 * component — so the badge cannot differ between the two renders.
 */
export function isRecent(publishedAt: string | null | undefined, now: number, days = 30): boolean {
  if (!publishedAt) return false;
  const t = Date.parse(publishedAt);
  return Number.isFinite(t) && t <= now && now - t <= days * 86_400_000;
}

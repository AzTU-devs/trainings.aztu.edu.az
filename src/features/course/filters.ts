import type { CourseSummary, CourseType } from "./types";

export type DurationBucket = "lt2" | "2to6" | "6to17" | "gt17";

export type ClientFilters = {
  rating?: number;       // min rating
  priceMin?: number;
  priceMax?: number;
  duration?: DurationBucket;
  free?: boolean;
};

const BUCKETS: Record<DurationBucket, { min: number; max: number }> = {
  lt2: { min: 0, max: 2 * 3600 },
  "2to6": { min: 2 * 3600, max: 6 * 3600 },
  "6to17": { min: 6 * 3600, max: 17 * 3600 },
  gt17: { min: 17 * 3600, max: Number.POSITIVE_INFINITY },
};

export function applyClientFilters(
  items: CourseSummary[],
  f: ClientFilters,
): CourseSummary[] {
  return items.filter((c) => {
    if (f.free && !c.free) return false;
    if (f.rating !== undefined && Number(c.ratingAvg) < f.rating) return false;
    const price = Number(c.price);
    if (f.priceMin !== undefined && price < f.priceMin) return false;
    if (f.priceMax !== undefined && price > f.priceMax) return false;
    // Duration filter cannot be applied to summary (no duration field). Skip.
    return true;
  });
}

export function parseFiltersFromSearchParams(sp: URLSearchParams | Record<string, string | undefined>): {
  type?: CourseType;
  categoryId?: string;
  q?: string;
  page: number;
  size: number;
  client: ClientFilters;
} {
  const get = (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    return sp[k];
  };
  const t = get("type")?.toUpperCase();
  const type: CourseType | undefined =
    t === "ONLINE" || t === "OFFLINE" ? (t as CourseType) : undefined;
  return {
    type,
    // Server-side filter (UUID). Applied directly in the catalog list call.
    categoryId: get("categoryId") || undefined,
    q: get("q") || undefined,
    page: Number(get("page") ?? "0") || 0,
    size: Math.min(Number(get("size") ?? "12") || 12, 48),
    client: {
      free: get("free") === "1",
      rating: get("rating") ? Number(get("rating")) : undefined,
      priceMin: get("priceMin") ? Number(get("priceMin")) : undefined,
      priceMax: get("priceMax") ? Number(get("priceMax")) : undefined,
      duration: (get("duration") as DurationBucket) || undefined,
    },
  };
}

void BUCKETS;

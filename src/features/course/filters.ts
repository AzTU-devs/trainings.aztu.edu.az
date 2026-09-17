import { PAYMENTS_ENABLED } from "./payments";
import type {
  CourseLevel,
  CourseListParams,
  CourseType,
  DurationBucket,
} from "./types";

/** A catalogue query with the page window already resolved. */
export type CatalogParams = CourseListParams & { page: number; size: number };

const COURSE_TYPES: readonly CourseType[] = ["ONLINE", "OFFLINE"];
const LEVELS: readonly CourseLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL",
];
const DURATION_BUCKETS: readonly DurationBucket[] = [
  "lt2",
  "2to6",
  "6to17",
  "gt17",
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_SIZE = 12;
const MAX_SIZE = 48;
const MAX_RATING = 5;

/**
 * Turns the catalogue's query string into the params of a single
 * `GET /api/public/courses` call — filters, free text and paging together, all
 * applied by the server.
 *
 * The URL keeps the short names it has always used (`rating`, `duration`,
 * `free=1`); the API's own names are the explicit ones. Values are validated
 * rather than forwarded, so a hand-edited query string quietly loses the filter
 * it broke instead of turning the whole catalogue into a 400.
 */
export function parseFiltersFromSearchParams(
  sp: URLSearchParams | Record<string, string | undefined>,
): CatalogParams {
  const get = (k: string): string | undefined => {
    const raw = sp instanceof URLSearchParams ? sp.get(k) ?? undefined : sp[k];
    const trimmed = raw?.trim();
    return trimmed ? trimmed : undefined;
  };

  const int = (k: string, fallback: number): number => {
    const n = Math.trunc(Number(get(k)));
    return Number.isFinite(n) ? n : fallback;
  };

  /** Non-negative number or nothing — used for prices and the rating floor. */
  const amount = (k: string): number | undefined => {
    const raw = get(k);
    if (raw === undefined) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const literal = <T extends string>(
    k: string,
    allowed: readonly T[],
  ): T | undefined => {
    const raw = get(k);
    return allowed.find((v) => v === raw);
  };

  /**
   * The API binds `categoryId` to a `java.util.UUID`, so a malformed value is a
   * 400 that costs the visitor the whole catalogue rather than one filter. Shape
   * is all we can check here; an unknown-but-well-formed id simply matches
   * nothing, which is the right outcome for a stale bookmark.
   */
  const uuid = (k: string): string | undefined => {
    const raw = get(k);
    return raw && UUID_RE.test(raw) ? raw : undefined;
  };

  /** Enum filters are spelled uppercase by the API but tolerated either way. */
  const enumOf = <T extends string>(
    k: string,
    allowed: readonly T[],
  ): T | undefined => {
    const raw = get(k)?.toUpperCase();
    return allowed.find((v) => v === raw);
  };

  const rating = amount("rating");
  const requestedSize = int("size", DEFAULT_SIZE);

  const params: CatalogParams = {
    q: get("q"),
    type: enumOf("type", COURSE_TYPES),
    categoryId: uuid("categoryId"),
    level: enumOf("level", LEVELS),
    language: get("language"),
    ratingMin: rating === undefined ? undefined : Math.min(rating, MAX_RATING),
    durationBucket: literal("duration", DURATION_BUCKETS),
    page: Math.max(0, int("page", 0)),
    size: requestedSize > 0 ? Math.min(requestedSize, MAX_SIZE) : DEFAULT_SIZE,
  };

  // While payments are off the API serves free courses only, so a price window
  // or a `free=1` flag cannot narrow anything down — sending them would only
  // make the catalogue look broken. See ./payments.ts.
  if (PAYMENTS_ENABLED) {
    params.free = get("free") === "1" ? true : undefined;
    params.priceMin = amount("priceMin");
    params.priceMax = amount("priceMax");
  }

  return params;
}

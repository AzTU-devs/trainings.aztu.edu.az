import "server-only";
import { cache } from "react";
import { courseServerApi } from "./api.server";

/** 100 is the largest page the API serves; ten pages is a thousand courses. */
const PAGE = 100;
const MAX_PAGES = 10;

/**
 * Course id → slug for every published course.
 *
 * Enrolments carry the course id but not its slug, and the lesson player is
 * addressed by slug. Linking to /learn/{id} therefore always failed: the
 * player looked the id up as a slug, got a 404 and answered with an error page,
 * so "Continue" on the dashboard and in "My courses" never opened a course.
 * This map, built from the same cached catalogue pages the site already uses,
 * gives those links their real slug. Always the real catalogue — enrolments
 * are real even while the public pages show sample content.
 */
export const courseSlugsById = cache(async (): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  const first = await courseServerApi.list({ page: 0, size: PAGE }).catch(() => null);
  if (!first) return map;
  const pages = [first];
  const total = Math.min(first.totalPages, MAX_PAGES);
  if (total > 1) {
    const rest = await Promise.all(
      Array.from({ length: total - 1 }, (_, i) => courseServerApi.list({ page: i + 1, size: PAGE }).catch(() => null)),
    );
    for (const p of rest) if (p) pages.push(p);
  }
  for (const p of pages) for (const c of p.content) map.set(c.id, c.slug);
  return map;
});

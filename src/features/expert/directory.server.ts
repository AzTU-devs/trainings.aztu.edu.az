import "server-only";
import { courseServerApi } from "@/features/course/api.server";
import type { CourseSummary } from "@/features/course/types";
import type { ExpertSummary } from "./types";

/**
 * The expert directory, aggregated from the published catalogue.
 *
 * The backend exposes `GET /api/public/tutors/{id}` but has no endpoint that
 * lists tutors, so there is nothing to page over directly. Every published
 * course already carries `tutorId` and `tutorDisplayName`, which is enough to
 * build the directory: an expert is someone with at least one published course,
 * which is also exactly who a visitor can usefully click through to.
 *
 * The trade-off is that this walks the catalogue. It is bounded (see MAX_PAGES)
 * and the underlying fetch is cached for 60s by `courseServerApi.list`, but a
 * dedicated `GET /api/public/tutors` endpoint is the right fix once the
 * catalogue outgrows the cap.
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 10; // 1,000 courses — past that the directory needs an endpoint.

/** Every published course, up to the page cap. */
async function allPublishedCourses(): Promise<CourseSummary[]> {
  const first = await courseServerApi.list({ page: 0, size: PAGE_SIZE });
  const out = [...first.content];

  const pages = Math.min(first.totalPages, MAX_PAGES);
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        courseServerApi.list({ page: i + 1, size: PAGE_SIZE }),
      ),
    );
    for (const p of rest) out.push(...p.content);
  }
  return out;
}

type Accumulator = {
  id: string;
  displayName: string;
  courseCount: number;
  ratingSum: number;
  ratingCount: number;
  enrolledCount: number;
  online: boolean;
  offline: boolean;
};

function aggregate(courses: CourseSummary[]): ExpertSummary[] {
  const byId = new Map<string, Accumulator>();

  for (const c of courses) {
    if (!c.tutorId) continue;
    const acc = byId.get(c.tutorId) ?? {
      id: c.tutorId,
      displayName: c.tutorDisplayName,
      courseCount: 0,
      ratingSum: 0,
      ratingCount: 0,
      enrolledCount: 0,
      online: false,
      offline: false,
    };

    acc.courseCount += 1;
    acc.enrolledCount += c.enrolledCount ?? 0;
    // Weight each course's rating by how many people rated it, so one 5.0 from
    // a single review does not outrank a 4.7 from four hundred.
    const avg = Number(c.ratingAvg);
    if (Number.isFinite(avg) && c.ratingCount > 0) {
      acc.ratingSum += avg * c.ratingCount;
      acc.ratingCount += c.ratingCount;
    }
    if (c.courseType === "ONLINE") acc.online = true;
    else acc.offline = true;

    byId.set(c.tutorId, acc);
  }

  return [...byId.values()]
    .map(({ ratingSum, ...rest }) => ({
      ...rest,
      ratingAvg: rest.ratingCount > 0 ? ratingSum / rest.ratingCount : 0,
    }))
    .sort(
      (a, b) =>
        b.enrolledCount - a.enrolledCount ||
        b.courseCount - a.courseCount ||
        a.displayName.localeCompare(b.displayName),
    );
}

/** Every expert with at least one published course. Empty on API failure. */
export async function listExperts(): Promise<ExpertSummary[]> {
  const courses = await allPublishedCourses().catch(() => null);
  return courses ? aggregate(courses) : [];
}

/** The published courses of one expert. Empty on API failure. */
export async function coursesByExpert(
  expertId: string,
): Promise<CourseSummary[]> {
  const courses = await allPublishedCourses().catch(() => null);
  if (!courses) return [];
  return courses
    .filter((c) => c.tutorId === expertId)
    .sort((a, b) => b.enrolledCount - a.enrolledCount);
}

/** The display name the catalogue has on file, used when the profile 404s. */
export async function expertNameFromCatalogue(
  expertId: string,
): Promise<string | null> {
  const courses = await allPublishedCourses().catch(() => null);
  return courses?.find((c) => c.tutorId === expertId)?.tutorDisplayName ?? null;
}

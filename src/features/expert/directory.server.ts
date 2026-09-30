import "server-only";
import { courseServerApi } from "@/features/course/api.server";
import type { CourseSummary } from "@/features/course/types";
import { expertServerApi } from "./api.server";
import { fullExpertName, type ExpertProfile, type ExpertSummary } from "./types";

/**
 * The expert directory: every approved expert, from `GET /api/public/tutors`,
 * with the numbers on each card (courses, rating, enrolments, formats) counted
 * from the published catalogue.
 *
 * It used to be built from the catalogue alone, which made an expert someone
 * with at least one published course. While the catalogue shows sample content
 * that left out nearly every real expert, so the list now comes from the API
 * and an expert with nothing published yet is shown with zeros. Against an API
 * that predates the list endpoint the directory falls back to the catalogue.
 *
 * Walking the catalogue is bounded (see MAX_PAGES) and cached for 60s by
 * `courseServerApi.list`.
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 10; // 1,000 courses — past that the directory needs an endpoint.
/**
 * Profile fetches in flight at once while filling in avatars. Each is cached
 * for 300s per expert, so this only bites on a cold cache, where firing one
 * request per expert at the same moment would hit the API in a burst.
 */
const PROFILE_CONCURRENCY = 6;

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
    // OFFLINE and ONE_TIME both count as in person.
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

/**
 * Adds the avatar, affiliation and areas of expertise from each expert's public
 * profile, which the catalogue does not carry. The fetch is the same cached
 * `byId` the profile page uses, so the directory and the page share cache
 * entries. A profile that fails to load (a non-APPROVED expert 404s) leaves
 * its entry as the catalogue built it, and the card falls back to initials.
 */
async function withProfiles(experts: ExpertSummary[]): Promise<ExpertSummary[]> {
  const out = [...experts];
  let next = 0;

  async function worker() {
    // Safe without a lock: `next++` runs synchronously between awaits.
    while (next < out.length) {
      const i = next++;
      const profile = await expertServerApi.byId(out[i].id).catch(() => null);
      if (profile && profile.approvalStatus === "APPROVED") {
        out[i] = {
          ...out[i],
          avatarUrl: profile.avatarUrl ?? null,
          academicTitle: profile.academicTitle ?? null,
          department: profile.department ?? null,
          headline: profile.headline ?? null,
          expertiseCategoryIds: profile.expertiseCategoryIds ?? [],
          customExpertise: profile.customExpertise ?? [],
          approved: true,
        };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(PROFILE_CONCURRENCY, out.length) }, worker),
  );
  return out;
}

/** Every approved expert, a page of 100 at a time up to MAX_PAGES. */
async function allApprovedExperts(): Promise<ExpertProfile[]> {
  const first = await expertServerApi.list(0, PAGE_SIZE);
  const out = [...first.content];
  const pages = Math.min(first.totalPages, MAX_PAGES);
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) => expertServerApi.list(i + 1, PAGE_SIZE)),
    );
    for (const p of rest) out.push(...p.content);
  }
  return out;
}

/** Same order as `aggregate`: most enrolled first, the not-yet-published by name at the end. */
const byStanding = (a: ExpertSummary, b: ExpertSummary) =>
  b.enrolledCount - a.enrolledCount ||
  b.courseCount - a.courseCount ||
  a.displayName.localeCompare(b.displayName);

/**
 * Every approved expert, published courses or not. Empty when the API is
 * unreachable; catalogue-only (the old behaviour) when it has no list endpoint.
 */
export async function listExperts(): Promise<ExpertSummary[]> {
  const [courses, profiles] = await Promise.all([
    allPublishedCourses().catch(() => null),
    allApprovedExperts().catch(() => null),
  ]);
  if (!profiles) return courses ? withProfiles(aggregate(courses)) : [];

  const stats = new Map(aggregate(courses ?? []).map((e) => [e.id, e]));
  return profiles
    .map((p): ExpertSummary => {
      const s = stats.get(p.id);
      return {
        id: p.id,
        displayName: fullExpertName(p) || s?.displayName || "",
        courseCount: s?.courseCount ?? 0,
        ratingAvg: s?.ratingAvg ?? 0,
        ratingCount: s?.ratingCount ?? 0,
        enrolledCount: s?.enrolledCount ?? 0,
        online: s?.online ?? false,
        offline: s?.offline ?? false,
        avatarUrl: p.avatarUrl ?? null,
        academicTitle: p.academicTitle ?? null,
        department: p.department ?? null,
        headline: p.headline ?? null,
        expertiseCategoryIds: p.expertiseCategoryIds ?? [],
        customExpertise: p.customExpertise ?? [],
        approved: true,
      };
    })
    .sort(byStanding);
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

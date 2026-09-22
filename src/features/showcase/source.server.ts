import "server-only";
import { courseServerApi } from "@/features/course/api.server";
import type { Course, CourseListParams, CourseSummary } from "@/features/course/types";
import { expertServerApi } from "@/features/expert/api.server";
import { coursesByExpert as realCoursesByExpert, listExperts as realListExperts } from "@/features/expert/directory.server";
import type { ExpertProfile, ExpertSummary } from "@/features/expert/types";
import type { Page } from "@/types/api";
import { SHOWCASE } from "./flag";
import { MOCK_CATEGORIES, MOCK_EXPERTS, expertName, mockCategoryOf, mockCourse, mockCourses } from "./data";

/*
 * The one place the public pages get catalogue data from. With the showcase
 * flag on it answers from the sample content; otherwise it is a thin pass-
 * through to the real API, with exactly the calls the pages made before.
 */

// ---------------------------------------------------------------- index

export function mockIndex() {
  const courses = mockCourses();
  const countByCategory: Record<string, number> = {};
  const categoryOfCourse: Record<string, string> = {};
  const categoryOfExpert: Record<string, string> = {};
  for (const c of MOCK_CATEGORIES) countByCategory[c.id] = 0;
  for (const c of courses) {
    const cat = mockCategoryOf(c.id);
    if (!cat) continue;
    countByCategory[cat] = (countByCategory[cat] ?? 0) + 1;
    categoryOfCourse[c.id] = cat;
  }
  for (const e of MOCK_EXPERTS) categoryOfExpert[e.id] = e.categoryId;
  return {
    categories: MOCK_CATEGORIES,
    countByCategory,
    categoryOfCourse,
    categoryOfExpert,
    total: courses.length,
    online: courses.filter((c) => c.courseType === "ONLINE").length,
    offline: courses.filter((c) => c.courseType === "OFFLINE").length,
  };
}

// ---------------------------------------------------------------- courses

const BUCKETS: Record<string, [number, number]> = {
  lt2: [0, 2 * 3600],
  "2to6": [2 * 3600, 6 * 3600],
  "6to17": [6 * 3600, 17 * 3600],
  gt17: [17 * 3600, Number.POSITIVE_INFINITY],
};

/** Lower-cases Azerbaijani text without depending on locale data. */
const fold = (s: string) => s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();

function mockList(params: CourseListParams & { page?: number; size?: number }): Page<CourseSummary> {
  const q = params.q ? fold(params.q) : null;
  const filtered = mockCourses().filter((c) => {
    if (q && !fold(`${c.title} ${c.subtitle ?? ""} ${c.tutorDisplayName}`).includes(q)) return false;
    if (params.type && c.courseType !== params.type) return false;
    if (params.categoryId && mockCategoryOf(c.id) !== params.categoryId) return false;
    if (params.level && c.level !== params.level) return false;
    if (params.ratingMin !== undefined && !(Number(c.ratingAvg) >= params.ratingMin)) return false;
    if (params.durationBucket) {
      const [lo, hi] = BUCKETS[params.durationBucket] ?? [0, Infinity];
      const d = c.totalDurationSec ?? 0;
      if (d < lo || d >= hi) return false;
    }
    return true;
  });
  const size = params.size && params.size > 0 ? params.size : 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(Math.max(0, params.page ?? 0), totalPages - 1);
  return {
    content: filtered.slice(page * size, page * size + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: filtered.length ? totalPages : 0,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

/** The catalogue query: sample content or `GET /api/public/courses`. */
export function listCourses(params: CourseListParams & { page?: number; size?: number }): Promise<Page<CourseSummary>> {
  return SHOWCASE ? Promise.resolve(mockList(params)) : courseServerApi.list(params);
}

/**
 * One course's page. A slug that is not in the sample set falls through to
 * the API, so a real course stays reachable by its link either way.
 */
export async function getCourse(slug: string): Promise<{ course: Course; sample: boolean }> {
  if (SHOWCASE) {
    const mock = mockCourse(slug);
    if (mock) return { course: mock, sample: true };
  }
  return { course: await courseServerApi.bySlug(slug), sample: false };
}

// ---------------------------------------------------------------- experts

function mockExpertSummaries(): ExpertSummary[] {
  const courses = mockCourses();
  return MOCK_EXPERTS.map((e) => {
    const own = courses.filter((c) => c.tutorId === e.id);
    const rated = own.filter((c) => c.ratingCount > 0);
    const ratingCount = rated.reduce((s, c) => s + c.ratingCount, 0);
    const ratingAvg = ratingCount ? rated.reduce((s, c) => s + Number(c.ratingAvg) * c.ratingCount, 0) / ratingCount : 0;
    return {
      id: e.id,
      displayName: expertName(e),
      courseCount: own.length,
      ratingAvg,
      ratingCount,
      enrolledCount: own.reduce((s, c) => s + c.enrolledCount, 0),
      online: own.some((c) => c.courseType === "ONLINE"),
      offline: own.some((c) => c.courseType === "OFFLINE"),
      avatarUrl: null,
      academicTitle: e.title,
      department: e.department,
      headline: e.headline,
    };
  }).sort((a, b) => b.enrolledCount - a.enrolledCount);
}

export async function listExpertsSource(): Promise<ExpertSummary[]> {
  return SHOWCASE ? mockExpertSummaries() : realListExperts();
}

export async function expertProfileSource(id: string): Promise<ExpertProfile | null> {
  if (SHOWCASE) {
    const e = MOCK_EXPERTS.find((x) => x.id === id);
    if (e) {
      const s = mockExpertSummaries().find((x) => x.id === id)!;
      return {
        id: e.id,
        userId: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        headline: e.headline,
        bio: e.bio ?? null,
        yearsExperience: e.years,
        websiteUrl: null,
        linkedinUrl: null,
        approvalStatus: "APPROVED",
        approvedAt: null,
        ratingAvg: String(s.ratingAvg),
        ratingCount: s.ratingCount,
        expertiseCategoryIds: [e.categoryId],
        avatarMediaId: null,
        avatarUrl: null,
        academicTitle: e.title,
        department: e.department,
        education: null,
        certifications: null,
        languages: e.languages ?? null,
        googleScholarUrl: null,
        researchGateUrl: null,
        orcid: null,
        githubUrl: null,
      };
    }
  }
  return expertServerApi.byId(id).catch(() => null);
}

export async function coursesByExpertSource(id: string): Promise<CourseSummary[]> {
  if (SHOWCASE && MOCK_EXPERTS.some((e) => e.id === id)) {
    return mockCourses().filter((c) => c.tutorId === id);
  }
  return realCoursesByExpert(id);
}

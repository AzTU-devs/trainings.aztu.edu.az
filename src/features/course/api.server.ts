import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { Course, CourseListParams, CourseSummary } from "./types";

export const courseServerApi = {
  list: (params: CourseListParams = {}) =>
    serverFetch<Page<CourseSummary>>(endpoints.public.courses, {
      searchParams: params,
      revalidate: 60,
      tags: ["courses:list"],
    }),

  search: (q: string, page = 0, size = 24) =>
    serverFetch<Page<CourseSummary>>(endpoints.public.coursesSearch, {
      searchParams: { q, page, size },
      revalidate: 60,
      tags: ["courses:search"],
    }),

  bySlug: (slug: string) =>
    serverFetch<Course>(endpoints.public.courseBySlug(slug), {
      revalidate: 300,
      tags: [`course:${slug}`],
    }),
};

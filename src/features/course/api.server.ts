import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { Course, CourseListParams, CourseSummary } from "./types";

export const courseServerApi = {
  // One endpoint covers the whole catalogue: free text, every filter and paging
  // are applied together server-side, so there is no separate search call.
  list: (params: CourseListParams = {}) =>
    serverFetch<Page<CourseSummary>>(endpoints.public.courses, {
      searchParams: params,
      revalidate: 60,
      tags: ["courses:list"],
    }),

  bySlug: (slug: string) =>
    serverFetch<Course>(endpoints.public.courseBySlug(slug), {
      revalidate: 300,
      tags: [`course:${slug}`],
    }),
};

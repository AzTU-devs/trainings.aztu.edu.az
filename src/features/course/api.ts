import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { Course, CourseListParams, CourseSummary } from "./types";

export const courseApi = {
  list: (params: CourseListParams = {}) =>
    request<Page<CourseSummary>>({
      url: endpoints.public.courses,
      method: "GET",
      params,
    }),

  search: (q: string, params: Omit<CourseListParams, "type"> = {}) =>
    request<Page<CourseSummary>>({
      url: endpoints.public.coursesSearch,
      method: "GET",
      params: { q, ...params },
    }),

  bySlug: (slug: string) =>
    request<Course>({
      url: endpoints.public.courseBySlug(slug),
      method: "GET",
    }),
};

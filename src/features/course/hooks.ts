"use client";

import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { courseApi } from "./api";
import type { CourseListParams } from "./types";

// `params.q` is the catalogue's free-text search; it needs no hook of its own.
export function useCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: qk.courses.list(params as Record<string, unknown>),
    queryFn: () => courseApi.list(params),
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: qk.courses.detail(slug),
    queryFn: () => courseApi.bySlug(slug),
    enabled: Boolean(slug),
  });
}

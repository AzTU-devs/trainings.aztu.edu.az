import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { CourseReview } from "./types";

export const reviewServerApi = {
  list: (courseId: string, page = 0, size = 10) =>
    serverFetch<Page<CourseReview>>(endpoints.public.courseReviews(courseId), {
      searchParams: { page, size },
      revalidate: 60,
      tags: [`course:${courseId}:reviews`],
    }),
};

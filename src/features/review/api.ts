import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { CourseReview, ReviewCreateInput } from "./types";

export const reviewApi = {
  list: (courseId: string, page = 0, size = 10) =>
    request<Page<CourseReview>>({
      url: endpoints.public.courseReviews(courseId),
      method: "GET",
      params: { page, size },
    }),

  create: (courseId: string, body: ReviewCreateInput) =>
    request<CourseReview>({
      url: endpoints.portal.reviewCreate(courseId),
      method: "POST",
      data: body,
    }),
};

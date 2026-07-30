import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { Enrollment, LessonProgress, LessonProgressUpdate } from "./types";

export const enrollmentApi = {
  // GET /api/portal/enrollments/mine returns a paged PageResponse<EnrollmentDto>,
  // not a plain array. Unwrap `.content` so callers get a flat list.
  mine: async (): Promise<Enrollment[]> => {
    const page = await request<Page<Enrollment>>({
      url: endpoints.portal.myEnrollments,
      method: "GET",
    });
    return page.content;
  },

  enrollFree: (courseId: string) =>
    request<Enrollment>({
      url: endpoints.portal.enrollFree(courseId),
      method: "POST",
    }),

  updateLessonProgress: (
    courseId: string,
    lessonId: string,
    body: LessonProgressUpdate,
  ) =>
    request<LessonProgress>({
      url: endpoints.portal.lessonProgress(courseId, lessonId),
      method: "PUT",
      data: body,
    }),
};

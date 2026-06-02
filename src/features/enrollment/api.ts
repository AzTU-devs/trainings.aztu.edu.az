import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Enrollment, LessonProgress, LessonProgressUpdate } from "./types";

export const enrollmentApi = {
  mine: () =>
    request<Enrollment[]>({
      url: endpoints.portal.myEnrollments,
      method: "GET",
    }),

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

import "server-only";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { Enrollment, LessonProgress } from "./types";

export const enrollmentServerApi = {
  // GET /api/portal/enrollments/mine returns a paged PageResponse<EnrollmentDto>,
  // not a plain array. Unwrap `.content` so callers get a flat list.
  mine: async (): Promise<Enrollment[]> => {
    const page = await serverFetch<Page<Enrollment>>(
      endpoints.portal.myEnrollments,
      {
        auth: true,
        cache: "no-store",
      },
    );
    return page.content;
  },

  // My saved lesson progress for one course. Returns [] when not enrolled
  // (the backend answers 404) so the caller can render an empty sidebar.
  lessonProgress: (courseId: string) =>
    serverFetch<LessonProgress[]>(endpoints.portal.courseProgress(courseId), {
      auth: true,
      cache: "no-store",
    }).catch(() => [] as LessonProgress[]),
};

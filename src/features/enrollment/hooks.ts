"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { enrollmentApi } from "./api";
import type { LessonProgressUpdate } from "./types";

export function useMyEnrollments() {
  return useQuery({
    queryKey: qk.enrollments.mine(),
    queryFn: () => enrollmentApi.mine(),
    staleTime: 30_000,
  });
}

export function useUpdateLessonProgress(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      ...body
    }: LessonProgressUpdate & { lessonId: string }) =>
      enrollmentApi.updateLessonProgress(courseId, lessonId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.enrollments.mine() });
    },
  });
}

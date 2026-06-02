"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { reviewApi } from "./api";
import type { ReviewCreateInput } from "./types";

export function useReviews(courseId: string) {
  return useQuery({
    queryKey: qk.courses.reviews(courseId),
    queryFn: () => reviewApi.list(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCreateReview(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewCreateInput) => reviewApi.create(courseId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.courses.reviews(courseId) });
    },
  });
}

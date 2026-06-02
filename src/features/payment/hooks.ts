"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { paymentApi } from "./api";

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentApi.createOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.orders.mine() });
      qc.invalidateQueries({ queryKey: qk.enrollments.mine() });
    },
  });
}

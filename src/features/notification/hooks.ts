"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { notificationApi } from "./api";

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications.list(),
    queryFn: () => notificationApi.list(),
    refetchInterval: 60_000,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: qk.notifications.unread(),
    queryFn: () => notificationApi.unreadCount(),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.list() });
      qc.invalidateQueries({ queryKey: qk.notifications.unread() });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications.list() });
      qc.invalidateQueries({ queryKey: qk.notifications.unread() });
    },
  });
}

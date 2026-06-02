import { request } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Page } from "@/types/api";
import type { Notification } from "./types";

export const notificationApi = {
  list: (page = 0, size = 20) =>
    request<Page<Notification>>({
      url: endpoints.portal.notifications,
      method: "GET",
      params: { page, size },
    }),

  unreadCount: () =>
    request<{ count: number }>({
      url: endpoints.portal.notificationsUnread,
      method: "GET",
    }),

  markRead: (id: string) =>
    request<void>({
      url: endpoints.portal.notificationRead(id),
      method: "POST",
    }),

  markAllRead: () =>
    request<void>({
      url: endpoints.portal.notificationsReadAll,
      method: "POST",
    }),
};

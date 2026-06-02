"use client";

import { useNotificationSocket } from "@/features/notification/useNotificationSocket";

export function NotificationBridge() {
  useNotificationSocket();
  return null;
}

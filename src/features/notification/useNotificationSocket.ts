"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query/keys";
import { useAppSelector } from "@/store/hooks";
import { tokenStore } from "@/lib/auth/tokens";
import {
  connectNotificationSocket,
  type NotificationSocket,
} from "./ws";
import type { Notification } from "./types";

export function useNotificationSocket() {
  const qc = useQueryClient();
  const status = useAppSelector((s) => s.auth.status);
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);
  const sockRef = useRef<NotificationSocket | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      sockRef.current?.deactivate();
      sockRef.current = null;
      return;
    }

    sockRef.current = connectNotificationSocket(() => tokenStore.get(), {
      onNotification: (payload) => {
        const n = payload as Partial<Notification>;
        if (n && n.title) {
          toast(n.title, { description: n.body ?? undefined });
        }
        qc.invalidateQueries({ queryKey: qk.notifications.list() });
        qc.invalidateQueries({ queryKey: qk.notifications.unread() });
      },
    });

    return () => {
      sockRef.current?.deactivate();
      sockRef.current = null;
    };
  }, [status, userId, qc]);
}

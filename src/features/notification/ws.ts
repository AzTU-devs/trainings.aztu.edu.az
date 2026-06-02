"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import { env } from "@/lib/env";

const NOTIFICATION_DESTINATION = "/user/queue/notifications";

export type NotificationSocketHandlers = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: unknown) => void;
  onNotification: (payload: unknown) => void;
};

export type NotificationSocket = {
  deactivate: () => void;
  active: () => boolean;
};

function deriveWsUrl(): string | null {
  if (env.NEXT_PUBLIC_WS_URL) return env.NEXT_PUBLIC_WS_URL;
  if (!env.NEXT_PUBLIC_API_URL) return null;
  try {
    const u = new URL(env.NEXT_PUBLIC_API_URL);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = "/ws";
    return u.toString();
  } catch {
    return null;
  }
}

export function connectNotificationSocket(
  getToken: () => string | null,
  handlers: NotificationSocketHandlers,
): NotificationSocket | null {
  const url = deriveWsUrl();
  if (!url) return null;

  const client = new Client({
    brokerURL: url,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    connectHeaders: token(getToken),
    beforeConnect: () => {
      // Re-read the token in case it was refreshed
      client.connectHeaders = token(getToken);
    },
    onConnect: () => {
      client.subscribe(NOTIFICATION_DESTINATION, (msg: IMessage) => {
        try {
          handlers.onNotification(JSON.parse(msg.body));
        } catch {
          handlers.onNotification(msg.body);
        }
      });
      handlers.onConnect?.();
    },
    onWebSocketClose: () => handlers.onDisconnect?.(),
    onStompError: (frame) => handlers.onError?.(frame),
    onWebSocketError: (e) => handlers.onError?.(e),
  });

  client.activate();

  return {
    deactivate: () => {
      void client.deactivate();
    },
    active: () => client.active,
  };
}

function token(getToken: () => string | null): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

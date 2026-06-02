export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "WEBSOCKET";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

export type Notification = {
  id: string;
  templateCode: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
  status: NotificationStatus;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
};

"use client";

import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useNotifications, useMarkAllRead, useMarkRead } from "../hooks";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

export function NotificationList() {
  const t = useT();
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const items = data?.content ?? [];

  if (items.length === 0) {
    return <EmptyState title={t("student.noNotifications")} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAll.mutate()}
          loading={markAll.isPending}
        >
          <CheckCheck className="size-4" />
          {t("student.markAllRead")}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((n) => {
          const unread = !n.readAt;
          return (
            <Card
              key={n.id}
              className={cn(unread && "border-primary/40 bg-primary/5")}
              onClick={() => unread && markOne.mutate(n.id)}
              role="button"
              tabIndex={0}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <Bell
                  className={cn(
                    "mt-0.5 size-4",
                    unread ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-sm text-muted-foreground">{n.body}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

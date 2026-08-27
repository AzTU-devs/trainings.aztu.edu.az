"use client";

import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-16 text-center">
      <h3 className="font-display text-xl leading-snug text-destructive">{title}</h3>
      {description ? (
        <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

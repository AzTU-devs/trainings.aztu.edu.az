"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const t = useT();
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-border/80 bg-card px-6 py-14 text-center elev-1 sm:py-16"
    >
      <span
        aria-hidden
        className="grid size-16 place-items-center rounded-3xl bg-destructive/5 ring-1 ring-inset ring-destructive/10"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-[22px]" strokeWidth={1.75} />
        </span>
      </span>
      <h3 className="mt-5 font-display text-xl leading-snug">{title ?? t("errors.title")}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" className="mt-7" onClick={onRetry}>
          <RotateCcw />
          {t("errors.tryAgain")}
        </Button>
      ) : null}
    </div>
  );
}

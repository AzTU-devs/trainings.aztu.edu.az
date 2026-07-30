import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center"
          ? "items-center text-center"
          : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("space-y-3", align === "center" && "max-w-2xl")}>
        {eyebrow ? (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary",
              align === "center" && "mx-auto",
            )}
          >
            <span className="size-1.5 rounded-full bg-gradient-to-r from-primary to-fuchsia-500" />
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

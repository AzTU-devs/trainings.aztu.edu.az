import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/**
 * "Nothing here yet" as a friendly object rather than a hole in the page: a
 * white rounded card with an icon squircle, a short title and an optional
 * pill action. Pass `icon` (an element, e.g. `<SearchX />`) to suit the
 * context; the tray is a neutral default.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-border/80 bg-card px-6 py-14 text-center elev-1 sm:py-16",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-16 place-items-center rounded-3xl bg-navy-25 ring-1 ring-inset ring-navy-50 dark:bg-navy-950/40 dark:ring-navy-900"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/70 dark:text-navy-100 [&_svg]:size-[22px]">
          {icon ?? <Inbox strokeWidth={1.75} />}
        </span>
      </span>
      <h3 className="mt-5 font-display text-xl leading-snug">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}

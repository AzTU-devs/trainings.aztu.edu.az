import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The single heading treatment used by every marketing section: a gold-ruled
 * eyebrow, a display-serif title, and an optional lead paragraph capped at a
 * comfortable measure. Sections stay left-aligned unless a layout genuinely
 * calls for centring, which is what keeps the page reading as one document.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  /** `deep` recolours the heading for the navy canvas. */
  tone?: "light" | "deep";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        centered && "items-center text-center",
        // The row layout exists to sit the title and its action side by side.
        // Applying it without an action makes the heading a bottom-aligned flex
        // item, which sinks it to the floor of any stretched grid cell.
        !centered && action && "sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow ? (
          <div
            className={cn(
              "mb-4 flex items-center gap-3",
              centered && "justify-center",
            )}
          >
            <span
              aria-hidden
              className="h-px w-8 bg-gradient-to-r from-gold-500 to-gold-500/0"
            />
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.18em]",
                tone === "deep" ? "text-gold-300" : "text-gold-700 dark:text-gold-400",
              )}
            >
              {eyebrow}
            </span>
          </div>
        ) : null}
        <h2
          className={cn(
            "font-display text-balance text-3xl leading-[1.15] sm:text-4xl lg:text-[2.75rem]",
            tone === "deep" ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-4 text-pretty leading-relaxed",
              tone === "deep" ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

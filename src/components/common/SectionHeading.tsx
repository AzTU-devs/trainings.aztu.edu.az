import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The single heading treatment used by every marketing section: an eyebrow
 * pill, a bold sans title, and an optional lead paragraph capped at a
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
        {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
        <h2
          className={cn(
            "font-display text-balance text-3xl leading-[1.1] sm:text-4xl lg:text-[2.625rem]",
            eyebrow && "mt-4",
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

/**
 * The small rounded label above a heading. Shared so that every eyebrow on the
 * site — section headings, page intros, the hero — is the same object.
 */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "deep";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        tone === "deep"
          ? "bg-white/10 text-gold-200 ring-1 ring-inset ring-white/15"
          : "bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100 dark:bg-navy-900/50 dark:text-navy-100 dark:ring-navy-800",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", tone === "deep" ? "bg-gold-300" : "bg-gold-500")}
      />
      {children}
    </span>
  );
}

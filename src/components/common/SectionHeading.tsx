import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Kept for callers not yet migrated; new code uses `Dept` (the numbered
 * opener) and a `t-display-l` h2. Restyled to the editorial look: a mono
 * kicker, a Fraunces title and a dek.
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
  /** `deep` recolours the heading for the navy spread. */
  tone?: "light" | "deep";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        centered && "items-center text-center",
        // Row layout only with an action: without one a bottom-aligned flex
        // item would sink to the floor of any stretched grid cell.
        !centered && action && "sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <div className={cn("max-w-3xl", centered && "mx-auto")}>
        {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
        <h2 className={cn("t-display-l", eyebrow && "mt-4", tone === "deep" && "text-spread-ink")}>{title}</h2>
        {description ? (
          <p className={cn("t-body mt-4 max-w-[56ch]", tone === "deep" && "text-spread-2")}>{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** The mono kicker above a heading (legacy name; new code uses `Kicker`). */
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
    <span className={cn("t-kicker inline-block", tone === "deep" ? "text-spread-gold" : "text-gold-ink", className)}>
      {children}
    </span>
  );
}

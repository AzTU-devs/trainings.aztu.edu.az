import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { BlankPlate } from "@/components/editorial/BlankPlate";

/**
 * "Nothing here yet", said plainly. With `plate` (e.g. "0 nəticə") it is the
 * editorial empty state: a dotted plate at columns 1–4 and the text at 6–12;
 * `compact` (the participant area) puts a 96px plate beside the text. Without
 * a plate — callers not yet migrated — the icon sits in a small paper-2 circle
 * above the text. `icon` is ignored once `plate` is given.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  plate,
  compact = false,
  headingLevel = "h3",
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  plate?: string;
  compact?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const H = headingLevel;
  const text = (
    <>
      <H className={cn(compact ? "t-title" : "t-display-m")}>{title}</H>
      {description ? <div className="t-body mt-3 max-w-[52ch]">{description}</div> : null}
      {action ? <div className="mt-6 flex flex-wrap items-center gap-3">{action}</div> : null}
    </>
  );

  if (plate && !compact) {
    return (
      <div className={cn("g12 gap-y-8 border-t border-line-strong pt-8", className)}>
        <BlankPlate label={plate} className="col-span-4 max-md:aspect-[5/2] md:col-span-3 lg:col-span-4" />
        <div className="col-span-4 self-center md:col-span-5 lg:col-span-7 lg:col-start-6">{text}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-start sm:gap-6", className)}>
      {plate ? (
        <BlankPlate label={plate} square className="w-24 shrink-0" />
      ) : icon ? (
        <span
          aria-hidden="true"
          className="grid size-13 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-2 [&_svg]:size-[22px]"
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">{text}</div>
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

/**
 * An article section heading (course page, expert profile): a hairline rule,
 * then the mono gold number and the h2 on one baseline, number first — the
 * prototype's `.sec-h`. Pages compute the numbers from the sections they
 * render, so dropping an empty one never leaves a gap.
 */
export function SecHead({
  number,
  title,
  id,
  className,
}: {
  number: string;
  title: string;
  id: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-4 border-t border-line-strong pt-3.5", className)}>
      <p className="t-kicker shrink-0 text-gold-ink" aria-hidden="true">
        {number}
      </p>
      {/* min-w-0: a long title wraps inside the row instead of pushing it wider. */}
      <h2 id={id} className="t-display-m min-w-0">
        {title}
      </h2>
    </div>
  );
}

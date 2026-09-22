import type { CourseLevel } from "@/features/course/types";
import { cn } from "@/lib/utils/cn";

/** Level meter: three rising bars filled to the level; "all levels" fills all three, softer. */
export const LEVEL_BARS: Record<CourseLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  ALL: 0,
};

export function LevelMeter({ level, className }: { level: CourseLevel; className?: string }) {
  return (
    <span className={cn("lvl", className)} data-l={LEVEL_BARS[level] ?? 0} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

const STAR_PATH =
  "M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z";

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d={STAR_PATH} />
    </svg>
  );
}

/** Five stars, rounded to the nearest whole star, announced as one value. */
export function Stars({ value, label, large }: { value: number; label: string; large?: boolean }) {
  const filled = Math.round(value);
  return (
    <span className={cn("stars", large && "lg")} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden className={i <= filled ? undefined : "off"}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/** Small label with the gold rule before it. */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("kicker", className)}>
      <span className="rule" />
      {children}
    </p>
  );
}

/** A compact row for "nothing here yet" inside a page section — never a big empty box. */
export function SoftEmpty({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="soft-empty">
      <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-surface text-ink-3 shadow-[0_0_0_1px_var(--line)]">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        {hint ? <p className="mt-0.5 text-[15px] text-ink-2">{hint}</p> : null}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils/cn";

export type SegmentedOption = { value: string; label: string; count?: string; disabled?: boolean };

/**
 * A segmented control (Format: Hamısı / Onlayn / Əyani): a group of toggle
 * buttons with `aria-pressed`, the active one a solid ink pill (paper on ink
 * at night), like the category chip and the view toggle. A card chip on the
 * paper-2 track was 1.08:1 at night, so the state hung on a faint ring.
 */
export function Segmented({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex gap-0.5 rounded-full bg-paper-2 p-[3px]", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={o.disabled && !on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[15px] font-medium whitespace-nowrap text-ink-2 transition-colors duration-(--dur-1) hover:text-ink",
              "disabled:cursor-default disabled:opacity-40 disabled:hover:text-ink-2",
              on && "bg-ink text-paper hover:text-paper",
            )}
          >
            <span>{o.label}</span>
            {o.count ? (
              <span className={cn("font-mono text-xs text-ink-3", on && "text-paper opacity-75")}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

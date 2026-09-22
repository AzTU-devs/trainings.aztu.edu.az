"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/i18n/client";

/**
 * A read-only rating as five stars, filled to the exact value: 4,5 fills four
 * and a half, so it never reads as a perfect score (rounding did). Each star
 * is an outline with a gold copy on top, clipped from the right to the part
 * that is filled. Empty outlines are ink-3, which keeps 3:1 against paper by
 * day and at night (line-2 did not).
 */
export function Stars({
  value,
  size = 16,
  label,
  className,
}: {
  value: number;
  size?: number;
  /** Read out instead of five separate icons, e.g. "4 out of 5 stars". */
  label?: string;
  className?: string;
}) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("inline-flex gap-0.5", className)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        // The share of this star that is filled, in whole percent so server
        // and browser print the same clip-path.
        const pct = Math.round(Math.min(1, Math.max(0, (Number(value) || 0) - i)) * 100);
        return (
          <span key={i} aria-hidden="true" className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 size-full fill-none text-ink-3" />
            {pct > 0 ? (
              <Star
                className="absolute inset-0 size-full fill-current text-gold-ink"
                style={pct < 100 ? { clipPath: `inset(0 ${100 - pct}% 0 0)` } : undefined}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

/**
 * The rating control: five buttons, the chosen one aria-pressed, so a screen
 * reader announces which rating is set ("4 ulduz, pressed") and not only the
 * five labels. The row is a named group ("Qiymətləndirməniz").
 */
export function StarsInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const t = useT();
  const [hover, setHover] = useState(0);
  return (
    <div role="group" aria-label={t("review.rating")} className="inline-flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const filled = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="grid size-11 place-items-center rounded-full transition-[transform,background-color] duration-(--dur-1) hover:scale-110 hover:bg-paper-2 motion-reduce:hover:scale-100"
            aria-label={t("review.starLabel", { count: n })}
            aria-pressed={n === value}
          >
            <Star
              aria-hidden
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors duration-(--dur-1)",
                // ink-3, not line-2: an empty star is part of a control and needs 3:1.
                filled ? "fill-current text-gold-ink" : "fill-none text-ink-3",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

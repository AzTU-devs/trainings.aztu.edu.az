"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/i18n/client";

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
        const filled = i < Math.round(value);
        return (
          <Star
            key={i}
            aria-hidden
            style={{ width: size, height: size }}
            className={
              filled
                ? "fill-gold-500 text-gold-500"
                : "fill-muted text-muted-foreground/35"
            }
          />
        );
      })}
    </div>
  );
}

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
    <div className="inline-flex gap-1">
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
            className="grid size-10 place-items-center rounded-full transition-[transform,background-color] duration-200 hover:scale-110 hover:bg-gold-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("review.starLabel", { count: n })}
          >
            <Star
              aria-hidden
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors duration-200",
                filled
                  ? "fill-gold-500 text-gold-500"
                  : "fill-muted text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Stars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={
              filled
                ? "fill-gold-500 text-gold-500"
                : "text-muted-foreground/40"
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
            className="rounded-md p-0.5 transition-transform hover:scale-110"
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={
                filled
                  ? "fill-gold-500 text-gold-500"
                  : "text-muted-foreground/40"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

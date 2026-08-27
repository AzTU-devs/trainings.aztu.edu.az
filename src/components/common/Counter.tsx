"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

/**
 * Counts up to a number on mount. Accepts an optional prefix / suffix (e.g.
 * "+", "K+") and decimal precision so values like "12K+" or "4.8" animate
 * cleanly. Driven by motion's `animate()` so it stays smooth and settles
 * reliably.
 *
 * Under reduced motion the final value is *derived* rather than pushed into
 * state from the effect — the effect simply never runs an animation — so the
 * component never triggers a cascading render just to skip the animation.
 */
export function Counter({
  to,
  durationMs = 1600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, to, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setAnimated,
    });
    return () => controls.stop();
  }, [to, durationMs, reduce]);

  const value = reduce ? to : animated;

  return (
    <span className={className}>
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Shield } from "@/components/layout/AztuMark";
import s from "./Ticker.module.css";

/** Items per copy of the loop: enough that one copy is wider than a 1440 screen. */
const MIN_ITEMS = 8;

/**
 * The band of short, true statements between the cover story and the navy
 * spread. The page decides which statements hold today and passes them in.
 *
 * Screen readers get each statement once: the repeats that pad a short list
 * out to a full loop, and the whole second copy the -50% slide needs, are
 * aria-hidden. The button pauses the motion (WCAG 2.2.2); its name stays the
 * same and `aria-pressed` carries the state, as a toggle button should.
 */
export function Ticker({ items, label, pauseLabel }: { items: string[]; label: string; pauseLabel: string }) {
  const [paused, setPaused] = useState(false);
  if (!items.length) return null;

  const repeats = Math.max(0, Math.ceil(MIN_ITEMS / items.length) - 1);
  const run = (keyPrefix: string) =>
    items.map((text, i) => (
      <span key={`${keyPrefix}${i}`} className={s.item}>
        {text}
        <Shield className={s.mark} />
      </span>
    ));
  const padding = Array.from({ length: repeats }, (_, r) => run(`p${r}-`));

  return (
    <div role="marquee" aria-label={label} className={cn(s.band, paused && s.paused)}>
      <div className={s.track}>
        <div className={s.copy}>
          {run("a")}
          {padding.length ? <span aria-hidden="true" className="contents">{padding}</span> : null}
        </div>
        <div className={s.copy} aria-hidden="true">
          {run("b")}
          {padding}
        </div>
      </div>
      <button
        type="button"
        className={s.toggle}
        aria-pressed={paused}
        aria-label={pauseLabel}
        onClick={() => setPaused((p) => !p)}
      >
        {paused ? (
          <Play aria-hidden="true" fill="currentColor" strokeWidth={1.75} />
        ) : (
          <Pause aria-hidden="true" fill="currentColor" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}

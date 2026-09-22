import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./detail.module.css";

export type SpecFact = {
  /** Stable React key (the fact's kind, e.g. "format"). */
  id: string;
  label: string;
  value: string;
  /** The small grey line under the value ("5 modul", "ödəniş tələb olunmur"). */
  sub?: string | null;
};

/**
 * The course's facts as one ruled strip under the title: two columns on
 * phones, one row from 1024px. The page passes only the facts the course
 * actually has, so a new course never shows a 0 or a dash.
 */
export function SpecStrip({ facts, className }: { facts: SpecFact[]; className?: string }) {
  if (!facts.length) return null;
  return (
    <dl
      className={cn(styles.spec, className)}
      style={{ "--spec-cols": facts.length } as CSSProperties}
    >
      {facts.map((f) => (
        <div key={f.id}>
          <dt className="t-kicker">{f.label}</dt>
          <dd>
            {f.value}
            {f.sub ? <small>{f.sub}</small> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

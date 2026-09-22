import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type KickerTone = "ink-2" | "ink-3" | "gold" | "cat";

const TONES: Record<KickerTone, string> = {
  "ink-2": "text-ink-2",
  "ink-3": "text-ink-3",
  gold: "text-gold-ink",
  // .cat-k draws the 10px category swatch before the text and colours it
  // with --cat-ink, so it needs an ancestor (or itself) carrying data-cat.
  cat: "cat-k",
};

/**
 * The mono micro label (Plex Mono 500, 12px, uppercase, 0.08em). Pass the text
 * in sentence case: CSS uppercases it, which applies the Azerbaijani mapping
 * (i → İ) because <html lang="az"> is set. Never uppercase it in JS.
 */
export function Kicker({
  as: Tag = "p",
  tone = "ink-3",
  id,
  className,
  children,
}: {
  as?: "p" | "span" | "h2" | "h3" | "dt" | "div";
  tone?: KickerTone;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className={cn("t-kicker", TONES[tone], className)}>
      {children}
    </Tag>
  );
}

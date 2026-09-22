import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The numbered department opener ("01 — Yeni kurslar"): a 1px ink rule, the
 * mono gold number and the mono label, with an optional aside on the right (a
 * LinkGo or a mono count). Section numbers are computed by the page from the
 * sections it actually renders, never hard-coded.
 *
 * `aside` is rendered as given: pass `<LinkGo className="t-small">` for a
 * link, or `<Kicker>` for a mono count.
 *
 * On a narrow phone, when a long label and the aside cannot share the row
 * even with the label wrapped, the aside drops under it, right-aligned (the
 * `.dept` rule in globals.css), so the row never pushes the page sideways.
 *
 * `tone="spread"` is for the one navy spread: the rule, label and number take
 * the spread's own colours.
 */
export function Dept({
  number,
  label,
  id,
  as: Tag = "h2",
  aside,
  tone = "paper",
  className,
}: {
  number: string;
  /** Usually a dictionary string; a node when part of it needs its own `lang`. */
  label: ReactNode;
  id?: string;
  as?: "h2" | "span" | "p";
  aside?: ReactNode;
  tone?: "paper" | "spread";
  className?: string;
}) {
  const spread = tone === "spread";
  return (
    <div className={cn("dept", spread && "border-t-spread-line", className)}>
      <Tag id={id} className={cn("dept-l t-kicker", spread && "text-spread-2")}>
        <b className={cn(spread && "text-spread-gold")}>{number}</b>
        <span>{label}</span>
      </Tag>
      {aside ? (
        <div className={cn("ml-auto min-w-0 max-w-full", spread && "text-spread-2")}>{aside}</div>
      ) : null}
    </div>
  );
}

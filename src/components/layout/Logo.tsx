import { cn } from "@/lib/utils/cn";
import { Shield } from "./AztuMark";

/**
 * The brand lock-up: the shield, then "AZTU" in mono gold above "EduPlatform"
 * in Fraunces. In the header the shield steps down from 37px to 31px once the
 * page scrolls (`html.hdr-stuck`), in step with the bar condensing.
 *
 * The props of the previous logo are kept (`showText`, `variant`) so existing
 * callers compile; `variant="mark"` is the shield alone.
 */
export function Logo({
  className,
  showText = true,
  variant = "auto",
  tone = "auto",
}: {
  className?: string;
  showText?: boolean;
  variant?: "auto" | "light" | "dark" | "mark";
  /** `onDeep` recolours it for the navy spread (the auth panel). */
  tone?: "auto" | "onDeep";
}) {
  const deep = tone === "onDeep";
  const shield = (
    <Shield
      className={cn(
        "h-[37px] w-5 transition-[height,width] duration-(--dur-2) ease-out [.hdr-stuck_&]:h-[31px] [.hdr-stuck_&]:w-[17px]",
        deep ? "text-spread-ink" : "text-shield",
      )}
    />
  );
  if (variant === "mark" || !showText) {
    return <span className={cn("inline-flex items-center", className)}>{shield}</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {shield}
      <span className="grid leading-none">
        <span
          className={cn(
            "mb-1 font-mono text-xs font-medium tracking-[0.2em] uppercase",
            deep ? "text-spread-gold" : "text-gold-ink",
          )}
        >
          AzTU
        </span>
        <span
          className={cn(
            "font-display text-[1.3125rem] font-[540] tracking-[-0.02em] [font-variation-settings:'SOFT'_50,'opsz'_36]",
            deep ? "text-spread-ink" : "text-head",
          )}
        >
          EduPlatform
        </span>
      </span>
    </span>
  );
}

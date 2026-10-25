import { cn } from "@/lib/utils/cn";
import { AztuMark } from "./AztuMark";

/**
 * The site's brand block: the AzTU lockup, then the product name. The lockup
 * already says "AZTU", so the name beside it is just "EduPlatform".
 * Styled by `.brand` in globals.css; `size="lg"` is the footer and the
 * sign-in panel's larger setting. Callers wrap it in their own link.
 */
export function Logo({
  className,
  showText = true,
  size = "md",
  fetchPriority,
}: {
  className?: string;
  showText?: boolean;
  size?: "md" | "lg";
  fetchPriority?: "high" | "low" | "auto";
}) {
  return (
    <span className={cn("brand", size === "lg" && "lg", className)}>
      <AztuMark fetchPriority={fetchPriority} />
      {showText ? <span className="wm">EduPlatform</span> : null}
    </span>
  );
}

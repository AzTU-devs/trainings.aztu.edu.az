import { cn } from "@/lib/utils/cn";
import { AztuMark } from "./AztuMark";

export function Logo({
  className,
  showText = true,
  variant = "auto",
  tone = "auto",
}: {
  className?: string;
  showText?: boolean;
  variant?: "auto" | "light" | "dark" | "mark";
  /** `onDeep` inverts the wordmark for the navy canvas. */
  tone?: "auto" | "onDeep";
}) {
  const mark = <AztuMark tone={tone === "onDeep" ? "onDeep" : "auto"} className="size-9" />;

  if (variant === "mark") {
    return <span className={cn("inline-flex items-center", className)}>{mark}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark}
      {showText ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-[9px] font-semibold uppercase tracking-[0.22em]",
              tone === "onDeep" ? "text-gold-300" : "text-gold-700 dark:text-gold-400",
            )}
          >
            AzTU
          </span>
          <span
            className={cn(
              "font-display text-[15px] leading-tight tracking-tight",
              tone === "onDeep" ? "text-white" : "text-foreground",
            )}
          >
            EduPlatform
          </span>
        </span>
      ) : null}
    </span>
  );
}

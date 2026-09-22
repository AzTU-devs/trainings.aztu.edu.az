import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The newspaper dateline under the header: a row of mono items between the top
 * of the page and an ink rule. With three items the middle one is dropped on
 * phones, where there is room for two.
 */
export function Dateline({ items, className }: { items: ReactNode[]; className?: string }) {
  const shown = items.filter((item) => item !== null && item !== undefined && item !== false && item !== "");
  return (
    <div
      className={cn(
        "t-kicker flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line-strong py-3 text-ink-2",
        className,
      )}
    >
      {shown.map((item, i) => (
        <span
          key={i}
          className={cn("min-w-0", shown.length === 3 && i === 1 && "hidden md:inline")}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

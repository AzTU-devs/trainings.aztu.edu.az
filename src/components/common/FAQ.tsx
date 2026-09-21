"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type FaqItem = { q: string; a: string };

export function FAQ({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const open = openIdx === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          // Each question is its own rounded card; the open one lifts and
          // takes a navy hairline so it is obvious which answer you are on.
          <div
            key={i}
            className={cn(
              "rounded-3xl border bg-card transition-[border-color,box-shadow] duration-300",
              open
                ? "border-navy-200/80 elev-2 dark:border-navy-700/70"
                : "border-border/80 elev-1 hover:border-navy-200/60 dark:hover:border-navy-800",
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center justify-between gap-5 rounded-3xl px-5 py-5 text-left sm:px-6"
                aria-expanded={open}
                aria-controls={panelId}
              >
                <span className="font-display text-base leading-snug sm:text-[17px]">{item.q}</span>
                <span
                  aria-hidden
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl transition-[transform,background-color,color] duration-300",
                    open
                      ? "rotate-45 bg-primary text-primary-foreground"
                      : "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
                  )}
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            {/* A CSS grid row animates from 0fr to 1fr, so the panel slides
                open without needing a measured pixel height. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                {/* Full card width: only the question row needs room for the
                    toggle, and on a phone that strip would waste a fifth of
                    the line. */}
                <p className="px-5 pb-6 text-[15px] leading-relaxed text-muted-foreground sm:px-6">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

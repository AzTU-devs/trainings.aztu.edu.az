"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type FaqItem = { q: string; a: string };

export function FAQ({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {items.map((item, i) => {
        const open = openIdx === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={i}>
            <h3>
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-accent/50"
                aria-expanded={open}
                aria-controls={panelId}
              >
                <span className="font-medium leading-snug">{item.q}</span>
                <span
                  aria-hidden
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border border-border transition-[transform,background-color,border-color,color] duration-300",
                    open
                      ? "rotate-45 border-gold-500/40 bg-gold-500/15 text-gold-700 dark:text-gold-300"
                      : "text-muted-foreground",
                  )}
                >
                  <Plus className="size-3.5" />
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
                <p className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
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

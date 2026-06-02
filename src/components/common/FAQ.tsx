"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type FaqItem = { q: string; a: string };

export function FAQ({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={open}
            >
              <span className="font-medium">{item.q}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
            {open ? (
              <div className="px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

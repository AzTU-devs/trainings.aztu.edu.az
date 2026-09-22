"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { CategoryChip } from "@/components/ui/chip";
import type { CategoryRef } from "@/features/category/style";
import s from "./catalogue.module.css";

export type CategoryChipItem = {
  /** Already localised: the current URL with `categoryId` set (or removed) and `page` dropped. */
  href: string;
  /** null = the "Hamısı" chip. */
  category: CategoryRef | null;
  label: string;
  count?: string;
  current: boolean;
  disabled: boolean;
};

/**
 * The category chips under the page head: "Hamısı", then every category that
 * has courses, each a link that sets (or, on the current one, clears) the
 * category, like the former sidebar's toggle. A chip whose count the other
 * filters bring to 0 stays visible but dashed and inert. On phones the row
 * scrolls sideways; this client shell only brings the current chip into view,
 * the chips themselves are plain links.
 */
export function CategoryChips({
  items,
  label,
  className,
}: {
  items: CategoryChipItem[];
  /** The nav's accessible name ("Sahələr"). */
  label: string;
  className?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const currentId = items.find((i) => i.current)?.category?.id ?? "";

  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const on = nav.querySelector<HTMLElement>('[aria-current="true"]');
    if (!on) return;
    const pad = parseFloat(getComputedStyle(nav).paddingLeft) || 0;
    nav.scrollLeft = Math.max(0, on.offsetLeft - pad);
  }, [currentId]);

  return (
    <nav ref={navRef} aria-label={label} className={cn(s.rail, "relative", className)}>
      {items.map((i) => (
        <CategoryChip
          key={i.category?.id ?? "all"}
          href={i.href}
          category={i.category}
          label={i.label}
          count={i.count}
          current={i.current}
          disabled={i.disabled}
          className="max-w-[min(100%,26rem)]"
        />
      ))}
    </nav>
  );
}

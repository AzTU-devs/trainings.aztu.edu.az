"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type AccordionItem = {
  id: string;
  title: ReactNode;
  /** module variant: the mono gold label, e.g. "Modul 01" (uppercased by CSS). */
  number?: string;
  /** module variant: the right-hand meta, e.g. "6 dərs · 1 s 20 dəq". */
  meta?: ReactNode;
  content: ReactNode;
};

/**
 * The editorial accordion: a top ink rule, hairline rows, a Fraunces question
 * (`faq`) or a module row (`module`: mono number · title · meta), and the ±
 * circle. Each header is an h3 > button with aria-expanded / aria-controls;
 * each panel a region labelled by its button. Panels animate 0fr → 1fr and
 * leave the tab order while closed.
 *
 * `toggleAll` adds an "expand all / collapse all" link above the list, with
 * `summary` (e.g. "8 modul · 42 dərs") on its left.
 */
export function Accordion({
  items,
  defaultOpen = [],
  variant = "faq",
  toggleAll,
  summary,
  className,
}: {
  items: AccordionItem[];
  defaultOpen?: string[];
  variant?: "faq" | "module";
  toggleAll?: { openLabel: string; closeLabel: string };
  summary?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen));
  const base = useId();
  const allOpen = items.length > 0 && items.every((it) => open.has(it.id));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={className}>
      {toggleAll || summary ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          {summary ? <div className="t-small text-ink-2">{summary}</div> : <span />}
          {toggleAll ? (
            <button
              type="button"
              className="link t-small"
              aria-expanded={allOpen}
              onClick={() => setOpen(allOpen ? new Set() : new Set(items.map((it) => it.id)))}
            >
              {allOpen ? toggleAll.closeLabel : toggleAll.openLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="acc">
        {items.map((it) => {
          const isOpen = open.has(it.id);
          const btnId = `${base}-b-${it.id}`;
          const panelId = `${base}-p-${it.id}`;
          return (
            <div key={it.id} className={cn("acc-item", isOpen && "open")}>
              <h3>
                <button
                  id={btnId}
                  type="button"
                  className={cn("acc-btn", variant === "module" && "mod-btn")}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(it.id)}
                >
                  {variant === "module" && it.number ? <span className="mn">{it.number}</span> : null}
                  <span className="q">{it.title}</span>
                  {variant === "module" ? <span className="mm">{it.meta}</span> : null}
                  <span className="pm" aria-hidden="true" />
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={btnId} className="acc-panel">
                <div>{variant === "faq" ? <div className="t-body max-w-[62ch] pb-7">{it.content}</div> : it.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

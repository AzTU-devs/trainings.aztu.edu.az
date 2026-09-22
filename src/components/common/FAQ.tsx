"use client";

import { Accordion } from "./Accordion";

export type FaqItem = { q: string; a: string };

/** Frequently asked questions: the editorial accordion, first answer open. */
export function FAQ({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <Accordion
      className={className}
      variant="faq"
      defaultOpen={items.length ? ["0"] : []}
      items={items.map((item, i) => ({ id: String(i), title: item.q, content: <p>{item.a}</p> }))}
    />
  );
}

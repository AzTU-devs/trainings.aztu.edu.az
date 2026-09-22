"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./detail.module.css";

export type TocItem = { id: string; title: string; number: string };

/**
 * "On this page", under the enrol card in the rail: one link per rendered
 * section, the section being read marked with a gold rule and
 * aria-current="location". The band 30%–40% from the top of the viewport is
 * the reading line; whichever section crosses it is current.
 */
export function CourseToc({ items, label, className }: { items: TocItem[]; label: string; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  // A stable dependency: the list comes from the server and never changes
  // after mount, but its array identity is new on every render.
  const ids = items.map((it) => it.id).join(" ");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = ids
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  // On a short screen the list scrolls inside the rail (the enrol card keeps
  // its room): keep the current entry in sight without moving the page.
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !link || nav.scrollHeight <= nav.clientHeight) return;
    const top = link.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop;
    if (top < nav.scrollTop || top + link.offsetHeight > nav.scrollTop + nav.clientHeight) {
      nav.scrollTop = Math.max(0, top - (nav.clientHeight - link.offsetHeight) / 2);
    }
  }, [active]);

  // Which edges of the list are cut off while it scrolls inside the rail:
  // they fade out (detail.module.css), so a clipped list reads as "more".
  const [fade, setFade] = useState<"top" | "bottom" | "both" | undefined>(undefined);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const above = nav.scrollTop > 2;
      const below = nav.scrollTop + nav.clientHeight < nav.scrollHeight - 2;
      setFade(above && below ? "both" : above ? "top" : below ? "bottom" : undefined);
    };
    measure();
    nav.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(nav);
    return () => {
      nav.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, []);

  if (!items.length) return null;
  return (
    <nav
      ref={navRef}
      aria-label={label}
      data-fade={fade}
      className={cn(styles.toc, "pl-4", className)}
    >
      {items.map((it) => (
        <a key={it.id} href={`#${it.id}`} aria-current={active === it.id ? "location" : undefined}>
          {it.title}
          <span aria-hidden="true">{it.number}</span>
        </a>
      ))}
    </nav>
  );
}

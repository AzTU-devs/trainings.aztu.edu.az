"use client";

import { useEffect, useState } from "react";

/**
 * The course page's in-page tabs. They follow the section in view (scroll-
 * spy); each is an ordinary #anchor link, so they work without JavaScript.
 */
export function CourseTabs({ tabs, label }: { tabs: { id: string; label: string; count?: number | null }[]; label: string }) {
  const [current, setCurrent] = useState(tabs[0]?.id);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    tabs.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [tabs]);
  return (
    <nav
      className="sticky top-[60px] z-30 -mx-5 mt-10 border-b border-line bg-[color-mix(in_oklch,var(--paper)_90%,transparent)] px-5 backdrop-blur-md sm:mx-0 sm:px-0"
      aria-label={label}
    >
      <div className="ptabs">
        {tabs.map((t) => (
          <a key={t.id} href={`#${t.id}`} aria-current={current === t.id ? "true" : undefined}>
            {t.label}
            {t.count ? <small>{t.count}</small> : null}
          </a>
        ))}
      </div>
    </nav>
  );
}

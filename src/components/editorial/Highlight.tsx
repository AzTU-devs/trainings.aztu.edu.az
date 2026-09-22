"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The one italic word with the gold highlighter (hero, closing call to action
 * only). The server and the browser print the same markup — `data-pre` holds
 * the band at 0% — and an IntersectionObserver removes it the first time the
 * word is in view, which runs the CSS sweep once. Under reduced motion, or
 * without IntersectionObserver, it is removed at mount and the band is simply
 * there.
 */
export function Highlight({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      el.removeAttribute("data-pre");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.removeAttribute("data-pre");
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <em ref={ref} className="hl" data-pre="">
      {children}
    </em>
  );
}

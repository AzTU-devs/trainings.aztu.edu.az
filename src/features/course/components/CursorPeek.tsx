"use client";

import { useEffect, useRef } from "react";

/**
 * A cursor-following preview of the hovered row's cover in the catalogue's
 * list view. It clones the row's already-rendered `.thumb .cover` markup, so
 * the poster is never drawn twice in the browser. Only for fine pointers that
 * can hover and without reduced motion (the CSS also hides it otherwise);
 * decorative, so hidden from assistive tech.
 */
export function CursorPeek({ listId }: { listId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const peek = ref.current;
    const list = document.getElementById(listId);
    if (!peek || !list) return;
    const ok = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!ok.matches) return;

    let current: Element | null = null;
    let frame = 0;
    let x = 0;
    let y = 0;

    const place = () => {
      frame = 0;
      peek.style.setProperty("--x", `${Math.min(x + 28, window.innerWidth - 300)}px`);
      peek.style.setProperty("--y", `${y - 110}px`);
    };
    const hide = () => {
      peek.classList.remove("on");
      current = null;
    };
    const onMove = (e: PointerEvent) => {
      const row = (e.target as Element | null)?.closest?.("[data-peek]") ?? null;
      if (!row) return hide();
      if (row !== current) {
        current = row;
        const cover = row.querySelector(".thumb .cover");
        peek.replaceChildren(...(cover ? [cover.cloneNode(true)] : []));
      }
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(place);
      peek.classList.add("on");
    };

    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerleave", hide);
    return () => {
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", hide);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [listId]);

  return <div ref={ref} className="peek" aria-hidden="true" />;
}

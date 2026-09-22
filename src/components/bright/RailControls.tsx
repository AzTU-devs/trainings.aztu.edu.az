"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Previous / next buttons for a horizontal rail (`.scroller`). Each press
 * scrolls most of a screen's width; a button is disabled at its end.
 */
export function RailControls({ target, prev, next }: { target: string; prev: string; next: string }) {
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const rail = document.getElementById(target);
    if (!rail) return;
    const update = () =>
      setEdge({
        start: rail.scrollLeft < 4,
        end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4,
      });
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [target]);
  const go = (dir: number) => {
    const rail = document.getElementById(target);
    if (!rail) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <div className="hidden gap-2 md:flex">
      <button className="btn-icon line" type="button" aria-label={prev} disabled={edge.start} onClick={() => go(-1)}>
        <ChevronLeft className="i" aria-hidden />
      </button>
      <button className="btn-icon line" type="button" aria-label={next} disabled={edge.end} onClick={() => go(1)}>
        <ChevronRight className="i" aria-hidden />
      </button>
    </div>
  );
}

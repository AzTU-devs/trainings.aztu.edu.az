"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Scroll-reveal primitives.
 *
 * Design goals:
 *  - SSR / no-JS / reduced-motion → content is fully visible (never hidden).
 *  - With JS → elements below the fold start hidden (set before first paint)
 *    and fade/slide in when they scroll into view. Anything already inside
 *    the viewport at mount is never hidden: hiding it would flash visible →
 *    hidden → visible above the fold.
 *  - Robust: an IntersectionObserver drives the reveal, but a timeout fallback
 *    guarantees content always becomes visible even if the observer never fires.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const OFFSETS = {
  up: "translateY(18px)",
  down: "translateY(-18px)",
  left: "translateX(18px)",
  right: "translateX(-18px)",
  none: "none",
} as const;

type From = keyof typeof OFFSETS;

// useLayoutEffect on the client (to hide before paint), useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Is any part of the element inside the viewport right now? */
function inView(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

function hide(el: HTMLElement, from: From, duration: number, delay: number) {
  el.style.opacity = "0";
  el.style.transform = OFFSETS[from];
  el.style.transition = `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`;
  el.style.willChange = "opacity, transform";
}

function show(el: HTMLElement) {
  el.style.opacity = "1";
  el.style.transform = "none";
}

/** Fade + slide a single block into view as it scrolls into the viewport. */
export function Reveal({
  children,
  from = "up",
  delay = 0,
  duration = 0.8,
  className,
  style,
}: {
  children: ReactNode;
  from?: From;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // Ancient browsers without IntersectionObserver: keep content visible.
    if (!("IntersectionObserver" in window)) return;
    if (inView(el)) return;

    hide(el, from, duration, delay);
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      show(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) reveal();
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // Safety net: if the observer never reports an in-view element as visible,
    // reveal it anyway — but only while it is on screen, so off-screen sections
    // keep their scroll-triggered entrance.
    const fallback = window.setTimeout(() => {
      if (el.getBoundingClientRect().top < window.innerHeight) reveal();
    }, 1400);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [from, delay, duration]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * Reveal a group of children with a staggered cascade. Operates on its direct
 * element children, so wrap each child in <StaggerItem> (or any element).
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  from = "up",
  duration = 0.8,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  from?: From;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!("IntersectionObserver" in window)) return;
    if (inView(el)) return;

    const items = Array.from(el.children) as HTMLElement[];
    items.forEach((child, i) => hide(child, from, duration, i * stagger));

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      items.forEach(show);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) reveal();
      },
      { threshold: 0.05, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    const fallback = window.setTimeout(() => {
      if (el.getBoundingClientRect().top < window.innerHeight) reveal();
    }, 1400);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [from, stagger, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** A single item inside <Stagger>. Renders a plain block; the parent animates it. */
export function StaggerItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

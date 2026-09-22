"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { EnrollCta, type EnrollTarget } from "../EnrollCta";

/**
 * The phone and tablet enrol bar (below 1024px): fixed to the bottom, the
 * price on the left and the call to action on the right.
 *
 * It steps aside while the enrol card's own button (`[data-enrol-cta]`) is on
 * screen, so a phone never shows two primary buttons for the same action. It
 * slides down and becomes inert rather than unmounting: the `enrol-bar` class
 * is also a hook for globals.css, which keeps 80px of bottom padding on the
 * body (the bar never covers the footer's last line) and lifts the toasts
 * above it, and neither should jump when the bar comes and goes.
 */
export function EnrolBar({
  target,
  priceLabel,
  meta,
}: {
  target: EnrollTarget;
  priceLabel: string;
  /** One short line under the price: "26 dərs · 6 s 33 dəq", "3 yer qalıb", "Onlayn kurs". */
  meta: string;
}) {
  // Shown on the server and at first paint; the card's button starts below
  // the title page, well out of view.
  const [stepAside, setStepAside] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // The rail's copy of the card is display:none below 1024px, so it never
    // intersects; from 1024px the bar itself is hidden.
    const ctas = [...document.querySelectorAll<HTMLElement>("[data-enrol-cta]")];
    if (!ctas.length) return;
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onScreen.add(e.target);
        else onScreen.delete(e.target);
      }
      setStepAside(onScreen.size > 0);
    });
    ctas.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      inert={stepAside}
      className={cn(
        "enrol-bar fixed inset-x-0 bottom-0 z-35 flex items-center gap-4 border-t border-line-strong bg-[color-mix(in_srgb,var(--c-paper)_92%,transparent)] px-(--margin) pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-[16px] lg:hidden",
        "transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none",
        stepAside && "translate-y-full opacity-0",
      )}
    >
      <div className="min-w-0">
        <p className="font-display text-2xl leading-none tracking-[-0.02em] text-head">{priceLabel}</p>
        <p className="t-meta mt-1 truncate">{meta}</p>
      </div>
      <EnrollCta
        target={target}
        size="default"
        labelStyle="short"
        hint={false}
        className="ml-auto h-12 shrink-0 px-5 text-[0.9375rem]"
      />
    </div>
  );
}

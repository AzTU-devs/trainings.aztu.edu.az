"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { CatKey } from "@/features/category/style";
import { catAttrs } from "@/features/category/style";
import { LocaleLink } from "@/i18n/LocaleLink";
import { Logo } from "@/components/layout/Logo";
import { EnrollCta, type EnrollTarget } from "../EnrollCta";
import styles from "./detail.module.css";

/**
 * The running head (from 1024px): once the course title has scrolled out of
 * view, a layer over the header's bar shows the category, the title and the
 * call to action, with a gold reading line along its bottom edge.
 *
 * It is an opaque bar over the header's own, laid out like it: the brand
 * sits exactly where the header's brand is (so it stays in place), and the
 * course replaces the nav, search and account buttons, which must not show
 * through. One opaque layer rather than one that starts after the brand: a
 * partial layer leaves a visible seam against the header's translucent paper.
 * While hidden it is `inert` and aria-hidden: nothing in it can be reached.
 */
export function CourseRunningHead({
  cat,
  categoryName,
  title,
  meta,
  target,
}: {
  cat: { key: CatKey; hue?: number } | null;
  categoryName: string | null;
  title: string;
  /** "Pulsuz · 26 dərs" (shown from 1280px). */
  meta: string;
  target: EnrollTarget;
}) {
  const [on, setOn] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const titleEl = document.getElementById("course-title");
    const wide = window.matchMedia("(min-width: 1024px)");
    let frame = 0;
    const update = () => {
      frame = 0;
      setOn(Boolean(titleEl) && wide.matches && titleEl!.getBoundingClientRect().bottom < 0);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      lineRef.current?.style.setProperty("--p", p.toFixed(4));
    };
    // rAF-throttled: at most one layout read per frame, never inside the scroll event.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      {...catAttrs(cat)}
      data-on={on ? "" : undefined}
      className={cn(
        styles.runhead,
        "fixed inset-x-0 top-0 z-50 hidden h-(--hdr) bg-paper lg:block",
      )}
      aria-hidden={on ? undefined : true}
      inert={!on}
    >
      {/* The same box as the header's bar: the brand lands exactly on the
          header's own, and the title where the nav starts. */}
      <div className="wrap flex h-full items-center gap-6">
        <LocaleLink href="/" aria-label="AzTU EduPlatform" className="shrink-0">
          <Logo />
        </LocaleLink>
        <div className="flex min-w-0 flex-1 items-center gap-5 pl-3">
          <p className="grid min-w-0 leading-tight">
            {categoryName ? (
              <span className="t-kicker truncate text-cat-ink">{categoryName}</span>
            ) : null}
            <b className="truncate text-[0.9375rem] font-semibold text-ink">{title}</b>
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-4">
            <span className="t-meta hidden xl:inline">{meta}</span>
            <EnrollCta target={target} size="sm" hint={false} />
          </div>
        </div>
      </div>
      <div
        ref={lineRef}
        aria-hidden="true"
        className={cn(styles.progress, "absolute inset-x-0 -bottom-px h-0.5 bg-gold")}
      />
    </div>
  );
}

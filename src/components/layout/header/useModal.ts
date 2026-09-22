"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for the header's full-screen menu and search overlay, while
 * `open`: focus moves into the dialog (`initialFocus`, else its first
 * control), Tab and Shift+Tab stay inside it, Escape closes it, the page
 * underneath does not scroll, and on close focus returns to `returnFocus` (the
 * button that opened it).
 */
export function useModal({
  open,
  onClose,
  containerRef,
  initialFocusRef,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const returnTo = returnFocusRef?.current ?? null;
    const focusables = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    (initialFocusRef?.current ?? focusables()[0])?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock the page behind the dialog. The lock is on <html> (the scrolling
    // element); where the page has a classic scrollbar its gutter is kept, so
    // the layout does not jump sideways when the bar disappears.
    const root = document.documentElement;
    const prev = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    const hasScrollbar = window.innerWidth > root.clientWidth;
    root.style.overflow = "hidden";
    if (hasScrollbar) root.style.scrollbarGutter = "stable";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = prev.overflow;
      root.style.scrollbarGutter = prev.gutter;
      // Only hand focus back if it is still inside the dialog (or nowhere):
      // a link that navigated away has already moved it on purpose.
      const active = document.activeElement;
      if (!active || active === document.body || container?.contains(active)) returnTo?.focus();
    };
  }, [open, onClose, containerRef, initialFocusRef, returnFocusRef]);
}

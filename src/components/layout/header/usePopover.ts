"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

/**
 * Shared behaviour for header popovers (and the catalogue's dropdowns): an
 * outside press and Escape close it (Escape also returns focus to the
 * trigger), tabbing out of it closes it so a keyboard user never leaves a
 * panel open behind them, and the arrow keys walk the panel's links.
 *
 * Spread `onBlur` on the root that holds both the trigger and the panel.
 */
export function usePopover<TPanel extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<TPanel>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items = () =>
    Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), [role='menuitemradio']:not([aria-disabled='true'])",
      ) ?? [],
    );

  // Arrow keys walk the panel's links, so a long list needs no tabbing.
  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const list = items();
    if (!list.length) return;
    e.preventDefault();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
    list[next]?.focus();
  };

  // ArrowDown on the trigger opens the panel straight onto its first link.
  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    setOpen(true);
    requestAnimationFrame(() => items()[0]?.focus());
  };

  const onBlur = (e: FocusEvent) => {
    // A null relatedTarget is a click on something unfocusable — the outside
    // press handler decides those, so a click inside the panel's padding does
    // not close it.
    if (e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return { open, setOpen, rootRef, triggerRef, panelRef, panelId, onBlur, onPanelKeyDown, onTriggerKeyDown };
}

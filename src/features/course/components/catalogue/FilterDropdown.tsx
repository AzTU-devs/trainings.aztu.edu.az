"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePopover } from "@/components/layout/header/usePopover";
import s from "./catalogue.module.css";

/** One option of a facet, labelled and counted on the server. */
export type FacetOption = {
  value: string;
  label: string;
  /** Formatted count; absent when counts are unknown (a search, a capped walk). */
  count?: string;
  /** The count is known to be 0: the option is shown but cannot be chosen. */
  empty?: boolean;
};

/**
 * A facet: the URL param it writes, its name, the "any" option and the
 * options. Built by the page from the parsed query, so `value` is the value
 * the API actually received ("" = not filtered).
 */
export type FacetGroup = {
  param: "type" | "categoryId" | "level" | "duration" | "rating";
  label: string;
  anyLabel: string;
  anyCount?: string;
  value: string;
  /** The button text while this facet is active (e.g. "4,2 və yuxarı" for a hand-typed floor). */
  valueLabel?: string;
  options: FacetOption[];
};

/** The outlined pill that opens a dropdown or the filter sheet; ink-filled while its filter is active. */
export const DD_BTN =
  "inline-flex h-[42px] items-center gap-2 whitespace-nowrap rounded-full border border-line-2 pr-3 pl-4 text-[15px] font-medium text-ink transition-[border-color,background-color,color] duration-(--dur-1) hover:border-ink [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-ink-3";
export const DD_ON = "border-ink bg-ink text-paper [&>svg]:text-paper/80";

/**
 * A dropdown filter (Səviyyə, Müddət, Reytinq): a pill that opens a panel of
 * single-choice options, each with the number of results it gives. It is a
 * radio set in a menu (`menuitemradio`): arrow keys walk it (usePopover),
 * Escape and an outside press close it, and choosing closes it and hands
 * focus back to the pill. A 0 option is disabled; "İstənilən …" clears.
 */
export function FilterDropdown({
  group,
  onSelect,
  align = "left",
}: {
  group: FacetGroup;
  onSelect: (value: string) => void;
  align?: "left" | "right";
}) {
  const active = group.value !== "";
  const current = group.options.find((o) => o.value === group.value);
  const options: FacetOption[] = [
    { value: "", label: group.anyLabel, count: group.anyCount },
    ...group.options,
  ];

  return (
    <DropdownShell
      label={group.label}
      buttonText={active ? (current?.label ?? group.valueLabel ?? group.label) : group.label}
      active={active}
      align={align}
    >
      {options.map((o) => {
        const checked = o.value === group.value;
        return (
          <button
            key={o.value || "any"}
            type="button"
            role="menuitemradio"
            aria-checked={checked}
            data-close=""
            disabled={Boolean(o.empty && o.value && !checked)}
            onClick={() => {
              if (!checked) onSelect(o.value);
            }}
            className={OPT}
          >
            <RadioDot checked={checked} />
            <span className="min-w-0 flex-1">{o.label}</span>
            {o.count !== undefined ? <span className="font-mono text-xs text-ink-3">{o.count}</span> : null}
          </button>
        );
      })}
    </DropdownShell>
  );
}

export const OPT =
  "flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left text-[15px] text-ink transition-colors duration-(--dur-1) hover:bg-paper-2 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-line-2",
        checked && "border-ink",
      )}
    >
      {checked ? <span className="size-2 rounded-full bg-ink" /> : null}
    </span>
  );
}

/**
 * The popover itself, shared by the option dropdowns and the price panel:
 * the pill, and the floating card under it. The accessible name of the pill
 * is always the facet's name, also while it shows the chosen value.
 */
export function DropdownShell({
  label,
  buttonText,
  active,
  align = "left",
  panelRole = "menu",
  children,
}: {
  label: string;
  buttonText: string;
  active: boolean;
  align?: "left" | "right";
  /** "menu" for option lists; "dialog" for a panel with inputs (price), which a menu may not hold. */
  panelRole?: "menu" | "dialog";
  /** The panel's content. A click on anything marked `data-close` closes the panel. */
  children: ReactNode;
}) {
  const { open, setOpen, rootRef, triggerRef, panelRef, panelId, onBlur, onPanelKeyDown, onTriggerKeyDown } =
    usePopover();
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup={panelRole === "menu" ? "true" : "dialog"}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(DD_BTN, active && DD_ON)}
      >
        {active ? <span className="sr-only">{label}: </span> : null}
        <span className="max-w-[16rem] truncate">{buttonText}</span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn("transition-transform duration-(--dur-2) ease-out", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role={panelRole}
          aria-label={label}
          onKeyDown={onPanelKeyDown}
          onClick={(e) => {
            // Choosing an option closes the panel and hands focus back to the pill.
            if ((e.target as HTMLElement).closest("[data-close]")) close();
          }}
          className={cn(
            s.pop,
            "absolute top-[calc(100%+8px)] z-30 min-w-[260px] rounded-pop bg-card p-2 shadow-pop",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

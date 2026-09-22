"use client";

import { useId, useRef, type ReactNode, type RefObject } from "react";
import { Check, X } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/layout/header/useModal";
import type { FacetGroup } from "./FilterDropdown";
import s from "./catalogue.module.css";

const PILL =
  "inline-flex h-10 max-w-full items-center gap-2 rounded-full border border-line-2 px-3.5 text-[15px] text-ink transition-colors duration-(--dur-1) hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper disabled:cursor-default disabled:opacity-40 disabled:hover:border-line-2";

/**
 * The phones' filter panel: a bottom sheet (dialog, focus kept inside,
 * Escape closes, the page behind does not scroll) with every facet as a row
 * of pills that show their counts. Each pill writes the URL at once, like the
 * desktop controls, so the footer's "{n} kursu göstərin" is always the live
 * result count; it closes the sheet and brings the results into view.
 */
export function FilterSheet({
  open,
  onClose,
  groups,
  total,
  allFree,
  extra,
  returnFocusRef,
  onSelect,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  groups: FacetGroup[];
  /** The current result count (data.totalElements). */
  total: number;
  allFree: boolean;
  /** Anything past the facets (the price window while payments are on). */
  extra?: ReactNode;
  returnFocusRef: RefObject<HTMLElement | null>;
  onSelect: (param: FacetGroup["param"], value: string) => void;
  onClear: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModal({ open, onClose, containerRef, initialFocusRef: closeRef, returnFocusRef });

  if (!open) return null;

  /**
   * Closes the sheet and scrolls to the results, so the visitor sees what
   * their filters did. The scroll waits a frame for the sheet to unmount and
   * the page to unlock, otherwise it would aim at a layout about to change.
   */
  const showResults = () => {
    onClose();
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("catalogue-results")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[65]">
      <div aria-hidden="true" onClick={onClose} className={cn(s.scrim, "absolute inset-0 bg-[rgb(14_26_43/0.42)]")} />
      <div
        className={cn(
          s.sheet,
          "absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-sheet bg-paper shadow-pop",
        )}
      >
        <div className="wrap flex w-full items-center justify-between border-b border-line py-4">
          <h2 id={titleId} className="t-title">
            {t("filters.title")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("filters.close")}
            className="-mr-2.5 grid size-11 place-items-center rounded-full text-ink transition-colors duration-(--dur-1) hover:bg-paper-2 [&>svg]:size-5"
          >
            <X aria-hidden="true" strokeWidth={1.75} />
          </button>
        </div>

        <div className="wrap w-full flex-1 overflow-y-auto overscroll-contain pb-4">
          {groups.map((g) => {
            const headId = `${titleId}-${g.param}`;
            const options = [{ value: "", label: g.anyLabel, count: g.anyCount, empty: false }, ...g.options];
            return (
              <div
                key={g.param}
                role="group"
                aria-labelledby={headId}
                className="border-t border-line pt-[18px] pb-5 first:border-t-0"
              >
                <p id={headId} className="t-kicker mb-3 text-ink-3">
                  {g.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => {
                    const on = o.value === g.value;
                    return (
                      <button
                        key={o.value || "any"}
                        type="button"
                        aria-pressed={on}
                        disabled={Boolean(o.empty && o.value && !on)}
                        onClick={() => {
                          if (!on) onSelect(g.param, o.value);
                        }}
                        className={PILL}
                      >
                        <span className="min-w-0 truncate">{o.label}</span>
                        {o.count !== undefined ? (
                          <span className="font-mono text-xs opacity-75">{o.count}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {extra}
          {allFree ? (
            <p className="t-meta flex items-center gap-2 border-t border-line pt-4">
              <Check aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0 text-gold-ink" />
              {t("filters.allFreeNote")}
            </p>
          ) : null}
        </div>

        <div className="wrap flex w-full gap-3 border-t border-line py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={onClear} className="shrink-0">
            {t("filters.clear")}
          </Button>
          <Button onClick={showResults} className="min-w-0 flex-1">
            <span className="truncate">
              {t("filters.showCount", { count: total, n: formatNumber(total, locale) })}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

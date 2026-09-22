"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { PAYMENTS_ENABLED } from "../../payments";
import { DD_BTN, DropdownShell, FilterDropdown, type FacetGroup } from "./FilterDropdown";
import { FilterSheet } from "./FilterSheet";
import { ViewToggle } from "./ViewToggle";
import { useCatalogueParams } from "./useCatalogueParams";
import s from "./catalogue.module.css";

export type CatalogueFacets = {
  type: FacetGroup;
  level: FacetGroup;
  duration: FacetGroup;
  rating: FacetGroup;
  category: FacetGroup;
};

/**
 * The catalogue toolbar, sticky under the site header. Wide screens get the
 * format as a segmented control and level, duration and rating as dropdowns;
 * phones get one "Filtrlər" button that opens the bottom sheet with every
 * facet. Every control writes the URL through useCatalogueParams, exactly as
 * the former sidebar did, and every option carries its live count.
 */
export function FilterBar({
  facets,
  total,
  allFree,
  view,
  className,
}: {
  facets: CatalogueFacets;
  /** The current result count (data.totalElements). */
  total: number;
  /** Every published course is free and payments are off: say so, once. */
  allFree: boolean;
  view: "grid" | "list";
  className?: string;
}) {
  const t = useT();
  const { params, setParam, clearAll, activeCount } = useCatalogueParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTriggerRef = useRef<HTMLButtonElement>(null);
  // The format control answers at once; the server then renders the result.
  const [format, setFormat] = useOptimistic(facets.type.value);
  const [, startTransition] = useTransition();

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const select = useCallback(
    (param: FacetGroup["param"], value: string) => setParam(param, value || null),
    [setParam],
  );

  const chooseFormat = (value: string) =>
    startTransition(() => {
      setFormat(value);
      setParam("type", value || null);
    });

  const typeGroup = facets.type;
  const formatOptions = [
    { value: "", label: typeGroup.anyLabel, count: typeGroup.anyCount },
    ...typeGroup.options.map((o) => ({ value: o.value, label: o.label, count: o.count, disabled: o.empty })),
  ];

  return (
    <>
      <div className={cn(s.toolbar, className)}>
        {/* Phones: 46px controls (thumb-sized, the height of the view toggle)
            on a tighter band, so the sticky bar stays as short as before. */}
        <div className="wrap flex items-center gap-2 py-3 max-sm:py-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Segmented label={typeGroup.label} value={format} onChange={chooseFormat} options={formatOptions} />
            <span aria-hidden="true" className="mx-2 h-6 w-px bg-line-2" />
            <FilterDropdown group={facets.level} onSelect={(v) => select("level", v)} />
            <FilterDropdown group={facets.duration} onSelect={(v) => select("duration", v)} />
            <FilterDropdown group={facets.rating} onSelect={(v) => select("rating", v)} />
            {PAYMENTS_ENABLED ? <PriceDropdown params={params} setParam={setParam} /> : null}
          </div>

          <button
            ref={sheetTriggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
            className={cn(DD_BTN, "max-sm:h-[46px] lg:hidden")}
          >
            <SlidersHorizontal aria-hidden="true" strokeWidth={1.75} />
            {activeCount > 0 ? (
              <>
                <span aria-hidden="true">{t("filters.openCount", { n: activeCount })}</span>
                <span className="sr-only">
                  {t("filters.title")}: {t("filters.activeCount", { count: activeCount })}
                </span>
              </>
            ) : (
              <span>{t("filters.title")}</span>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2">
            {allFree ? (
              <span className="t-meta mr-2 hidden items-center gap-2 xl:inline-flex">
                <Check aria-hidden="true" strokeWidth={1.75} className="size-4 text-gold-ink" />
                {t("filters.allFreeShort")}
              </span>
            ) : null}
            <ViewToggle view={view} />
          </div>
        </div>
      </div>

      {/* Outside the toolbar: its backdrop-filter would otherwise become the
          containing block of the sheet's `position: fixed`. */}
      <FilterSheet
        open={sheetOpen}
        onClose={closeSheet}
        returnFocusRef={sheetTriggerRef}
        groups={[facets.type, facets.level, facets.duration, facets.rating, facets.category]}
        total={total}
        allFree={allFree}
        onSelect={select}
        onClear={clearAll}
        extra={
          PAYMENTS_ENABLED ? (
            <div className="border-t border-line pt-[18px] pb-5">
              <PriceFields params={params} setParam={setParam} />
            </div>
          ) : null
        }
      />
    </>
  );
}

type ParamProps = {
  params: URLSearchParams;
  setParam: (key: string, value: string | null) => void;
};

/**
 * Only while payments are on (see ../../payments.ts): the "free only" switch
 * and the price window the former sidebar offered, with the same params
 * (`free=1`, `priceMin`, `priceMax`) written the same way.
 */
function PriceDropdown({ params, setParam }: ParamProps) {
  const t = useT();
  const active = Boolean(params.get("free") || params.get("priceMin") || params.get("priceMax"));
  return (
    <DropdownShell label={t("filters.price")} buttonText={t("filters.price")} active={active} panelRole="dialog">
      <div className="p-2">
        <PriceFields params={params} setParam={setParam} />
      </div>
    </DropdownShell>
  );
}

function PriceFields({ params, setParam }: ParamProps) {
  const t = useT();
  const free = params.get("free") === "1";
  return (
    <div role="group" aria-label={t("filters.price")}>
      <p className="t-kicker mb-3 text-ink-3">{t("filters.price")}</p>
      <button
        type="button"
        aria-pressed={free}
        onClick={() => setParam("free", free ? null : "1")}
        className="inline-flex h-10 items-center rounded-full border border-line-2 px-3.5 text-[15px] text-ink hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
      >
        {t("filters.freeOnly")}
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Input
          type="number"
          inputMode="decimal"
          aria-label={t("filters.min")}
          placeholder={t("filters.min")}
          value={params.get("priceMin") ?? ""}
          onChange={(e) => setParam("priceMin", e.target.value || null)}
          min={0}
        />
        <Input
          type="number"
          inputMode="decimal"
          aria-label={t("filters.max")}
          placeholder={t("filters.max")}
          value={params.get("priceMax") ?? ""}
          onChange={(e) => setParam("priceMax", e.target.value || null)}
          min={0}
        />
      </div>
    </div>
  );
}

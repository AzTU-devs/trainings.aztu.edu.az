"use client";

import { useT } from "@/i18n/client";
import { Chip } from "@/components/ui/chip";
import { Kicker } from "@/components/editorial/Kicker";
import { useCatalogueParams } from "./useCatalogueParams";

export type ActiveFilter = { param: string; label: string };

/**
 * "Seçilib": one removable chip per active filter (the search text included),
 * then "Hamısını təmizləyin". Removing a chip writes the URL exactly like its
 * control does (page dropped, no scroll); "clear all" is the toolbar's
 * clear, which keeps the search text — so it only shows when there is a
 * filter besides the search to clear.
 */
export function ActiveFilters({ items }: { items: ActiveFilter[] }) {
  const t = useT();
  const { setParam, clearAll } = useCatalogueParams();
  if (!items.length) return null;
  const hasFilters = items.some((i) => i.param !== "q");

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-3">
      <Kicker as="span" className="mr-1">
        {t("courses.selected")}
      </Kicker>
      {items.map((i) => (
        <Chip
          key={i.param}
          onRemove={() => setParam(i.param, null)}
          removeLabel={t("ui.removeFilter", { label: i.label })}
          className="max-w-[min(100%,22rem)]"
        >
          {i.label}
        </Chip>
      ))}
      {hasFilters ? (
        <button type="button" onClick={clearAll} className="link t-small py-1.5 sm:ml-2">
          {t("courses.clearAll")}
        </button>
      ) : null}
    </div>
  );
}

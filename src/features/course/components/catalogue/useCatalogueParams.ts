"use client";

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAYMENTS_ENABLED } from "../../payments";

/**
 * Every param the catalogue's controls write. Each one maps to a server-side
 * filter (see ../../filters.ts), so they all combine with each other and with
 * the search box, on every page of the result. The price params only exist
 * while payments are on.
 */
export const FILTER_KEYS: readonly string[] = [
  "type",
  "categoryId",
  "level",
  "rating",
  "duration",
  ...(PAYMENTS_ENABLED ? ["free", "priceMin", "priceMax"] : []),
];

/**
 * The catalogue's URL writes, lifted verbatim from the former FilterSidebar so
 * the contract stays exactly as it was: `router.replace` without scrolling,
 * `page` dropped on every filter change, and "clear" keeping only the search
 * text. The one addition is the presentation-only `view` param (plan D2),
 * which "clear" keeps too — clearing filters is not a request to change how
 * the results are laid out.
 */
export function useCatalogueParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const params = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  // The same router.replace, inside a transition so the page can tell that the
  // server is rendering the new result: the results region is marked busy
  // (and dims) until it arrives, instead of sitting unchanged for a moment.
  const [isPending, startTransition] = useTransition();
  const replace = useCallback(
    (href: string) => startTransition(() => router.replace(href, { scroll: false })),
    [router],
  );
  useEffect(() => {
    const results = document.getElementById("catalogue-results");
    if (!results) return;
    if (isPending) results.setAttribute("aria-busy", "true");
    else results.removeAttribute("aria-busy");
  }, [isPending]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params);
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page");
      replace(`${pathname}?${next.toString()}`);
    },
    [replace, pathname, params],
  );

  const clearAll = useCallback(() => {
    const keep = new URLSearchParams();
    const q = params.get("q");
    if (q) keep.set("q", q);
    const view = params.get("view");
    if (view) keep.set("view", view);
    replace(keep.size ? `${pathname}?${keep.toString()}` : pathname);
  }, [replace, pathname, params]);

  /**
   * Grid or list. Unlike a filter it keeps `page`: the same twelve courses,
   * laid out differently, so the visitor stays where they were.
   */
  const setView = useCallback(
    (view: "grid" | "list") => {
      const next = new URLSearchParams(params);
      if (view === "list") next.set("view", "list");
      else next.delete("view");
      const qs = next.toString();
      replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [replace, pathname, params],
  );

  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  return { params, setParam, clearAll, setView, activeCount };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Info, MapPin, MonitorPlay, SlidersHorizontal, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { LevelMeter, Stars } from "@/components/bright/bits";
import type { CourseLevel } from "../types";

/*
 * The catalogue's filters. Every control maps to a server-side filter in the
 * URL — the same keys parseFiltersFromSearchParams() reads — so they combine
 * with each other and with the search box on every page of results. Changing
 * one drops `page`, since page 3 of the old result means nothing in the new.
 *
 * Desktop: a sticky column beside the results. Phones: a bottom sheet opened
 * from the results toolbar, with the categories inside it too.
 */

/** URL keys the filters own; clearing them keeps the search text. */
const FILTER_KEYS = ["type", "categoryId", "level", "rating", "duration"] as const;

type Category = { id: string; name: string; k: string };

function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const params = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  const set = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params);
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, params],
  );

  const clear = useCallback(() => {
    const keep = new URLSearchParams();
    const q = params.get("q");
    if (q) keep.set("q", q);
    const qs = keep.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, params]);

  const active = FILTER_KEYS.filter((k) => params.get(k)).length;
  return { params, set, clear, active };
}

const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL"];
const DURATIONS = ["lt2", "2to6", "6to17", "gt17"] as const;
const RATINGS = ["4.5", "4", "3.5"] as const;

function Panel({ categories, inSheet }: { categories: Category[]; inSheet?: boolean }) {
  const t = useT();
  const { params, set } = useCatalogParams();
  const type = params.get("type")?.toUpperCase() ?? "";
  const level = params.get("level")?.toUpperCase() ?? "";
  const rating = params.get("rating") ?? "";
  const duration = params.get("duration") ?? "";
  const categoryId = params.get("categoryId") ?? "";
  const name = inSheet ? "s" : "a";

  return (
    <>
      <div className="fgroup">
        <h3>{t("catalog.format")}</h3>
        <div className="seg full lg" role="radiogroup" aria-label={t("catalog.format")}>
          {(
            [
              ["", t("catalog.all"), null],
              ["ONLINE", t("ui.online"), <MonitorPlay key="o" className="i" aria-hidden />],
              ["OFFLINE", t("ui.inPerson"), <MapPin key="p" className="i" aria-hidden />],
            ] as const
          ).map(([v, label, icon]) => (
            <button key={v || "all"} type="button" role="radio" aria-checked={type === v} onClick={() => set("type", v || null)}>
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {inSheet && categories.length ? (
        <div className="fgroup">
          <h3>{t("catalog.category")}</h3>
          <label className="opt">
            <input type="radio" name={`cat-${name}`} checked={!categoryId} onChange={() => set("categoryId", null)} />
            <span>{t("catalog.all")}</span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className={cn("opt", c.k)}>
              <input
                type="radio"
                name={`cat-${name}`}
                checked={categoryId === c.id}
                onChange={() => set("categoryId", c.id)}
              />
              <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-[var(--k-100)]">
                <span className="size-2.5 rounded-[3px] bg-[var(--k-500)]" />
              </span>
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      ) : null}

      <div className="fgroup">
        <h3>{t("catalog.level")}</h3>
        <label className="opt">
          <input type="radio" name={`lvl-${name}`} checked={!level} onChange={() => set("level", null)} />
          <span>{t("catalog.all")}</span>
        </label>
        {LEVELS.map((l) => (
          <label key={l} className="opt">
            <input type="radio" name={`lvl-${name}`} checked={level === l} onChange={() => set("level", l)} />
            <span className="inline-flex items-center gap-2.5">
              <LevelMeter level={l} className="text-ink-2" />
              {t(`ui.level${l === "ALL" ? "All" : l.charAt(0) + l.slice(1).toLowerCase()}`)}
            </span>
          </label>
        ))}
      </div>

      <div className="fgroup">
        <h3>{t("catalog.duration")}</h3>
        <div className="bucket">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={duration === d}
              onClick={() => set("duration", duration === d ? null : d)}
            >
              {t(`catalog.duration_${d}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="fgroup">
        <h3>{t("catalog.rating")}</h3>
        {RATINGS.map((r) => (
          <label key={r} className="opt">
            <input type="radio" name={`rt-${name}`} checked={rating === r} onChange={() => set("rating", r)} />
            <span className="inline-flex items-center gap-2">
              <Stars value={Number(r)} label={t("ui.starsLabel", { value: r.replace(".", ",") })} />
              <span>{t("catalog.ratingAtLeast", { value: Number(r).toFixed(1).replace(".", ",") })}</span>
            </span>
          </label>
        ))}
        <label className="opt">
          <input type="radio" name={`rt-${name}`} checked={!rating} onChange={() => set("rating", null)} />
          <span>{t("catalog.all")}</span>
        </label>
      </div>

      <div className="fgroup">
        <p className="note">
          <Info className="i" aria-hidden />
          <span>{t("catalog.allFree")}</span>
        </p>
      </div>
    </>
  );
}

/** The desktop column. */
export function FilterPanel({ categories }: { categories: Category[] }) {
  const t = useT();
  const { clear, active } = useCatalogParams();
  return (
    <div className="sticky top-[84px]">
      <div className="flex items-center justify-between pb-1">
        <h2 className="t-md">{t("catalog.filters")}</h2>
        {active ? (
          <button type="button" onClick={clear} className="text-[14px] font-semibold text-ink-3 hover:text-ink">
            {t("catalog.clearAll")}
          </button>
        ) : null}
      </div>
      <Panel categories={categories} />
    </div>
  );
}

/** The phone button and bottom sheet. */
export function FilterSheet({ categories, showLabel }: { categories: Category[]; showLabel: string }) {
  const t = useT();
  const { clear, active } = useCatalogParams();
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button className="btn btn-ghost btn-sm lg:hidden" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <SlidersHorizontal className="i" aria-hidden />
        {t("catalog.filters")}
        {active ? (
          <span className="grid size-5 place-items-center rounded-full bg-navy text-[11.5px] text-on-navy">{active}</span>
        ) : null}
      </button>
      <div
        className={cn("sheet bottom lg:hidden", open && "open")}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        inert={!open}
      >
        <div className="scrim" onClick={() => setOpen(false)} />
        <div className="panel">
          <div className="grabber" />
          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 pb-3 pt-2">
            <h2 id="filters-title" ref={titleRef} tabIndex={-1} className="t-lg outline-none">
              {t("catalog.filters")}
            </h2>
            <button className="btn-icon" type="button" onClick={() => setOpen(false)} aria-label={t("catalog.closeFilters")}>
              <X className="i" aria-hidden />
            </button>
          </div>
          <div className="overflow-auto px-5">
            <Panel categories={categories} inSheet />
          </div>
          <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-line bg-paper p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <button type="button" className="btn btn-ghost" onClick={clear}>
              {t("catalog.clear")}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
              {showLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

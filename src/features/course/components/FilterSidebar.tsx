"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Info, SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { PAYMENTS_ENABLED } from "../payments";
import type { DurationBucket } from "../types";

type CategoryOption = { id: string; name: string };

type Props = {
  total: number;
  categories: CategoryOption[];
};

const DURATIONS: readonly { key: DurationBucket; labelKey: string }[] = [
  { key: "lt2", labelKey: "filters.durationLt2" },
  { key: "2to6", labelKey: "filters.duration2to6" },
  { key: "6to17", labelKey: "filters.duration6to17" },
  { key: "gt17", labelKey: "filters.durationGt17" },
];

/**
 * How many categories the wide sidebar lists before folding the rest behind a
 * "More" chip. Enough for the common case, few enough that the whole panel —
 * every filter section — fits a laptop screen without a scroll of its own.
 */
const VISIBLE_CATEGORIES = 4;

// Every control here maps to a server-side filter, so they all combine with each
// other and with the search box, on every page of the result.
const FILTER_KEYS = [
  "type",
  "categoryId",
  "rating",
  "duration",
  ...(PAYMENTS_ENABLED ? ["free", "priceMin", "priceMax"] : []),
];

export function FilterSidebar({ total, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const t = useT();
  const panelId = useId();
  // Below `lg` the filters fold into a single bar so the results start near the
  // top of the screen; the panel opens on demand. From `lg` up it is always
  // open as a sticky sidebar and this state is ignored.
  const [open, setOpen] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  // Wide screens only: whether the categories past the first few are listed.
  // Below `lg` they sit in one horizontally scrolling row and are all there.
  const [allCategories, setAllCategories] = useState(false);

  const params = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params);
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, params],
  );

  const clearAll = () => {
    const keep = new URLSearchParams();
    const q = params.get("q");
    if (q) keep.set("q", q);
    router.replace(keep.size ? `${pathname}?${keep.toString()}` : pathname, {
      scroll: false,
    });
  };

  /**
   * Closes the narrow-screen panel and scrolls to its folded bar, so the
   * visitor sees what their filters did: the bar with its count and active
   * badge, and the results right below it. The scroll waits a frame for the
   * panel to fold, otherwise it would aim at a layout that is about to change.
   */
  const showResults = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      asideRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  const type = params.get("type");
  const categoryId = params.get("categoryId");
  const free = params.get("free") === "1";
  const rating = Number(params.get("rating") || "0");
  const priceMin = params.get("priceMin") ?? "";
  const priceMax = params.get("priceMax") ?? "";
  const duration = params.get("duration");

  // The selected category always stays listed, even when it is past the fold.
  const foldedCategories = allCategories
    ? []
    : categories.filter((c, i) => i >= VISIBLE_CATEGORIES && c.id !== categoryId);
  const folded = new Set(foldedCategories.map((c) => c.id));

  return (
    <aside
      ref={asideRef}
      className={cn(
        // scroll-mt keeps the bar clear of the sticky site header (showResults).
        "scroll-mt-24 rounded-3xl border border-border/80 bg-card elev-1 lg:sticky lg:top-24 lg:self-start",
        // The folded panel fits a laptop screen whole. Only on a short screen,
        // or once every category is listed, can it outgrow the viewport — then
        // the sticky card scrolls on its own so no filter is out of reach.
        "lg:[@media(max-height:820px)]:max-h-[calc(100dvh-7rem)] lg:[@media(max-height:820px)]:overflow-y-auto",
        allCategories && "lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto",
      )}
    >
      {/* Narrow screens: one tappable bar that folds the whole panel. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 rounded-3xl p-2 pr-4 text-left lg:hidden"
      >
        <FilterIcon />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 text-sm font-semibold">
            {t("filters.title")}
            <ActiveBadge count={activeCount} label={t("filters.activeCount", { count: activeCount })} />
          </span>
          <span className="text-xs text-muted-foreground">
            {t("filters.results", { count: total })}
          </span>
        </span>
        <span className="sr-only">{open ? t("filters.hide") : t("filters.show")}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        className={cn(
          "border-t border-border/80 px-4 pt-5 sm:px-5 lg:block lg:border-t-0 lg:px-5 lg:pb-6 lg:pt-5",
          open ? "block" : "hidden",
        )}
      >
        {/* Wide screens: the panel's own heading, with the quick reset. */}
        <div className="mb-5 hidden items-center justify-between gap-3 lg:flex">
          <div className="flex items-center gap-3">
            <FilterIcon />
            <span className="text-base font-semibold">{t("filters.title")}</span>
            <ActiveBadge count={activeCount} label={t("filters.activeCount", { count: activeCount })} />
          </div>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-accent"
            >
              <X className="size-3.5" /> {t("common.clearFilters")}
            </button>
          ) : null}
        </div>

        <div className="space-y-4">
          <Section title={t("filters.mode")}>
            <ChipRow>
              <Chip active={!type} onClick={() => setParam("type", null)}>
                {t("common.all")}
              </Chip>
              <Chip active={type === "ONLINE"} onClick={() => setParam("type", "ONLINE")}>
                {t("common.online")}
              </Chip>
              <Chip
                active={type === "OFFLINE"}
                onClick={() => setParam("type", "OFFLINE")}
              >
                {t("common.offline")}
              </Chip>
            </ChipRow>
          </Section>

          {categories.length > 0 ? (
            <Section
              title={t("filters.category")}
              action={
                foldedCategories.length > 0 || allCategories ? (
                  <button
                    type="button"
                    onClick={() => setAllCategories((v) => !v)}
                    aria-expanded={allCategories}
                    className="-my-1 hidden h-7 items-center gap-0.5 rounded-full px-2.5 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-accent lg:inline-flex dark:text-navy-100"
                  >
                    {allCategories
                      ? t("filters.fewerCategories")
                      : t("filters.moreCategories", { count: foldedCategories.length })}
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        allCategories && "rotate-180",
                      )}
                    />
                  </button>
                ) : null
              }
            >
              <ChipRow scroll>
                <Chip
                  active={!categoryId}
                  onClick={() => setParam("categoryId", null)}
                >
                  {t("common.all")}
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    active={categoryId === c.id}
                    onClick={() =>
                      setParam("categoryId", categoryId === c.id ? null : c.id)
                    }
                    className={folded.has(c.id) ? "lg:hidden" : undefined}
                    title={c.name}
                  >
                    <span className="truncate">{c.name}</span>
                  </Chip>
                ))}
              </ChipRow>
            </Section>
          ) : null}

          <Section title={t("filters.price")} inline={!PAYMENTS_ENABLED}>
            {PAYMENTS_ENABLED ? (
              <>
                <ChipRow>
                  <Chip active={free} onClick={() => setParam("free", free ? null : "1")}>
                    {t("filters.freeOnly")}
                  </Chip>
                </ChipRow>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder={t("filters.min")}
                    value={priceMin}
                    onChange={(e) => setParam("priceMin", e.target.value || null)}
                    min={0}
                    className="h-10 rounded-full"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder={t("filters.max")}
                    value={priceMax}
                    onChange={(e) => setParam("priceMax", e.target.value || null)}
                    min={0}
                    className="h-10 rounded-full"
                  />
                </div>
              </>
            ) : (
              // Nothing is for sale yet, so the catalogue is free courses only: a
              // price window and a "Free only" chip would filter nothing out. Both
              // come back with PAYMENTS_ENABLED (see ../payments.ts). Until then
              // the section is one line, beside its label, not a block of its own.
              <p
                title={t("filters.allFreeNote")}
                className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground"
              >
                <Info aria-hidden className="size-3.5 shrink-0 text-navy-500 dark:text-navy-200" />
                {t("filters.allFreeShort")}
              </p>
            )}
          </Section>

          <Section title={t("filters.rating")}>
            {/* The four thresholds are short, so they share one segmented
                track — one line in the narrowest sidebar instead of two rows
                of chips. Each is still its own toggle. */}
            <div className="grid grid-cols-4 gap-1 rounded-full border border-border bg-card p-1">
              {[4.5, 4, 3.5, 3].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={rating === r}
                  onClick={() => setParam("rating", rating === r ? null : String(r))}
                  className={cn(
                    "inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-full text-[13px] font-medium transition-colors duration-200",
                    rating === r
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  <Star aria-hidden className="size-3.5 shrink-0 fill-gold-500 text-gold-500" />
                  <span aria-hidden>{r}+</span>
                  <span className="sr-only">
                    {t("filters.ratingAndUp", { rating: r })}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title={t("filters.duration")}>
            {/* An even grid rather than a wrapping row: four ranges never fit
                one line of the sidebar, and two equal rows read tidier than
                three chips and a straggler. */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {DURATIONS.map((d) => (
                <Chip
                  key={d.key}
                  active={duration === d.key}
                  onClick={() => setParam("duration", duration === d.key ? null : d.key)}
                  className="justify-center px-3"
                >
                  {t(d.labelKey)}
                </Chip>
              ))}
            </div>
          </Section>
        </div>

        {/* Narrow screens: the panel's own foot stays in reach while the
            visitor works through it, with the way back to the results — which
            also shows, live, how many there are now. Wide screens reset from
            the heading instead. */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center gap-2 rounded-b-3xl border-t border-border/80 bg-card px-4 py-3 sm:-mx-5 sm:px-5 lg:hidden">
          <Button variant="ghost" className="shrink-0 px-4" onClick={clearAll}>
            <X aria-hidden />
            {t("common.clearFilters")}
          </Button>
          <Button className="min-w-0 flex-1" onClick={showResults}>
            <span className="truncate">{t("filters.showResults", { count: total })}</span>
          </Button>
        </div>
      </div>
      {/* When the sticky panel does scroll on its own (see the aside), the
          fade at its foot shows there is more below the fold of the card. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none sticky bottom-0 -mt-8 hidden h-8 rounded-b-3xl bg-gradient-to-t from-card to-transparent",
          "lg:[@media(max-height:820px)]:block",
          allCategories && "lg:block",
        )}
      />
    </aside>
  );
}

function FilterIcon() {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
    >
      <SlidersHorizontal className="size-[18px]" />
    </span>
  );
}

function ActiveBadge({ count, label }: { count: number; label: string }) {
  if (count === 0) return null;
  return (
    <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-primary-foreground">
      <span aria-hidden>{count}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * One filter group under a hairline. `action` sits at the end of the label
 * row; `inline` puts the content on that row too, for a group that is a single
 * short line.
 */
function Section({
  title,
  action,
  inline = false,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  inline?: boolean;
  children: React.ReactNode;
}) {
  const label = (
    <Label className="block text-[13px] font-semibold text-foreground">{title}</Label>
  );
  return (
    <div className="border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
      {inline ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {label}
          {children}
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            {label}
            {action}
          </div>
          {children}
        </>
      )}
    </div>
  );
}

/**
 * A row of chips. `scroll` makes it one horizontally scrolling line below `lg`
 * — bleeding to the card's edges, faded where it runs on — so a long list
 * costs one row of height on a phone; from `lg` up it wraps like the others.
 */
function ChipRow({
  scroll = false,
  children,
}: {
  scroll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-2",
        scroll
          ? "-mx-4 snap-x overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:-mx-5 sm:scroll-px-5 sm:px-5 max-lg:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:snap-start lg:[&>*]:shrink"
          : "flex-wrap",
      )}
    >
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  className,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        "inline-flex h-9 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/60",
        className,
      )}
    >
      {children}
    </button>
  );
}

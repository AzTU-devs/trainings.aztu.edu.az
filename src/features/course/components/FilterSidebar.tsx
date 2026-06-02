"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

type Props = {
  total: number;
  visible: number;
};

const DURATIONS = [
  { key: "lt2", label: "< 2 hours" },
  { key: "2to6", label: "2–6 hours" },
  { key: "6to17", label: "6–17 hours" },
  { key: "gt17", label: "17+ hours" },
] as const;

export function FilterSidebar({ total, visible }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const t = useT();

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

  const activeKeys = ["type", "free", "rating", "priceMin", "priceMax", "duration", "category"];
  const activeCount = activeKeys.filter((k) => params.get(k)).length;

  const type = params.get("type");
  const free = params.get("free") === "1";
  const rating = Number(params.get("rating") || "0");
  const priceMin = params.get("priceMin") ?? "";
  const priceMax = params.get("priceMax") ?? "";
  const duration = params.get("duration");

  return (
    <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold">Filters</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {visible !== total ? (
            <span>
              {visible}/{total}
            </span>
          ) : (
            <span>{total} results</span>
          )}
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              <X className="size-3" /> {t("common.clearFilters")}
            </button>
          ) : null}
        </div>
      </div>

      <Section title="Mode">
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

      <Section title="Price">
        <ChipRow>
          <Chip active={free} onClick={() => setParam("free", free ? null : "1")}>
            Free only
          </Chip>
        </ChipRow>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setParam("priceMin", e.target.value || null)}
            min={0}
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setParam("priceMax", e.target.value || null)}
            min={0}
          />
        </div>
      </Section>

      <Section title="Rating">
        <div className="space-y-1.5">
          {[4.5, 4, 3.5, 3].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setParam("rating", rating === r ? null : String(r))}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                rating === r ? "bg-primary/10 text-primary" : "hover:bg-accent",
              )}
            >
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.floor(r)
                        ? "size-3.5 fill-amber-400 text-amber-400"
                        : "size-3.5 text-muted-foreground/40"
                    }
                  />
                ))}
              </span>
              <span>{r}+</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Duration">
        <div className="space-y-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setParam("duration", duration === d.key ? null : d.key)}
              className={cn(
                "block w-full rounded-md px-2 py-1.5 text-left text-sm",
                duration === d.key
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          (server filter not exposed yet — applied client-side over current page)
        </p>
      </Section>

      <Button variant="outline" size="sm" className="w-full" onClick={clearAll}>
        {t("common.clearFilters")}
      </Button>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 space-y-2 border-b border-border pb-5 last:border-0 last:pb-0">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </Label>
      {children}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

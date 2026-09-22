"use client";

import { useCallback, useId, useOptimistic, useRef, useTransition, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

/*
 * The building and capacity filters of /rooms. Like the course catalogue's
 * filters, every control writes to the URL (`building`, `cap`) and the server
 * page filters the rooms from it, so a filtered list can be shared and
 * reloaded. The kind rail above the results is plain links for the same keys.
 *
 * `router.replace`, not push: flipping filters should not fill the history.
 * While the server renders the new list the controls say so (aria-busy) and
 * rooms-list.css dims the results through the `data-pending` attribute.
 *
 * The capacity steps come from the page, which is the one that validates
 * them: a constant exported from a "use client" module would reach a server
 * component as a client reference, not as the array.
 *
 * The capacity control is a radio group, so it behaves like one: a single
 * tab stop (the checked option) and the arrow keys, Home and End move the
 * choice, as the ARIA radio pattern and native radios do.
 */

type Building = { code: string; name: string };

export function RoomFilters({ buildings, capSteps }: { buildings: Building[]; capSteps: readonly string[] }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const selectId = useId();

  const building = (sp.get("building") ?? "").toUpperCase();
  const cap = sp.get("cap") ?? "";
  // "" is "any"; an unknown ?cap= is treated as "any", as the page does.
  const capOptions = ["", ...capSteps];
  // Checked (and the tab stop) at once, not only when the new list arrives:
  // an arrow key moves focus to the option it picks.
  const [checkedCap, showCap] = useOptimistic(capSteps.includes(cap) ? cap : "");
  const capRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const set = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      startTransition(() => {
        if (key === "cap") showCap(value ?? "");
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [router, pathname, sp, showCap],
  );

  const onCapKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = capOptions.length - 1;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (to === null) return;
    e.preventDefault();
    capRefs.current[to]?.focus();
    if (capOptions[to] !== checkedCap) set("cap", capOptions[to] || null);
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center" data-pending={pending || undefined} aria-busy={pending}>
      <div className="relative">
        <label htmlFor={selectId} className="sr-only">
          {t("roomsList.building")}
        </label>
        <Building2 className="i pointer-events-none absolute left-3.5 top-1/2 !size-[18px] -translate-y-1/2 text-ink-3" aria-hidden />
        <select
          id={selectId}
          className="select w-full !pl-10 sm:w-auto sm:min-w-[220px]"
          value={buildings.some((b) => b.code === building) ? building : ""}
          onChange={(e) => set("building", e.target.value ? e.target.value.toLowerCase() : null)}
        >
          <option value="">{t("roomsList.allBuildings")}</option>
          {buildings.map((b) => (
            <option key={b.code} value={b.code}>
              {`${b.code} · ${b.name}`}
            </option>
          ))}
        </select>
      </div>
      <div className="seg" role="radiogroup" aria-label={t("roomsList.capacity")}>
        <span className="inline-flex items-center gap-1.5 pl-3 pr-2 text-[13.5px] font-semibold text-ink-3" aria-hidden>
          <Users className="i !size-4" />
          <span className="hidden sm:inline">{t("roomsList.capacity")}</span>
        </span>
        {capOptions.map((v, i) => (
          <button
            key={v || "any"}
            ref={(el) => {
              capRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={v === checkedCap}
            tabIndex={v === checkedCap ? 0 : -1}
            onClick={() => set("cap", v || null)}
            onKeyDown={(e) => onCapKey(e, i)}
            className={cn("flex-1 sm:flex-none", v && "tnum")}
          >
            {v ? `${v}+` : t("roomsList.capAny")}
          </button>
        ))}
      </div>
    </div>
  );
}

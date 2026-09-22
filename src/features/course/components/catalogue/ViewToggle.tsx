"use client";

import { useOptimistic, useTransition } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { useCatalogueParams } from "./useCatalogueParams";

// 38x34 on a desk (the prototype's compact pair). On phones each button is a
// full 44px touch target, like the "Filtrlər" button beside it, because the
// sticky toolbar sits where the thumb reaches for it; the pressed pill is drawn
// inset (::before) so it keeps the desk version's ring of track around it
// instead of swelling to the border.
const BTN = cn(
  "relative grid h-[34px] w-[38px] place-items-center rounded-full text-ink-3 transition-colors duration-(--dur-1) hover:text-ink",
  "before:absolute before:inset-0 before:rounded-full before:transition-colors before:duration-(--dur-1) aria-pressed:text-paper aria-pressed:before:bg-ink",
  "[&>svg]:relative [&>svg]:size-[17px] max-sm:size-11 max-sm:before:inset-[3px]",
);

/**
 * Posters or the index list. The choice lives in the URL (`view=list`, plan
 * D2) so a reload or a shared link shows the same layout with no flash; the
 * pressed state flips at once (optimistic) while the server renders the new
 * layout.
 */
export function ViewToggle({ view, className }: { view: "grid" | "list"; className?: string }) {
  const t = useT();
  const { setView } = useCatalogueParams();
  const [shown, setShown] = useOptimistic(view);
  const [, startTransition] = useTransition();

  const choose = (next: "grid" | "list") => {
    if (next === shown) return;
    startTransition(() => {
      setShown(next);
      setView(next);
    });
  };

  return (
    <div
      role="group"
      aria-label={t("courses.viewLabel")}
      className={cn("inline-flex rounded-full border border-line-2 p-[3px] max-sm:p-0", className)}
    >
      <button
        type="button"
        aria-pressed={shown === "grid"}
        aria-label={t("courses.viewGrid")}
        onClick={() => choose("grid")}
        className={BTN}
      >
        <LayoutGrid aria-hidden="true" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-pressed={shown === "list"}
        aria-label={t("courses.viewList")}
        onClick={() => choose("list")}
        className={BTN}
      >
        <List aria-hidden="true" strokeWidth={1.75} />
      </button>
    </div>
  );
}

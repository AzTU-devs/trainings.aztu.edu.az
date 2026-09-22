import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Kicker } from "@/components/editorial/Kicker";
import { isLong } from "../../catalog";

/**
 * The catalogue's title moment: a dateline kicker, the Fraunces h1 with the
 * catalogue's size as a gold mono superscript, and a lead at columns 1–7;
 * the search field at 8–12, sitting on the lead's baseline. Also used by the
 * load-error state, so the page never loses its title and search field.
 */
export function CatalogueHead({
  kicker,
  title,
  count,
  lead,
  search,
}: {
  kicker: ReactNode;
  title: string;
  /** Formatted, e.g. "30"; omitted while searching or when unknown. */
  count?: string;
  lead?: ReactNode;
  search: ReactNode;
}) {
  return (
    <div className="g12 mt-8 items-end gap-y-8 lg:mt-10">
      <div className="col-span-4 md:col-span-8 lg:col-span-7">
        <Kicker>{kicker}</Kicker>
        <h1 className={cn("t-display-xl mt-4 [overflow-wrap:anywhere]", isLong(title) && "is-long")}>
          {title}
          {count ? (
            // A footnote-style count set on the cap height, as in print.
            <sup className="relative top-[1.1em] ml-3 align-top font-mono text-xs font-medium tracking-[0.06em] text-gold-ink">
              {count}
            </sup>
          ) : null}
        </h1>
        {lead ? <p className="t-lead mt-5 max-w-[52ch]">{lead}</p> : null}
      </div>
      <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8">{search}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { CategorySwatch } from "@/components/cover/CourseCover";
import { Kicker } from "@/components/editorial/Kicker";
import { isLong } from "../../catalog";

/**
 * With one category chosen, the catalogue doubles as that category's landing
 * page: its poster swatch, "Sahə · 03" in the category colour, the name as
 * the h1, a line of context and the category's real numbers — each part only
 * when it is above zero. The search field keeps its place at columns 8–12.
 */
export function CategoryBanner({
  category,
  kicker,
  lead,
  stats,
  search,
}: {
  category: CategoryRef;
  kicker: string;
  lead: string;
  /** Already worded and filtered to non-zero parts; the first is set in bold. */
  stats: string[];
  search: ReactNode;
}) {
  return (
    <div className="g12 mt-8 items-end gap-y-6 lg:mt-10" {...catAttrs(category)}>
      {/* On phones the swatch sits beside a title that may wrap: both hang from
          the top. From md they share the title's baseline, like a masthead. */}
      <div className="col-span-1 self-start md:col-span-2 md:self-end">
        <CategorySwatch category={category} className="rounded-poster" />
      </div>
      <div className="col-span-3 min-w-0 self-start md:col-span-6 md:self-end">
        <Kicker tone="cat">{kicker}</Kicker>
        <h1
          className={cn(
            "t-display-xl mt-3 [overflow-wrap:anywhere]",
            isLong(category.name) && "is-long",
          )}
        >
          {category.name}
        </h1>
      </div>
      <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-1 lg:mt-2">
        <p className="t-lead max-w-[52ch]">{lead}</p>
        {stats.length ? (
          <p className="t-small mt-4 flex flex-wrap gap-x-5 gap-y-1 text-ink-2">
            {stats.map((s, i) =>
              i === 0 ? (
                <b key={s} className="font-semibold text-ink">
                  {s}
                </b>
              ) : (
                <span key={s}>{s}</span>
              ),
            )}
          </p>
        ) : null}
      </div>
      <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8">{search}</div>
    </div>
  );
}

import { ArrowUpRight } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { Svg } from "@/components/bright/Svg";
import { swatchSvg, tileSvg } from "@/lib/art";
import { cn } from "@/lib/utils/cn";
import { TILE_MOTIF, type CategoryStyle } from "../style";

/*
 * Category pieces for the "Bright" design. Each category is one colour field
 * (its hue family's k-100) with one drafted motif. Server components.
 */

export type CategoryItem = {
  id: string;
  name: string;
  /** A short sentence under the name on the large tile; optional. */
  description?: string | null;
  count: number;
  countLabel: string;
  style: CategoryStyle;
  href: string;
};

/**
 * Bento tile. `xl` is the lead tile (6×2 on the 12-column grid), `sm` 3×1 and
 * `wide` 4×1. A category with no courses keeps its colour but shows no count
 * and is not a link — there is nothing behind it yet.
 */
export function CategoryTile({
  item,
  size,
  spanTwoOnPhone,
}: {
  item: CategoryItem;
  size: "xl" | "sm" | "wide";
  spanTwoOnPhone?: boolean;
}) {
  const motif = TILE_MOTIF[item.style.art];
  const empty = item.count === 0;
  const Tag = empty ? "div" : LocaleLink;
  const common = {
    className: cn(
      "cat-tile group",
      item.style.k,
      size === "xl" && "xl col-span-2 min-h-[360px] !p-7 lg:col-span-6 lg:row-span-2 lg:min-h-0 lg:!p-10",
      size === "sm" && "min-h-[188px] lg:col-span-3 lg:min-h-0",
      size === "wide" && "min-h-[188px] lg:col-span-4 lg:min-h-0",
      spanTwoOnPhone && "max-lg:col-span-2",
      empty && "pointer-events-none",
    ),
  };

  if (size === "xl") {
    return (
      <Tag {...common} href={item.href}>
        <span className="paper" />
        <div className="art-box -right-10 -top-10 size-[250px] transition-transform duration-700 group-hover:-rotate-6 sm:size-[300px] lg:size-[360px]">
          <Svg markup={tileSvg(motif)} />
        </div>
        {!empty ? (
          <span className="go absolute bottom-7 right-7 lg:bottom-10 lg:right-10">
            <ArrowUpRight className="i" aria-hidden />
          </span>
        ) : null}
        <div className="mt-auto max-w-[30rem]">
          <div className="name text-[32px] lg:text-[46px]">{item.name}</div>
          {item.description ? (
            <p className="mt-3 max-w-[24rem] text-[16px] leading-relaxed opacity-80">{item.description}</p>
          ) : null}
          {!empty ? (
            <div className="mt-6">
              <span className="count">{item.countLabel}</span>
            </div>
          ) : null}
        </div>
      </Tag>
    );
  }

  return (
    <Tag {...common} href={item.href}>
      <div className="art-box -bottom-6 -right-6 size-[128px] transition-transform duration-700 group-hover:-translate-y-1 group-hover:-rotate-6 lg:size-[150px]">
        <Svg markup={tileSvg(motif)} />
      </div>
      {!empty ? (
        <span className="go absolute right-5 top-5 hidden !size-10 lg:grid">
          <ArrowUpRight className="i" aria-hidden />
        </span>
      ) : null}
      <div className="name max-w-[15rem] pr-2 text-[18px] lg:pr-12 lg:text-[21px]">{item.name}</div>
      <div className="mt-auto pt-6">{!empty ? <span className="count">{item.countLabel}</span> : null}</div>
    </Tag>
  );
}

/**
 * Bento of the categories: the busiest first and largest, empty ones last.
 * It stays at eight tiles however many categories there are — the full list
 * lives on the categories page.
 */
export function CategoryBento({ items, max = 8 }: { items: CategoryItem[]; max?: number }) {
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, max);
  return (
    <div className="grid grid-cols-2 gap-3 lg:auto-rows-[232px] lg:grid-cols-12 lg:gap-4">
      {sorted.map((item, i) => (
        <CategoryTile
          key={item.id}
          item={item}
          size={i === 0 ? "xl" : i < 5 ? "sm" : "wide"}
          spanTwoOnPhone={i === sorted.length - 1 && sorted.length % 2 === 0}
        />
      ))}
    </div>
  );
}

/** Round swatch + name: the hero's topic chips and the empty-result suggestions. */
export function TopicChip({ item, label }: { item: CategoryItem; label?: string }) {
  return (
    <LocaleLink href={item.href} className={cn("chip shrink-0", item.style.k)}>
      <span className="sw">
        <Svg markup={swatchSvg(item.style.art)} />
      </span>
      {label ?? item.name}
    </LocaleLink>
  );
}

/** Square swatch, as used in menus and rails. */
export function Swatch({ item, className }: { item: Pick<CategoryItem, "style">; className?: string }) {
  return (
    <span className={cn("sw-sq", item.style.k, className)}>
      <Svg markup={swatchSvg(item.style.art)} />
    </span>
  );
}

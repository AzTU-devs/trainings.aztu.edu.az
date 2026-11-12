import { LocaleLink } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils/cn";
import { CategoryIcon } from "../icons";
import type { CategoryStyle } from "../style";

/*
 * Category pieces: an even grid of plain tiles (icon, name, course count) and
 * the small topic chips. Server components.
 */

export type CategoryItem = {
  id: string;
  name: string;
  /** A short sentence under the name; only the categories page shows it. */
  description?: string | null;
  count: number;
  countLabel: string;
  style: CategoryStyle;
  href: string;
};

/**
 * One tile. A category with no courses keeps its place but is not a link —
 * there is nothing behind it yet — and says so instead of a count.
 */
export function CategoryCard({
  item,
  emptyLabel,
  showDescription,
  heading: Heading = "h3",
}: {
  item: CategoryItem;
  emptyLabel: string;
  showDescription?: boolean;
  /** The name's heading level: h2 when the grid sits directly under the page's h1. */
  heading?: "h2" | "h3";
}) {
  const empty = item.count === 0;
  return (
    <article className={cn("card cat-card", item.style.k, empty && "empty-cat")}>
      <span className="cat-ic" aria-hidden>
        <CategoryIcon style={item.style} />
      </span>
      <Heading className="name">
        {empty ? (
          item.name
        ) : (
          <LocaleLink href={item.href} className="stretched">
            {item.name}
          </LocaleLink>
        )}
      </Heading>
      {showDescription && item.description ? <p className="desc clamp-2">{item.description}</p> : null}
      <p className="count">{empty ? emptyLabel : item.countLabel}</p>
    </article>
  );
}

/** The grid: two tiles a row on phones, four from 1024px; the busiest first. */
export function CategoryGrid({
  items,
  emptyLabel,
  max,
  showDescription,
  heading,
}: {
  items: CategoryItem[];
  emptyLabel: string;
  max?: number;
  showDescription?: boolean;
  heading?: "h2" | "h3";
}) {
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, max ?? items.length);
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
      {sorted.map((item) => (
        <CategoryCard key={item.id} item={item} emptyLabel={emptyLabel} showDescription={showDescription} heading={heading} />
      ))}
    </div>
  );
}

/** A plain chip with the category's name: the hero's topics, the empty-result suggestions. */
export function TopicChip({ item, small }: { item: Pick<CategoryItem, "href" | "name">; small?: boolean }) {
  return (
    <LocaleLink href={item.href} className={cn("chip shrink-0", small && "sm plain")}>
      {item.name}
    </LocaleLink>
  );
}

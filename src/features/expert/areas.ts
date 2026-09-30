import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import type { Category } from "@/features/category/types";
import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/format";

/** A catalogue category an expert picked, named and coloured for the page. */
export type PickedArea = { id: string; name: string; k: string; href?: string };

type ExpertAreasSource = {
  expertiseCategoryIds?: readonly string[] | null;
  customExpertise?: readonly string[] | null;
};

/**
 * Everything a page shows as an expert's areas of expertise: the categories
 * they picked, named in the page's language and in the order `categories`
 * lists them, then the areas they typed themselves.
 *
 * `categories` must come from the same source as the expert — the real
 * categories for a real expert. A real expert's category ids never match the
 * sample catalogue's, which would silently drop every one of them. An expert
 * who picked none can be given `fallback`, the category their courses are
 * filed under, so a card still says what they teach.
 */
export function expertAreas(
  categories: readonly Category[],
  expert: ExpertAreasSource,
  t: TFunction,
  locale: Locale,
  options: { fallback?: Category | null; href?: (category: Category) => string | undefined } = {},
): { picked: PickedArea[]; own: string[] } {
  const ids = expert.expertiseCategoryIds ?? [];
  const matched = ids.length ? categories.filter((c) => ids.includes(c.id)) : [];
  const shown = matched.length ? matched : options.fallback ? [options.fallback] : [];
  const picked = shown.map((c) => ({
    id: c.id,
    name: categoryLabel(c, t, locale),
    k: categoryStyle(c).k,
    href: options.href?.(c),
  }));
  // Compared with both the API's names and the labels on the page.
  const own = ownAreas(expert.customExpertise, [...matched.map((c) => c.name), ...picked.map((p) => p.name)]);
  return { picked, own };
}

/**
 * The areas an expert typed themselves, ready to show beside the categories
 * they picked.
 *
 * The API normalises these on every write (trimmed, inner spaces collapsed,
 * case-insensitive repeats and any that equal a picked category's name
 * dropped), so for current data this is a formality. It is repeated here
 * because the field is new: an older API omits it, a profile saved before the
 * rule may not follow it, and a page must never print the same area twice.
 */
export function ownAreas(
  custom: readonly string[] | null | undefined,
  categoryNames: readonly string[] = [],
): string[] {
  const seen = new Set(categoryNames.map(fold));
  const out: string[] = [];
  for (const raw of custom ?? []) {
    if (typeof raw !== "string") continue;
    const area = raw.trim().replace(/\s+/g, " ");
    const key = fold(area);
    if (!area || seen.has(key)) continue;
    seen.add(key);
    out.push(area);
  }
  return out;
}

/**
 * Case-insensitive key without locale data. All four i's (i, I, İ, ı) count
 * as one letter, as they do for the API's case-insensitive comparison, so
 * "IT" and "it" match whichever language they were typed in.
 */
function fold(s: string): string {
  return s.trim().replace(/[İIı]/g, "i").toLowerCase();
}

/** Whether two area names are the same area, by the rule above. */
export const sameArea = (a: string, b: string) => fold(a) === fold(b);

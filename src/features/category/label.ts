import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/format";
import type { Category } from "./types";

/**
 * The language the dashboard writes category names and descriptions in. The API
 * has no per-locale field yet, so this is the one locale where its text is
 * already right.
 */
const CATEGORY_SOURCE_LOCALE: Locale = "en";

/**
 * A category's name in the page's language.
 *
 * Until the API carries a translated name, translations live in the
 * `categories.<slug>` message keys. On the source locale the API's own name is
 * shown as it is, so a rename in the dashboard appears at once; elsewhere the
 * key wins, and a category nobody has translated yet falls back to its API name
 * rather than printing a raw key.
 */
export function categoryLabel(
  category: Pick<Category, "slug" | "name">,
  t: TFunction,
  locale: Locale,
): string {
  if (locale === CATEGORY_SOURCE_LOCALE) return category.name;
  const key = `categories.${category.slug}`;
  const label = t(key);
  return label && label !== key ? label : category.name;
}

/**
 * A description worth showing under the name, or null. Descriptions are not
 * translated, so another locale leaves them out rather than drop an English
 * sentence into an Azerbaijani page; one that only repeats the name adds
 * nothing either.
 */
export function categoryDescription(
  category: Pick<Category, "name" | "description">,
  locale: Locale,
): string | null {
  if (locale !== CATEGORY_SOURCE_LOCALE) return null;
  const d = category.description?.trim();
  if (!d || d.toLowerCase() === category.name.trim().toLowerCase()) return null;
  return d;
}

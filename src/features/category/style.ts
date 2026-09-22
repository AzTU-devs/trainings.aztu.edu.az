import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/format";
import { categoryLabel } from "./label";
import type { Category } from "./types";

/**
 * How a category looks: its palette key, its poster seed and the small
 * reference object every card, row, chip and cover takes. Pure and universal —
 * it renders the same on the server and in the browser.
 */

/** A palette in globals.css (`[data-cat=…]`). `oth` is the OKLCH fallback, `brand` the AzTU navy. */
export type CatKey = "it" | "data" | "eng" | "arch" | "biz" | "trans" | "res" | "nrg" | "oth" | "brand";

/**
 * The seven real categories (and the energy slugs a future category may use,
 * D8). Anything the dashboard adds later falls back to `oth`, whose hue comes
 * from its slug, so a new category still gets a stable colour of its own.
 */
export const CATEGORY_KEYS: Record<string, CatKey> = {
  "information-technology": "it",
  "data-ai": "data",
  engineering: "eng",
  "construction-architecture": "arch",
  "business-and-management": "biz",
  "transport-logistics": "trans",
  "research-academic-skills": "res",
  energy: "nrg",
  energetics: "nrg",
  "energy-engineering": "nrg",
};

/**
 * FNV-1a (32-bit) of a string, folded into 1..2147483646. Integer-only maths
 * (`Math.imul`), so the server and every browser agree on the seed — and so
 * on the poster — for the same course id.
 */
export function seedOf(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 2147483646) + 1;
}

export function categoryKey(slug: string): CatKey {
  return CATEGORY_KEYS[slug] ?? "oth";
}

/** The fallback palette's hue; only meaningful for `oth`. */
export function categoryHue(slug: string): number {
  return seedOf(slug) % 360;
}

/** Everything a component needs to show a category, already localised. */
export type CategoryRef = {
  id: string;
  slug: string;
  /** The localised name (categoryLabel). */
  name: string;
  /** A short label for poster headers and spines: `categoryShort.<slug>`, else `name`. */
  short: string;
  key: CatKey;
  /** Set only for `oth`. */
  hue?: number;
  sortOrder: number;
  /**
   * The language `name` / `short` are written in. A category nobody has
   * translated shows its API name, which is English (label.ts), on /az too.
   * Put it as `lang` on any element that uppercases the name (kickers, poster
   * labels): the browser then applies that language's case map, so "Audit"
   * does not become "AUDİT" on /az and "ilə" does not become "ILƏ" on /en.
   */
  lang?: Locale;
  shortLang?: Locale;
};

/** The language the dashboard writes category names in (see CATEGORY_SOURCE_LOCALE in label.ts). */
const CATEGORY_API_LOCALE: Locale = "en";

export function toCategoryRef(c: Category, t: TFunction, locale: Locale): CategoryRef {
  const name = categoryLabel(c, t, locale);
  const shortKey = `categoryShort.${c.slug}`;
  const short = t(shortKey);
  const key = categoryKey(c.slug);
  const hasShort = Boolean(short) && short !== shortKey;
  // categoryLabel returns the API's own name when no translation exists.
  const lang = name === c.name ? CATEGORY_API_LOCALE : locale;
  return {
    id: c.id,
    slug: c.slug,
    name,
    // t() echoes the path when a key is missing: only the seven real slugs
    // have short names, everything else shows its full (localised) name.
    short: hasShort ? short : name,
    key,
    ...(key === "oth" ? { hue: categoryHue(c.slug) } : {}),
    sortOrder: c.sortOrder,
    lang,
    shortLang: hasShort ? locale : lang,
  };
}

/**
 * The attributes that bind an element (and its subtree) to a category
 * palette: spread them on the root of a card, row, cover or page header.
 * `null` (no category, or a course whose categories are unknown) gives the
 * navy `brand` palette.
 */
export function catAttrs(ref: Pick<CategoryRef, "key" | "hue"> | null): {
  "data-cat": CatKey;
  style?: CSSProperties;
} {
  if (!ref) return { "data-cat": "brand" };
  if (ref.key === "oth") {
    return { "data-cat": "oth", style: { "--h": ref.hue ?? 200 } as CSSProperties };
  }
  return { "data-cat": ref.key };
}

/**
 * D11: a course's primary category is the member category with the lowest
 * `sortOrder`, ties broken by slug. Inactive or unknown ids are skipped, so
 * the course page (which has `course.categoryIds`) and every list (which only
 * sees active categories) pick the same one, and a course's poster is
 * identical everywhere.
 */
export function primaryCategoryId(ids: readonly string[], byId: ReadonlyMap<string, Category>): string | null {
  let best: Category | null = null;
  for (const id of ids) {
    const c = byId.get(id);
    if (!c || c.active === false) continue;
    if (
      !best ||
      c.sortOrder < best.sortOrder ||
      (c.sortOrder === best.sortOrder && c.slug < best.slug)
    ) {
      best = c;
    }
  }
  return best?.id ?? null;
}

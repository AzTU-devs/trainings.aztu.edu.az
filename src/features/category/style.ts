import type { ArtKind } from "@/lib/art";
import type { Category } from "./types";

/**
 * Which colour family and which drawing a category gets.
 *
 * `k` is the hue-engine class (globals.css, "Category hue engine"): every
 * shade a tile, cover or label uses is derived from one hue per family. `art`
 * picks the family's motifs in src/lib/art.ts.
 */
export type CategoryStyle = { k: string; art: ArtKind };

/** The categories that exist today, by slug. */
const BY_SLUG: Record<string, ArtKind> = {
  "information-technology": "it",
  "data-ai": "data",
  engineering: "eng",
  "business-and-management": "biz",
  "research-academic-skills": "res",
  "construction-architecture": "build",
  "transport-logistics": "trans",
};

/**
 * Categories added later in the dashboard have no entry above, so they are
 * matched by what their slug and name say. Order matters: "data" must win over
 * "information" for a slug like "data-information-systems".
 */
const KEYWORDS: [RegExp, ArtKind][] = [
  [/energ|ekolog|ecolog|solar|power|günəş/i, "energy"],
  [/data|\bai\b|süni|machine|intellekt/i, "data"],
  [/inform|software|program|web|cyber|kibert|comput|kompüter/i, "it"],
  [/engineer|mühəndis|mechan|mexanik|electr|elektr/i, "eng"],
  [/business|biznes|manage|idarə|finan|maliyy|econom|iqtisad|market/i, "biz"],
  [/research|tədqiq|academ|akadem|scien|elm/i, "res"],
  [/construct|tikinti|archit|memar|build|inşaat/i, "build"],
  [/transport|nəqliyyat|logist|avia|marine|dəniz/i, "trans"],
];

export function categoryStyle(category: Pick<Category, "slug" | "name"> | null | undefined): CategoryStyle {
  if (!category) return { k: "k-navy", art: "it" };
  const known = BY_SLUG[category.slug];
  if (known) return { k: `k-${known}`, art: known };
  const text = `${category.slug} ${category.name}`;
  for (const [re, art] of KEYWORDS) if (re.test(text)) return { k: `k-${art}`, art };
  // Nothing matched: the brand navy field with a neutral motif, rather than
  // borrowing another category's colour and implying they are related.
  return { k: "k-navy", art: "it" };
}

/** The single-shape motif each family uses on tiles, swatches and the mosaic. */
export const TILE_MOTIF: Record<ArtKind, string> = {
  it: "window",
  data: "dots",
  eng: "gear",
  biz: "bars",
  res: "book",
  build: "arch",
  trans: "route",
  energy: "wave",
};

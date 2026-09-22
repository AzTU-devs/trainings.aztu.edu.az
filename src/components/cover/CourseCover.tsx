import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { catAttrs, seedOf, type CategoryRef } from "@/features/category/style";
import { pick, ratioOf } from "./art";
import { CoverArt } from "./CoverArt";

export type CoverRatio = "4 / 3" | "16 / 10" | "16 / 9" | "1 / 1" | "3 / 2" | "4 / 5";

/**
 * The plate draws its art in a band inside its inset frame: 66% of the
 * frame's height and all of its width but the frame's 3.2cqi on each side
 * (.cover-plate > svg.art in globals.css). The drawing is made for that band,
 * so a full-bleed motif ends at the frame line instead of crossing it.
 */
const PLATE_ART_H = 0.66;
const PLATE_ART_W = 1 - 2 * 0.032;

/**
 * A course's cover, identical wherever the course appears: its photo
 * (hue-washed into the category colour, with the poster's mono header bar,
 * full colour on hover), or its generative poster. Titles are never printed
 * on a cover — the card or page already says it next to it.
 *
 * - `poster` (default): labels + technical marks.
 * - `plate`: the course page's book-cover plate, with an inset frame and the
 *   "AzTU EduPlatform | year" title block.
 * - `thumb`: rows and tiles — no labels, no marks.
 *
 * About one course in five gets the "night" variant (navy ground), decided by
 * its id, never on photos and never when `day` forces the day palette.
 */
export function CourseCover({
  courseId,
  category,
  photoUrl,
  ratio,
  artRatio,
  variant = "poster",
  labels,
  plateYear,
  day = false,
  sizes = "(max-width: 640px) 104px, (max-width: 1024px) 50vw, 440px",
  priority = false,
  className,
}: {
  courseId: string;
  category: CategoryRef | null;
  /** Already resolved through mediaSrc(). */
  photoUrl?: string | null;
  /**
   * The frame's CSS aspect ratio, set inline. Leave it out inside `.pcard`,
   * `.crow`, `.catrow` and `.feature`: their CSS sets the ratio per
   * breakpoint (e.g. a poster card is 4:3, but 1:1 as a phone media row), and
   * an inline value would override it. Without either, the frame is 4:3.
   */
  ratio?: CoverRatio;
  /** The drawn ratio when it should differ from the frame (e.g. a frame that is 1:1 on phones). On a plate, give the frame ratio: the art band is applied here. */
  artRatio?: number;
  variant?: "poster" | "plate" | "thumb";
  /** Mono header: category short name · format label. */
  labels?: { left: string; right: string } | null;
  /** The plate's title-block year. */
  plateYear?: string;
  day?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const seed = seedOf(courseId);
  const photo = Boolean(photoUrl);
  const plate = variant === "plate";
  const thumb = variant === "thumb";
  const inv = !photo && !day && pick(seed).inv;
  const attrs = catAttrs(category);
  const drawn = (artRatio ?? ratioOf(ratio ?? "4 / 3")) * (plate ? PLATE_ART_W / PLATE_ART_H : 1);
  const showLabels = !thumb && labels;

  return (
    <div
      {...attrs}
      className={cn("cover", plate && "cover-plate", inv && "inv", photo && "is-photo", className)}
      style={ratio ? ({ ...attrs.style, "--ratio": ratio } as CSSProperties) : attrs.style}
    >
      {photoUrl ? (
        // Decorative: the title is always printed next to the cover.
        // `unoptimized` for the same reason as everywhere else on the site:
        // the optimizer would fetch the API's public hostname from inside the
        // server, which fails on the university network; the API already
        // serves media `public, max-age=86400, immutable`.
        // `priority` maps to eager + high fetch priority (Next 16 deprecated the `priority` prop).
        <Image
          src={photoUrl}
          alt=""
          fill
          unoptimized
          sizes={sizes}
          {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
        />
      ) : (
        <CoverArt cat={category?.key ?? "brand"} seed={seed} ratio={drawn} noTech={thumb} />
      )}
      {showLabels ? (
        <div className="cover-labels" aria-hidden="true">
          {/* The left label is usually the category's short name, which may be
              untranslated API text: its own language picks the uppercase map. */}
          <span lang={category && labels.left === category.short ? category.shortLang : undefined}>{labels.left}</span>
          <span>{labels.right}</span>
        </div>
      ) : null}
      {plate && plateYear ? (
        <div className="tblock" aria-hidden="true">
          <span>AzTU EduPlatform</span>
          <span>{plateYear}</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A category's own swatch: a square poster in the day palette, without labels
 * or marks. Used by category rows, chips, the mega menu, spines and banners.
 * Decorative (the category name is always printed next to it).
 */
export function CategorySwatch({
  category,
  seed,
  className,
}: {
  category: Pick<CategoryRef, "key" | "hue" | "slug">;
  seed?: number;
  className?: string;
}) {
  const attrs = catAttrs(category);
  return (
    <div
      {...attrs}
      aria-hidden="true"
      className={cn("cover", className)}
      style={{ ...attrs.style, "--ratio": "1 / 1" } as CSSProperties}
    >
      <CoverArt cat={category.key} seed={seed ?? seedOf(category.slug)} ratio={1} noTech />
    </div>
  );
}

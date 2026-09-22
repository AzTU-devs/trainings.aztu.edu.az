import { cn } from "@/lib/utils/cn";
import type { CatKey } from "@/features/category/style";
import { artSvg, type CoverSpecial } from "./art";

/**
 * The generative poster as an inline SVG. It fills its positioned parent (a
 * `.cover`) and slices to the frame, so one drawing serves a range of frame
 * ratios. Colours come from the `--cv-*` variables of the nearest
 * `[data-cat]`, so pass explicit ones through `style` only for the fixed
 * decorative tiles (hero, format diptych).
 */
export function CoverArt({
  cat,
  seed,
  ratio,
  special,
  noTech,
  className,
}: {
  cat: CatKey;
  seed: number;
  /** The drawn aspect ratio, width / height. */
  ratio: number;
  special?: CoverSpecial;
  noTech?: boolean;
  className?: string;
}) {
  const { viewBox, inner } = artSvg({ cat, seed, ratio, special, noTech });
  return (
    <svg
      className={cn("art", className)}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      // Safe: `inner` is generated only from numbers and constant strings in
      // art.ts (coordinates, fixed element names, var(--cv-*) styles). No API
      // text, title or name ever enters it, so there is nothing to escape.
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

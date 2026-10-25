import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/*
 * The AzTU logo: the stacked lockup — the shield on its square plate over the
 * "AZTU" wordmark. Two files, both resized from the university's originals
 * to 93 × 128 (twice the tallest size the site draws them at):
 *
 * - aztu-logo-dark.png  — navy plate, navy/blue wordmark: for light surfaces.
 * - aztu-logo-light.png — white plate, white wordmark: for dark surfaces.
 */
const ON_LIGHT = "/brand/aztu-logo-dark.png";
const ON_DARK = "/brand/aztu-logo-light.png";
const W = 93;
const H = 128;

/**
 * Both variants are rendered and `.logo-l` / `.logo-d` (globals.css) hide one
 * by the colour scheme — the same rule as the rest of the theme, including a
 * `data-theme` override — so the right one is on screen at first paint with
 * no JavaScript. The height comes from the caller (`.aztu-logo` reads
 * `--logo-h`); the width follows the file's proportions.
 *
 * Lazy by default, as Next's docs advise for a light/dark pair: only the
 * visible one is fetched. `fetchPriority="high"` hurries it along in the header.
 */
export function AztuMark({
  className,
  fetchPriority,
}: {
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
}) {
  const img = cn("aztu-logo", className);
  return (
    <>
      <Image
        src={ON_LIGHT}
        alt="AzTU"
        width={W}
        height={H}
        unoptimized
        fetchPriority={fetchPriority}
        className={cn(img, "logo-l")}
      />
      <Image
        src={ON_DARK}
        alt="AzTU"
        width={W}
        height={H}
        unoptimized
        fetchPriority={fetchPriority}
        className={cn(img, "logo-d")}
      />
    </>
  );
}

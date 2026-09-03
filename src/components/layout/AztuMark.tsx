import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const NAVY = "/brand/aztu-mark.png";
const WHITE = "/brand/aztu-mark-white.png";

/**
 * The AzTU shield.
 *
 * Both files are the university's own mark, trimmed to the glyph and put on
 * transparency — one navy for light surfaces, one white for the navy canvas.
 * The supplied source art is dark-on-white with an opaque background, which is
 * why it cannot simply be dropped onto a dark surface as-is.
 *
 * `tone="auto"` swaps on the colour scheme by rendering both and hiding one,
 * so no JavaScript is involved and there is no flash on first paint.
 */
export function AztuMark({
  className,
  tone = "auto",
}: {
  className?: string;
  /** `onDeep` forces the white mark, for the navy canvas. */
  tone?: "auto" | "onDeep";
}) {
  // Callers size the box (they all pass `size-*`); the mark letterboxes inside
  // it via object-contain, so the shield keeps its proportions at any size.
  const box = cn("relative inline-block size-9 shrink-0", className);

  if (tone === "onDeep") {
    return (
      <span className={box}>
        <Image src={WHITE} alt="AzTU" fill sizes="64px" className="object-contain" priority />
      </span>
    );
  }

  return (
    <span className={box}>
      <Image
        src={NAVY}
        alt="AzTU"
        fill
        sizes="64px"
        className="object-contain dark:hidden"
        priority
      />
      <Image
        src={WHITE}
        alt=""
        aria-hidden
        fill
        sizes="64px"
        className="hidden object-contain dark:block"
        priority
      />
    </span>
  );
}

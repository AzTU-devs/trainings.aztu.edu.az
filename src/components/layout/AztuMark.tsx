import { cn } from "@/lib/utils/cn";

/**
 * The AzTU shield, drawn inline.
 *
 * The raster mark in /public is a navy glyph baked onto an opaque white canvas,
 * so it shows as a white block on the navy surfaces this site now uses. Drawing
 * it as an SVG lets the same mark sit correctly on light and deep backgrounds
 * and costs no extra request.
 */
export function AztuMark({
  className,
  tone = "auto",
}: {
  className?: string;
  /** `onDeep` swaps the shield body for a translucent white on dark canvases. */
  tone?: "auto" | "onDeep";
}) {
  const onDeep = tone === "onDeep";
  return (
    <svg
      viewBox="0 0 56 56"
      role="img"
      aria-label="AzTU"
      className={cn("size-9 shrink-0", className)}
    >
      <defs>
        <linearGradient id="aztuShieldBody" x1="0" y1="0" x2="0" y2="1">
          {onDeep ? (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.20" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#0b4a8d" />
              <stop offset="1" stopColor="#003876" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d="M28 4 L50 14 V28 C50 40 40 49 28 52 C16 49 6 40 6 28 V14 Z"
        fill="url(#aztuShieldBody)"
        stroke="#c8a951"
        strokeWidth="1.5"
      />
      {/* The "A" device */}
      <path d="M28 14 L40 38 H34 L32 33 H24 L22 38 H16 Z M26 28 H30 L28 22 Z" fill="#c8a951" />
    </svg>
  );
}

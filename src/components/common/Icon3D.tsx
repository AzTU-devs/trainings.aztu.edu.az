import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Tone names are kept from the previous palette so call sites don't churn, but
 * every one now resolves into the AzTU navy/gold family: deep navies for
 * structure, gold for emphasis, and two muted supporting tones. The result is
 * a set of tiles that read as one material instead of a rainbow.
 */
export type Icon3DTone =
  | "navy"
  | "gold"
  | "violet"
  | "blue"
  | "cyan"
  | "fuchsia"
  | "emerald"
  | "amber"
  | "rose";

type ToneSpec = { face: string; ring: string; glow: string };

const TONES: Record<Icon3DTone, ToneSpec> = {
  navy: {
    face: "from-navy-500 via-navy-700 to-navy-900",
    ring: "ring-white/25",
    glow: "shadow-[0_18px_36px_-14px_rgb(0_56_118/0.75)]",
  },
  gold: {
    face: "from-gold-300 via-gold-500 to-gold-700",
    ring: "ring-white/40",
    glow: "shadow-[0_18px_36px_-14px_rgb(200_169_81/0.7)]",
  },
  // Supporting tones — deliberately close to the two brand colours.
  blue: {
    face: "from-navy-400 via-navy-600 to-navy-800",
    ring: "ring-white/25",
    glow: "shadow-[0_18px_36px_-14px_rgb(11_74_141/0.7)]",
  },
  cyan: {
    face: "from-[#3f8fb0] via-navy-600 to-navy-800",
    ring: "ring-white/25",
    glow: "shadow-[0_18px_36px_-14px_rgb(26_91_165/0.65)]",
  },
  violet: {
    face: "from-navy-500 via-navy-700 to-navy-950",
    ring: "ring-white/20",
    glow: "shadow-[0_18px_36px_-14px_rgb(0_31_69/0.8)]",
  },
  fuchsia: {
    face: "from-gold-400 via-gold-600 to-navy-800",
    ring: "ring-white/30",
    glow: "shadow-[0_18px_36px_-14px_rgb(169_138_54/0.65)]",
  },
  emerald: {
    face: "from-[#3f9c78] via-[#1f6d55] to-navy-800",
    ring: "ring-white/25",
    glow: "shadow-[0_18px_36px_-14px_rgb(23_120_79/0.6)]",
  },
  amber: {
    face: "from-gold-200 via-gold-400 to-gold-600",
    ring: "ring-white/45",
    glow: "shadow-[0_18px_36px_-14px_rgb(212_176_74/0.7)]",
  },
  rose: {
    face: "from-gold-300 via-gold-500 to-navy-700",
    ring: "ring-white/35",
    glow: "shadow-[0_18px_36px_-14px_rgb(200_169_81/0.6)]",
  },
};

const SIZES = {
  sm: { box: "size-10 rounded-xl", icon: "size-[18px]" },
  md: { box: "size-12 rounded-2xl", icon: "size-6" },
  lg: { box: "size-16 rounded-[1.15rem]", icon: "size-8" },
} as const;

/**
 * A CSS-sculpted icon tile: a brand gradient face with a lit top edge, an inner
 * bevel and a tinted shadow beneath, so a flat Lucide glyph reads as a small
 * physical object. Pure CSS, so it is safe inside server components.
 */
export function Icon3D({
  icon: Icon,
  tone = "navy",
  size = "md",
  float = false,
  className,
}: {
  icon: LucideIcon;
  tone?: Icon3DTone;
  size?: keyof typeof SIZES;
  float?: boolean;
  className?: string;
}) {
  const t = TONES[tone];
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "group/icon relative inline-grid shrink-0 place-items-center",
        float && "rise",
        className,
      )}
    >
      <span
        className={cn(
          "relative grid place-items-center bg-gradient-to-br transition-transform duration-500 will-change-transform group-hover/icon:-translate-y-1",
          s.box,
          t.face,
          t.glow,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/40 via-white/5 to-transparent"
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset",
            t.ring,
          )}
        />
        <Icon
          className={cn(
            "relative text-white drop-shadow-[0_1px_3px_rgb(0_18_42/0.45)]",
            tone === "gold" || tone === "amber" ? "text-navy-900 drop-shadow-none" : "",
            s.icon,
          )}
        />
      </span>
    </span>
  );
}

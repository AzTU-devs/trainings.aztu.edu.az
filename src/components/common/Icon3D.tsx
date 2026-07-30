import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type Icon3DTone =
  | "violet"
  | "blue"
  | "cyan"
  | "fuchsia"
  | "emerald"
  | "amber"
  | "rose";

const TONES: Record<Icon3DTone, { face: string; glow: string }> = {
  violet: { face: "from-violet-400 via-violet-500 to-indigo-600", glow: "shadow-violet-500/50" },
  blue: { face: "from-sky-400 via-blue-500 to-indigo-600", glow: "shadow-blue-500/50" },
  cyan: { face: "from-cyan-300 via-teal-400 to-sky-600", glow: "shadow-cyan-500/50" },
  fuchsia: { face: "from-fuchsia-400 via-pink-500 to-rose-600", glow: "shadow-fuchsia-500/50" },
  emerald: { face: "from-emerald-300 via-green-500 to-teal-600", glow: "shadow-emerald-500/50" },
  amber: { face: "from-amber-300 via-orange-400 to-rose-500", glow: "shadow-amber-500/50" },
  rose: { face: "from-rose-400 via-pink-500 to-fuchsia-600", glow: "shadow-rose-500/50" },
};

const SIZES = {
  sm: { box: "size-11 rounded-xl", icon: "size-5" },
  md: { box: "size-14 rounded-2xl", icon: "size-7" },
  lg: { box: "size-20 rounded-[1.4rem]", icon: "size-9" },
} as const;

/**
 * A CSS-sculpted "3D" icon tile: a vivid gradient face with a glossy top
 * highlight, a beveled inner edge and a coloured glow beneath, so flat Lucide
 * glyphs read as floating 3D objects. Tilts and lifts on hover (pure CSS — no
 * JS — so it is safe inside server components).
 */
export function Icon3D({
  icon: Icon,
  tone = "violet",
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
        "group/icon relative inline-grid shrink-0 place-items-center perspective",
        float && "float",
        className,
      )}
    >
      {/* coloured glow pool */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 translate-y-2 scale-90 rounded-[inherit] bg-gradient-to-br opacity-70 blur-xl transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:opacity-100",
          t.face,
        )}
      />
      {/* the 3D face */}
      <span
        className={cn(
          "relative grid place-items-center bg-gradient-to-br shadow-lg transition-transform duration-500 will-change-transform",
          "[transform:rotateX(18deg)_rotateY(-16deg)] group-hover/icon:[transform:rotateX(6deg)_rotateY(8deg)_translateY(-4px)]",
          s.box,
          t.face,
          t.glow,
        )}
      >
        {/* glossy top highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/55 via-white/5 to-transparent"
        />
        {/* inner bevel ring */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/30"
        />
        <Icon className={cn("relative text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)]", s.icon)} />
      </span>
    </span>
  );
}

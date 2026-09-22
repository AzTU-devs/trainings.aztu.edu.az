import Image from "next/image";
import { Svg } from "@/components/bright/Svg";
import { hash, monogramSvg } from "@/lib/art";
import { cn } from "@/lib/utils/cn";
import { mediaSrc } from "@/features/course/media";
import { initialsOf } from "../types";

/**
 * An expert's portrait in the arch shape. With a photo, the photo fills the
 * arch; without one, the initials are set large on the expert's category
 * colour with one drafted shape behind them — typographic, never a fake
 * silhouette.
 */
export function ExpertArch({
  id,
  name,
  avatarUrl,
  k,
  className,
}: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  /** Hue-engine class of the expert's main subject area. */
  k: string;
  className?: string;
}) {
  const photo = mediaSrc(avatarUrl);
  return (
    <div className={cn("av arch aspect-[5/6] w-full", k, className)}>
      {photo ? (
        <Image src={photo} alt="" fill unoptimized sizes="(min-width: 1024px) 20vw, 60vw" className="object-cover" />
      ) : (
        <Svg markup={monogramSvg(initialsOf(name), hash(id))} />
      )}
    </div>
  );
}

/** The small round version: header chips, course hero, reviews. */
export function ExpertDot({
  name,
  avatarUrl,
  k,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  k: string;
  className?: string;
}) {
  const photo = mediaSrc(avatarUrl);
  return (
    <span className={cn("av round size-12 bg-[var(--k-200)] text-[17px]", k, className)}>
      {photo ? (
        <Image src={photo} alt="" fill unoptimized sizes="48px" className="object-cover" />
      ) : (
        <span className="ini">{initialsOf(name)}</span>
      )}
    </span>
  );
}

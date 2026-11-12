"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { mediaSrc } from "@/features/course/media";
import { initialsOf } from "../types";

/**
 * An expert's photo, or their initials on a quiet navy tint when there is
 * none — or when the photo fails to load. The API serves an avatar
 * anonymously only while its expert is APPROVED, and an expert can be
 * suspended or swap their avatar after a page was cached, so a dead URL is
 * expected rather than exceptional; falling back keeps the card from showing
 * a broken image. A client component only for that `onError`; next/image
 * re-triggers the load after hydration, so an early error is still caught.
 *
 * Decorative (empty alt): every caller prints the expert's name beside it.
 * The shape and size come from the caller (`.av` with `round` or `panel`,
 * or the expert card's square).
 */
export function ExpertPortrait({
  name,
  avatarUrl,
  sizes,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  /** Rendered width, e.g. "48px"; kept for when the images are optimised. */
  sizes: string;
  className?: string;
}) {
  const src = mediaSrc(avatarUrl);
  // Remember WHICH url failed, so a new avatar after revalidation gets its
  // own attempt without an effect to reset state.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && src !== failedSrc;
  return (
    <span className={cn("av", className)} aria-hidden>
      {showImage ? (
        <Image src={src} alt="" fill unoptimized sizes={sizes} className="object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="ini">{initialsOf(name)}</span>
      )}
    </span>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { mediaSrc } from "@/features/course/media";
import { initialsOf } from "../types";

/**
 * An expert's portrait, or their initials on the brand gradient when there is
 * none — or when the portrait fails to load. The API serves an avatar
 * anonymously only while its expert is APPROVED, and an expert can be
 * suspended or swap their avatar after a page was cached, so a dead URL is
 * expected rather than exceptional; falling back keeps the circle from going
 * blank.
 *
 * A client component only for that `onError` fallback. next/image re-triggers
 * the load after hydration, so an error that fired before React attached the
 * handler is still caught.
 *
 * Decorative (`aria-hidden`, empty alt): every caller renders the expert's
 * name right beside it.
 */
export function ExpertAvatar({
  name,
  avatarUrl,
  sizes,
  className,
}: {
  name: string;
  /** Media path from the API, resolved here like course thumbnails. */
  avatarUrl?: string | null;
  /**
   * Rendered width, e.g. "64px". No effect while `unoptimized`; kept so that
   * dropping the flag brings responsive widths back, as in CourseCard.
   */
  sizes: string;
  /** Size, text size and any hover transform. */
  className?: string;
}) {
  const src = mediaSrc(avatarUrl);
  // Remember WHICH url failed rather than a boolean, so a new avatar after
  // revalidation gets its own attempt without an effect to reset state.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && src !== failedSrc;

  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-navy-500 to-navy-900 font-display text-white ring-1 ring-inset ring-white/15",
        className,
      )}
    >
      {showImage ? (
        // `unoptimized` for the same reason as CourseCard's thumbnail: the
        // optimizer would fetch the API's public hostname from inside this
        // server, which cannot reach it in production, and every avatar would
        // break while the API itself is fine. The browser fetches the API URL
        // directly instead (CSP img-src already allows the API origin), and
        // the API serves it with long-lived cache headers.
        //
        // The muted backdrop keeps a transparent PNG from showing the gradient
        // through it.
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes={sizes}
          className="bg-muted object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

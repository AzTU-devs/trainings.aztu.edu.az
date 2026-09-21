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
 *
 * Round by default, which suits the small sizes (a byline, a course page's
 * instructor row). Large placements pass their own radius — `rounded-3xl` on
 * the profile, `rounded-2xl` as a directory card's inset cover — and the class
 * merge lets it win.
 */
/**
 * The initials backdrop, picked per name from a fixed family of navy
 * gradients — the same family as the generated course covers — so a row of
 * experts without portraits reads as distinct people rather than one block
 * repeated, without drifting off-brand.
 */
const GRADIENTS = [
  "from-navy-500 via-navy-700 to-navy-950",
  "from-navy-600 via-navy-800 to-[#0b2545]",
  "from-[#1f6d8c] via-navy-700 to-navy-950",
  "from-navy-400 via-navy-600 to-navy-900",
  "from-[#2a5f7a] via-navy-800 to-navy-950",
] as const;

function gradientFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

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
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br font-display text-white ring-1 ring-inset ring-white/15",
        gradientFor(name),
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
        <>
          {/* The same warm glow the course covers carry, so an expert without
              a portrait still reads as part of the brand family rather than
              as a flat placeholder. Sized in percent so it scales with every
              avatar size. */}
          <span className="absolute -right-[20%] -top-[30%] size-[85%] rounded-full bg-[radial-gradient(circle,rgba(200,169,81,0.38)_0%,transparent_68%)]" />
          <span className="relative">{initialsOf(name)}</span>
        </>
      )}
    </span>
  );
}

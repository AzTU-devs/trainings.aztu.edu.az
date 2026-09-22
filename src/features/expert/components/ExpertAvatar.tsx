"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { mediaSrc } from "@/features/course/media";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { initialsOf } from "../types";

/**
 * An expert's photo, or their initials in Fraunces italic on their category's
 * colour (AzTU navy without one) — also when the photo fails to load. The API
 * serves an avatar anonymously only while its expert is APPROVED, and an
 * expert can be suspended or swap their avatar after a page was cached, so a
 * dead URL is expected rather than exceptional; falling back keeps the circle
 * from going blank.
 *
 * A client component only for that `onError` fallback. next/image re-triggers
 * the load after hydration, so an error that fired before React attached the
 * handler is still caught.
 *
 * `avatarUrl` is the API's media path (or an absolute URL); it is resolved
 * here with mediaSrc(), which leaves absolute URLs untouched.
 */
function usePhoto(avatarUrl: string | null | undefined) {
  const src = mediaSrc(avatarUrl);
  // Remember WHICH url failed rather than a boolean, so a new avatar after
  // revalidation gets its own attempt without an effect to reset state.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return { src: src !== null && src !== failedSrc ? src : null, fail: () => setFailedSrc(src) };
}

/**
 * The round avatar (`.avatar`, 44px by default). Decorative (`aria-hidden`,
 * empty alt): every caller renders the expert's name right beside it.
 */
export function ExpertAvatar({
  name,
  avatarUrl,
  sizes,
  category = null,
  size = 44,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  /** Rendered width, e.g. "44px". No effect while `unoptimized`; kept for when it is dropped. */
  sizes: string;
  category?: CategoryRef | null;
  /** Diameter in px. */
  size?: number;
  className?: string;
}) {
  const photo = usePhoto(avatarUrl);
  const attrs = catAttrs(category);
  return (
    <span
      aria-hidden="true"
      {...attrs}
      className={cn("avatar", className)}
      style={{ ...attrs.style, "--s": `${size}px` } as CSSProperties}
    >
      {photo.src ? (
        // `unoptimized`: the optimizer would fetch the API's public hostname
        // from inside this server, which cannot reach it in production. The
        // browser fetches the API URL directly (CSP img-src allows it) and the
        // API serves it with long-lived cache headers.
        <Image src={photo.src} alt="" fill unoptimized sizes={sizes} className="bg-paper-2" onError={photo.fail} />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
    </span>
  );
}

/**
 * The large portrait (`.portrait`, 4:5 by default): the photo, or oversized
 * cropped italic initials with the accent dot. Set `alt` when this is the only
 * image of the person on the page (the profile); otherwise it is decorative.
 */
export function ExpertPortrait({
  name,
  avatarUrl,
  category = null,
  ratio = "4 / 5",
  alt = false,
  sizes,
  priority = false,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  category?: CategoryRef | null;
  ratio?: "4 / 5" | "1 / 1";
  alt?: boolean;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const photo = usePhoto(avatarUrl);
  const attrs = catAttrs(category);
  return (
    <div
      {...attrs}
      className={cn("portrait", className)}
      style={{ ...attrs.style, "--ratio": ratio } as CSSProperties}
      aria-hidden={photo.src && alt ? undefined : true}
    >
      {photo.src ? (
        <Image
          src={photo.src}
          alt={alt ? name : ""}
          fill
          unoptimized
          sizes={sizes}
          {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
          onError={photo.fail}
        />
      ) : (
        <>
          <span className="ini">{initialsOf(name)}</span>
          <span className="dot" />
        </>
      )}
    </div>
  );
}

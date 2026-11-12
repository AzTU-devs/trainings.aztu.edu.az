"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

/**
 * A cover's photo, or — when it fails to load — what the cover shows without
 * one (`children`: the plain header's icon). The API serves media only while
 * its course is published, and a cached page can outlive that, so a dead URL
 * is expected rather than exceptional. A client component only for that
 * `onError`; next/image re-triggers the load after hydration, so an early
 * error is still caught.
 */
export function CoverPhoto({ src, sizes, children }: { src: string; sizes: string; children: ReactNode }) {
  // Remember WHICH url failed, so a new one gets its own attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return <>{children}</>;
  return <Image src={src} alt="" fill unoptimized sizes={sizes} onError={() => setFailedSrc(src)} />;
}

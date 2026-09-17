import { env } from "@/lib/env";

/**
 * The API returns media as a path (`/api/public/media/{id}/content`) rather than
 * an absolute URL, so stored rows survive a change of API host. Resolve it here
 * against the browser-visible origin: `next/image` needs an absolute URL for a
 * remote asset, and these URLs are also handed to plain `<img>`/`<video>` tags.
 */
export function mediaSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  // An absolute URL means the asset already lives elsewhere (object storage/CDN).
  if (/^https?:\/\//i.test(path)) return path;
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

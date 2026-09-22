import { notFound } from "next/navigation";

/**
 * Every path under a locale that no other route claims (/az/nope,
 * /en/kurslar/x) ends here, only to raise notFound(). Without it such a URL
 * matches nothing and Next serves app/global-not-found.tsx: a bare, bilingual
 * page with no header, search or footer, and <html lang="az"> even on /en.
 * Through notFound() it gets app/[lang]/not-found.tsx instead, inside the site
 * chrome and in the page's language. The status stays 404, and the 404 title
 * and noindex come from that file's metadata: on a notFound() render Next
 * reads the head from the layouts and not-found.tsx, never from this page, so
 * this page exports none.
 *
 * A catch-all has the lowest priority, so every real route (static or
 * dynamic, e.g. /az/courses/[slug]) still wins. The [lang] layout rejects an
 * unknown locale before this page renders.
 *
 * In development only, React's dev build may log a harmless "cannot have a
 * negative time stamp" performance-track error for this component; the
 * production build has no such tracking.
 */

// The [lang] layout sets dynamicParams = false for its two locales; the
// missing segments can be anything, so this segment must accept any value.
export const dynamicParams = true;

export default function MissingPage(): never {
  notFound();
}

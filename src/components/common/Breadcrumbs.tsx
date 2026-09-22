"use client";

import Link from "next/link";
import { isLocale } from "@/i18n/config";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

export type Crumb = {
  label: string;
  href?: string;
  /** "cat" prints the crumb in the category colour (needs data-cat on an ancestor). */
  tone?: "cat";
  /**
   * The language of `label` when it may differ from the page's: API text
   * such as a course title (`course.language`) or an untranslated category
   * name (`CategoryRef.lang`). The trail is uppercased by CSS, and the
   * browser picks the case map from `lang`: without it "in" on /az becomes
   * "İN", and "ilə" on /en becomes "ILƏ".
   */
  lang?: string;
};

/**
 * A leading crumb that points at the site root ("/", "/az", "/en") takes its
 * label from the dictionary, so the trail never shows an English "Home" on
 * /az, whatever label the caller happened to pass.
 */
function isRootHref(href: string | undefined): boolean {
  if (!href) return false;
  const segments = href.split(/[?#]/)[0].split("/").filter(Boolean);
  return segments.length === 0 || (segments.length === 1 && isLocale(segments[0]));
}

/**
 * The trail as a row of mono kicker crumbs separated by "/", the current page
 * last (ink, aria-current, truncated when it is very long).
 *
 * A crumb link's box is only the 12px text plus padding (about 28px), which
 * callers cancel with -my-1.5 to keep the grid rhythm. On phones a transparent
 * ::after grows the hit area to the tap-target minimum (40px tall, 4px past
 * each side) without moving anything.
 */
const TAP_AREA =
  "relative max-sm:after:absolute max-sm:after:-inset-x-1 max-sm:after:top-1/2 max-sm:after:h-10 max-sm:after:-translate-y-1/2 max-sm:after:content-['']";
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const t = useT();
  if (!items.length) return null;
  return (
    <nav aria-label={t("common.breadcrumb")} className={cn("flex min-w-0", className)}>
      <ol className="t-kicker flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-ink-3">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const label = i === 0 && isRootHref(item.href) ? t("common.home") : item.label;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-2", !last && "shrink-0")}>
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  lang={item.lang}
                  className={cn(
                    "inline-block py-1.5 transition-colors duration-(--dur-1) hover:text-ink",
                    TAP_AREA,
                    item.tone === "cat" && "text-cat-ink",
                  )}
                >
                  {label}
                </Link>
              ) : (
                <span
                  lang={item.lang}
                  aria-current={last ? "page" : undefined}
                  className={cn("block truncate py-1.5", last ? "text-ink" : "", item.tone === "cat" && "text-cat-ink")}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

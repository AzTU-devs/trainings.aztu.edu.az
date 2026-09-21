"use client";

import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import { isLocale } from "@/i18n/config";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

export type Crumb = { label: string; href?: string };

/**
 * A leading crumb that points at the site root ("/", "/az", "/en") is drawn as
 * a house icon, and its accessible name always comes from the dictionary — so
 * the trail never shows an English "Home" on /az, whatever label the caller
 * happened to pass.
 */
function isRootHref(href: string | undefined): boolean {
  if (!href) return false;
  const segments = href.split(/[?#]/)[0].split("/").filter(Boolean);
  return segments.length === 0 || (segments.length === 1 && isLocale(segments[0]));
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  const t = useT();
  if (!items.length) return null;
  return (
    <nav aria-label={t("common.breadcrumb")} className={cn("flex min-w-0", className)}>
      <ol className="inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-full border border-border/80 bg-card/80 p-1 text-[13px] elev-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const home = i === 0 && !last && isRootHref(item.href);
          return (
            <li
              key={i}
              className={cn("flex items-center gap-0.5", last ? "min-w-0" : "shrink-0")}
            >
              {i > 0 ? (
                <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground/60" />
              ) : null}
              {home && item.href ? (
                // Crumbs are 40px on phones (the tap-target minimum) and
                // tighten to 28px from sm, where a pointer is the norm.
                <Link
                  href={item.href}
                  className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:size-7"
                >
                  <House aria-hidden className="size-4 sm:size-3.5" />
                  <span className="sr-only">{t("common.home")}</span>
                </Link>
              ) : item.href && !last ? (
                <Link
                  href={item.href}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-7 sm:min-w-0 sm:px-2.5"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(
                    "truncate px-3 font-semibold sm:px-2.5",
                    last ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

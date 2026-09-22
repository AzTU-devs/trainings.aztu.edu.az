"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";

/**
 * The order the languages are *shown* in. Azerbaijani is the site's primary
 * language, so it leads; the rest keep their config order. Sorted here rather
 * than by reordering `locales`, which other code relies on.
 */
const DISPLAY_ORDER: readonly Locale[] = [...locales].sort(
  (a, b) => Number(b === "az") - Number(a === "az"),
);

/** The current URL with its locale segment swapped. */
function hrefFor(pathname: string, next: Locale) {
  const segments = pathname.split("/");
  if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
    segments[1] = next;
  } else {
    segments.splice(1, 0, next);
  }
  return segments.join("/") || `/${next}`;
}

/**
 * The same, plus the query string and hash the visitor is on now, so the
 * catalogue's filters, search, view and page (and a login's ?next=) survive
 * the switch. Read from `window.location` at the moment of use rather than
 * through useSearchParams: the header renders on every page, including static
 * ones, where useSearchParams would need a Suspense boundary around it, and
 * the server-rendered href would not match the browser's.
 */
function liveHrefFor(pathname: string, next: Locale) {
  return `${hrefFor(pathname, next)}${window.location.search}${window.location.hash}`;
}

/** Swaps the locale segment of the current URL and remembers the choice. */
function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale();

  return (next: Locale) => {
    if (next === current) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    router.push(liveHrefFor(pathname, next));
    router.refresh();
  };
}

/**
 * The language switch as two mono codes, "AZ EN", the current one on a
 * paper-2 chip. Each is a real link to the same page in that language (so it
 * also works as a link), and a click remembers the choice in the NEXT_LOCALE
 * cookie before navigating — the behaviour the switch has always had. The
 * server renders the bare path; the link picks up the current query string as
 * the pointer or focus reaches it, so "open in new tab" keeps it as well.
 *
 * `segmented` is the roomier version for the mobile menu (44px targets).
 */
export function LocaleSwitcher({
  variant = "pill",
  className,
}: {
  variant?: "pill" | "segmented";
  className?: string;
}) {
  const current = useLocale();
  const t = useT();
  const pathname = usePathname();
  const switchTo = useSwitchLocale();
  const roomy = variant === "segmented";

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className={cn("inline-flex items-center font-mono text-xs font-medium tracking-[0.06em]", className)}
    >
      {DISPLAY_ORDER.map((l) => {
        const active = l === current;
        return (
          <a
            key={l}
            href={hrefFor(pathname, l)}
            lang={l}
            hrefLang={l}
            aria-label={localeNames[l]}
            aria-current={active ? "true" : undefined}
            onPointerEnter={(e) => {
              e.currentTarget.href = liveHrefFor(pathname, l);
            }}
            onFocus={(e) => {
              e.currentTarget.href = liveHrefFor(pathname, l);
            }}
            onClick={(e) => {
              e.preventDefault();
              switchTo(l);
            }}
            className={cn(
              "grid place-items-center rounded-tag uppercase transition-colors duration-(--dur-1)",
              roomy ? "h-11 min-w-11 px-3" : "h-8 min-w-8 px-[7px]",
              active ? "bg-paper-2 text-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            {l}
          </a>
        );
      })}
    </div>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";
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

/** Swaps the locale segment of the current URL and remembers the choice. */
export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale();

  return (next: Locale) => {
    if (next === current) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    const segments = pathname.split("/");
    if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    router.push(segments.join("/") || `/${next}`);
    router.refresh();
  };
}

/**
 * `pill` (the default) is a native <select>: accessible and dependency-free,
 * but the raw control looks nothing like the rest of the header — so it is
 * made transparent and overlaid on a styled pill that shows the current
 * locale. Because the select itself is invisible, the pill draws the focus
 * ring on its behalf.
 *
 * `segmented` lays both languages out as a two-button toggle, for the mobile
 * menu sheet where there is room to show the choice instead of hiding it.
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
  const switchTo = useSwitchLocale();

  if (variant === "segmented") {
    return (
      <div
        role="group"
        aria-label={t("nav.language")}
        className={cn("inline-flex rounded-full bg-muted p-1", className)}
      >
        {DISPLAY_ORDER.map((l) => {
          const active = l === current;
          return (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={active}
              onClick={() => switchTo(l)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200",
                active
                  ? "bg-card text-foreground elev-1"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {localeNames[l]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-within:bg-accent focus-within:text-foreground has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-ring",
        className,
      )}
    >
      <Globe className="size-4 shrink-0" aria-hidden />
      {/* The code stays visible at every width: a bare globe would not say
          which language is on. */}
      <span className="uppercase">{current}</span>
      <ChevronDown className="hidden size-3.5 opacity-60 sm:block" aria-hidden />
      <select
        value={current}
        onChange={(e) => switchTo(e.target.value as Locale)}
        aria-label={t("nav.language")}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {DISPLAY_ORDER.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </div>
  );
}

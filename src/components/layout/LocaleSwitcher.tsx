"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

/**
 * A native <select> keeps this accessible and dependency-free, but the raw
 * control looks nothing like the rest of the header — so it is made transparent
 * and overlaid on a styled pill that shows the current locale.
 */
export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Locale;
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

  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-within:bg-accent focus-within:text-foreground">
      <Globe className="size-4 shrink-0" aria-hidden />
      <span className="hidden font-medium uppercase sm:inline">{current}</span>
      <select
        value={current}
        onChange={onChange}
        aria-label="Language"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </div>
  );
}

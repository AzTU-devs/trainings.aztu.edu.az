import type { Locale } from "./config";

export function localeHref(locale: Locale, path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

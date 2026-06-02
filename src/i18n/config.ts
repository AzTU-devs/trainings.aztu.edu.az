export const locales = ["en", "az"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  az: "Azərbaycan",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/*
 * Number formatting that prints the same text on the server and in the browser.
 *
 * Most of these strings come out of client components that render twice —
 * once in Node and once in the browser — and the two must agree or React
 * reports a hydration mismatch. Node carries full CLDR data; browsers often do
 * not have Azerbaijani (Chrome formats `az` with root data: "AZN 1,250" where
 * Node prints "1.250 ₼", and "1.2K" where Node prints "1,2K"). So:
 *   - English goes through Intl, which every engine carries in full;
 *   - Azerbaijani is assembled here from Latin digits with its own separators
 *     ("1.234,5"), the currency symbol after the amount and the CLDR short
 *     units (K, mln, mlrd).
 * Every function takes the page's locale — never the runtime default, which
 * differs between the server and each visitor's browser.
 */

/** Azerbaijani writes "1.234,5": the en-US separators, swapped. */
function azSeparators(enUs: string) {
  return enUs.replace(/[.,]/g, (c) => (c === "," ? "." : ","));
}

/** A plain number in the page's locale: "1,234.5" / "1.234,5". */
export function formatNumber(value: number, locale: string, maxFractionDigits = 0) {
  if (locale !== "az") {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(value);
  }
  return azSeparators(
    new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFractionDigits }).format(value),
  );
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AZN: "₼",
  USD: "$",
  EUR: "€",
  GBP: "£",
  TRY: "₺",
  RUB: "₽",
};

/** "1.250 ₼" in Azerbaijani, "₼1,250" in English; whole amounts drop the decimals. */
export function formatPrice(amount: string | number, currency: string, locale: string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "";
  const fraction = n % 1 === 0 ? 0 : 2;
  const code = (currency || "AZN").toUpperCase();
  if (locale === "az") {
    const digits = azSeparators(
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
      }).format(n),
    );
    return `${digits} ${CURRENCY_SYMBOLS[code] ?? code}`;
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    }).format(n);
  } catch {
    // A currency code Intl does not know.
    return `${formatNumber(n, locale, fraction)} ${code}`;
  }
}

/** "1,2K" / "12 mln" in Azerbaijani, "1.2K" / "12M" in English. */
export function formatCompact(value: number, locale: string) {
  if (locale !== "az") {
    return new Intl.NumberFormat(locale, { notation: "compact" }).format(value);
  }
  const abs = Math.abs(value);
  const steps: [number, string][] = [
    [1e9, " mlrd"],
    [1e6, " mln"],
    [1e3, "K"],
  ];
  for (const [size, unit] of steps) {
    if (abs >= size) {
      const scaled = value / size;
      // One decimal below 100 ("1,2K", "12,5 mln"), none above, as CLDR does.
      return formatNumber(scaled, "az", Math.abs(scaled) < 100 ? 1 : 0) + unit;
    }
  }
  return formatNumber(value, "az");
}

/** A 0–5 average with one decimal: "4.5" in English, "4,5" in Azerbaijani. */
export function formatRating(value: string | number, locale: string) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "";
  const fixed = n.toFixed(1);
  return locale === "az" ? fixed.replace(".", ",") : fixed;
}

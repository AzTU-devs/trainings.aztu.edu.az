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

/*
 * Dates. Built from month tables in both languages rather than Intl: browsers
 * lack Azerbaijani data, and even English differs between ICU versions (en-GB
 * abbreviates September as "Sept" in newer data, "Sep" in older), which would
 * be a hydration mismatch in a client component. Always read in UTC, so a date
 * is the same day on the server and in every visitor's time zone.
 * Instants (enrolment, review, order and publication timestamps) go through
 * bakuDate/bakuTime instead, so they print the university's calendar day
 * rather than Greenwich's.
 */
const MONTHS: Record<"az" | "en", { long: string[]; short: string[] }> = {
  az: {
    long: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
    short: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"],
  },
  en: {
    long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
};

type DateOpts = { month?: "long" | "short"; year?: boolean };

/** Parses an ISO date or date-time; a bare "2026-09-14" is read as UTC midnight. */
function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "14 sentyabr 2026" / "14 September 2026"; short: "6 okt" / "6 Oct". Empty for a missing or bad date. */
export function formatDate(iso: string | null | undefined, locale: string, opts: DateOpts = {}) {
  const d = parseIso(iso);
  if (!d) return "";
  const names = MONTHS[locale === "az" ? "az" : "en"][opts.month ?? "long"];
  const base = `${d.getUTCDate()} ${names[d.getUTCMonth()]}`;
  return opts.year === false ? base : `${base} ${d.getUTCFullYear()}`;
}

/**
 * "6 okt – 27 noy 2026" within one year (the year once, at the end), full
 * dates on both sides otherwise. With `year: false` no year is printed.
 */
export function formatDateRange(
  from: string | null | undefined,
  to: string | null | undefined,
  locale: string,
  opts: DateOpts = {},
) {
  const a = parseIso(from);
  const b = parseIso(to);
  if (!a) return b ? formatDate(to, locale, opts) : "";
  if (!b) return formatDate(from, locale, opts);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const left = formatDate(from, locale, { ...opts, year: sameYear ? false : opts.year });
  return `${left} – ${formatDate(to, locale, opts)}`;
}

/*
 * Baku time: UTC+4 all year (no daylight saving since 2016). A timestamp is
 * shifted by four hours and then read as UTC by the helpers above, which
 * prints the day and clock in Baku on the server and in every browser alike,
 * with no Intl time-zone data involved. Otherwise 00:00–04:00 in Baku
 * (20:00–24:00 UTC) would show the previous day.
 */
const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;

/**
 * The instant moved to Baku wall-clock time, read back as UTC. A bare date
 * ("2026-09-14") is a calendar day already, so it is left alone.
 */
function inBaku(iso: string | null | undefined): Date | null {
  const d = parseIso(iso);
  if (!d || !iso) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? d : new Date(d.getTime() + BAKU_OFFSET_MS);
}

/** formatDate for a timestamp, on the Baku calendar: "22 sentyabr 2026". */
export function bakuDate(iso: string | null | undefined, locale: string, opts: DateOpts = {}) {
  const d = inBaku(iso);
  return d ? formatDate(d.toISOString(), locale, opts) : "";
}

/** The Baku wall-clock time of a timestamp, "09:05". Empty for a missing or bad date. */
export function bakuTime(iso: string | null | undefined) {
  const d = inBaku(iso);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

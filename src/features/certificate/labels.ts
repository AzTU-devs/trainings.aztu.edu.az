import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/format";
import { hash } from "@/lib/art";

/**
 * Every word the certificate prints, in the page's language, built once on the
 * server and handed to <CertificateTemplate> as plain data — so the template
 * itself needs no translation context and renders the same wherever it runs.
 */
export type CertificateLabels = {
  locale: Locale;
  title: string;
  subtitle: string;
  university: string;
  /** Set around the seal, already in capitals (casing Azerbaijani needs locale data we avoid). */
  sealText: string;
  recipientPlaceholder: string;
  completed: string;
  category: string;
  hours: string;
  date: string;
  idLabel: string;
  instructor: string;
  /** The readable summary under a small sheet (CertificateStage): its labels for the name and the course. */
  readName: string;
  readCourse: string;
  centre: string;
  centreSub: string;
  sample: string;
  caption: string;
  captionSample: string;
  /** Month names, January first, from the same keys the course page uses. */
  months: string[];
};

export function certificateLabels(t: TFunction, locale: Locale): CertificateLabels {
  return {
    locale,
    title: t("certificate.title"),
    subtitle: t("certificate.subtitle"),
    university: t("certificate.university"),
    sealText: t("certificate.sealText"),
    recipientPlaceholder: t("certificate.recipient"),
    completed: t("certificate.completed"),
    category: t("certificate.category"),
    hours: t("certificate.hours"),
    date: t("certificate.date"),
    idLabel: t("certificate.idLabel"),
    instructor: t("certificate.instructor"),
    readName: t("certificate.readName"),
    readCourse: t("certificate.readCourse"),
    centre: t("certificate.centre"),
    centreSub: t("certificate.centreSub"),
    sample: t("certificate.sample"),
    caption: t("certificate.caption"),
    captionSample: t("certificate.captionSample"),
    months: Array.from({ length: 12 }, (_, i) => t(`course2.month${i + 1}`)),
  };
}

/**
 * "22 sentyabr 2026" / "September 22, 2026", read straight from the ISO date's
 * digits: no Date parsing (no time zone can shift the day) and no Intl (the
 * browser has no Azerbaijani month names).
 */
export function formatCertDate(iso: string, labels: Pick<CertificateLabels, "locale" | "months">): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  const month = labels.months[Number(mo) - 1] ?? mo;
  const day = String(Number(d));
  return labels.locale === "az" ? `${day} ${month} ${y}` : `${month} ${day}, ${y}`;
}

/** Crockford's base 32: no I, L, O or U, so a number read aloud or retyped cannot be misread. */
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * A certificate number such as "AZTU-EDU-2026-7F3K-9Q2M": the year, then
 * eight characters derived from the seed (the participant and the course on a
 * preview, the course alone on a public sample). The same seed gives the same
 * number on every render and every machine.
 */
export function certificateId(seed: string, year: string | number): string {
  const a = hash(`cert:${seed}`);
  const b = hash(`${seed}:cert`);
  let out = "";
  for (let i = 0; i < 8; i++) {
    const word = i < 5 ? a >>> (i * 6) : b >>> ((i - 5) * 6);
    out += B32[word & 31];
  }
  return `AZTU-EDU-${year}-${out.slice(0, 4)}-${out.slice(4)}`;
}

/**
 * The course's length as the certificate states it: in-person courses carry
 * their contact hours, online courses the length of their lessons.
 */
export function hoursText(t: TFunction, input: { totalHours?: string | number | null; seconds?: number | null }): string | null {
  const total = Number(input.totalHours);
  if (Number.isFinite(total) && total > 0) return t("certificate.hoursValue", { h: total });
  const s = input.seconds ?? 0;
  if (s <= 0) return null;
  // Round to whole minutes first, so 2 h 59 min 45 s reads "3 hours", not
  // "2 hours 60 min".
  const minutes = Math.round(s / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return t("certificate.hoursMinutes", { h, m });
  if (h) return t("certificate.hoursValue", { h });
  return t("certificate.minutesValue", { m: Math.max(1, m) });
}

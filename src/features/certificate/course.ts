import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/format";
import type { CertificateTemplateProps } from "./CertificateTemplate";
import { isoDay } from "./date";
import { certificateId, certificateLabels, hoursText } from "./labels";

/**
 * The date a course's sample certificate carries. A certificate is issued when
 * the course is finished, so an in-person course that has not ended yet is
 * dated its last day — never before the course has even begun. Otherwise
 * (online, or already over) it is today.
 */
export function certificateDate(today: string, endDate?: string | null): string {
  const end = isoDay(endDate);
  return end && end > today ? end : today;
}

/**
 * The certificate a course would carry, filled in from what the page already
 * knows about the course. Always a sample: the platform does not issue
 * certificates yet, so the recipient stays the placeholder unless the caller
 * has the signed-in participant's own name, and the "Sample" stamp stays on.
 */
export function courseCertificate(input: {
  t: TFunction;
  locale: Locale;
  /** YYYY-MM-DD in Baku, from the server (bakuDateISO in ./date). */
  today: string;
  /**
   * The date printed on the certificate, when it is not today: an in-person
   * course's last day (see certificateDate), or the day a participant finished.
   * The number's year follows it.
   */
  dateISO?: string | null;
  courseId: string;
  /**
   * Seeds the certificate number. Defaults to the course id, which is right
   * for a public sample; a participant's preview adds their own id, so two
   * people never see the same number.
   */
  idSeed?: string;
  title: string;
  categoryName?: string | null;
  expertName?: string | null;
  /** In-person courses: their contact hours. */
  totalHours?: string | number | null;
  /** Online courses: the length of their lessons. */
  seconds?: number | null;
  recipient?: string | null;
}): CertificateTemplateProps {
  const { t, locale } = input;
  const date = isoDay(input.dateISO) ?? input.today;
  return {
    recipient: input.recipient ?? null,
    courseTitle: input.title,
    categoryName: input.categoryName ?? null,
    hours: hoursText(t, { totalHours: input.totalHours, seconds: input.seconds }),
    dateISO: date,
    expertName: input.expertName ?? null,
    certificateId: certificateId(input.idSeed ?? input.courseId, date.slice(0, 4)),
    sample: true,
    labels: certificateLabels(t, locale),
  };
}

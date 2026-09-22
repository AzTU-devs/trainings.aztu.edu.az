import { cn } from "@/lib/utils/cn";
import { CertificateTemplate, type CertificateTemplateProps } from "./CertificateTemplate";
import { formatCertDate } from "./labels";

/**
 * The certificate shown as an object on a page: the sheet lies across the
 * edge of a soft colour field (the design's category fields — brand navy
 * unless `k` names a category's hue), over a second, blank sheet, like the
 * top of a small stack. `tilt` turns it a couple of degrees, which reads as
 * "a document" rather than "a screenshot"; it straightens a little when
 * pointed at.
 *
 * The field is the only part that follows the site's theme; the sheet keeps
 * its paper colours in dark mode.
 *
 * The sheet scales as one piece, so where it is shown small (a phone, a
 * narrow column) its details shrink below reading size. There the stage adds
 * them under the sheet as ordinary text — pure CSS (a container query on the
 * stage's own width), so nothing differs between the server and the browser.
 */
export function CertificateStage({
  tilt = false,
  k = "k-navy",
  className,
  ...certificate
}: CertificateTemplateProps & { tilt?: boolean; /** Hue-engine class for the field, e.g. the course's category. */ k?: string }) {
  const { labels } = certificate;
  const rows: { label: string; value: string; wide?: boolean; mono?: boolean }[] = [
    { label: labels.readName, value: certificate.recipient?.trim() || labels.recipientPlaceholder, wide: true },
    { label: labels.readCourse, value: certificate.courseTitle, wide: true },
  ];
  if (certificate.categoryName) rows.push({ label: labels.category, value: certificate.categoryName });
  if (certificate.hours) rows.push({ label: labels.hours, value: certificate.hours });
  rows.push({ label: labels.date, value: formatCertDate(certificate.dateISO, labels) });
  if (certificate.expertName) rows.push({ label: labels.instructor, value: certificate.expertName });
  rows.push({ label: labels.idLabel, value: certificate.certificateId, wide: true, mono: true });
  // An odd number of half-width rows would leave a gap before the number.
  const halves = rows.filter((r) => !r.wide);
  if (halves.length % 2) halves[halves.length - 1].wide = true;

  return (
    <div className={cn("cert-stage-box", className)}>
      <div className={cn("cert-stage", k, tilt && "is-tilted")}>
        <div aria-hidden className="cert-stage-field">
          <span className="cert-stage-grid" />
        </div>
        <div className="cert-stage-pile">
          <div aria-hidden className="cert-stage-under" />
          <CertificateTemplate {...certificate} className="cert-lift cert-stage-sheet" />
        </div>
      </div>

      {/* The same words as the sheet, which a screen reader already reads in
          full, so this copy is for the eye only. */}
      <div aria-hidden className="cert-read">
        <p className="cert-read-h">{certificate.sample ? labels.captionSample : labels.caption}</p>
        <dl>
          {rows.map((r) => (
            <div key={r.label} className={cn(r.wide && "is-wide")}>
              <dt>{r.label}</dt>
              <dd className={cn(r.mono && "is-mono")}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

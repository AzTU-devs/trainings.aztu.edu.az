import Image from "next/image";
import { Svg } from "@/components/bright/Svg";
import { hash } from "@/lib/art";
import { cn } from "@/lib/utils/cn";
import { certificateArt } from "./art";
import { certSerif } from "./fonts";
import { formatCertDate, type CertificateLabels } from "./labels";
import "./certificate.css";

export type CertificateTemplateProps = {
  /** The participant's full name; without one the placeholder ("Adınız Soyadınız") is printed. */
  recipient?: string | null;
  courseTitle: string;
  categoryName?: string | null;
  /** Already worded, e.g. "24 saat" (see hoursText in ./labels). */
  hours?: string | null;
  /** YYYY-MM-DD, computed on the server. */
  dateISO: string;
  expertName?: string | null;
  certificateId: string;
  /** Stamps "NÜMUNƏ" / "SAMPLE" across the sheet. */
  sample: boolean;
  labels: CertificateLabels;
  className?: string;
};

/**
 * Nothing measures text on the server, so a long name or course title steps
 * down a size by its length instead: "m" past `m` characters, "s" past `s`.
 * The sheet scales as one piece, so a length that fits on one screen fits on
 * every screen.
 */
function sizeOf(text: string, m: number, s: number): "m" | "s" | undefined {
  const n = text.trim().length;
  return n > s ? "s" : n > m ? "m" : undefined;
}

/**
 * The course certificate: an A4 landscape sheet that scales as one piece.
 *
 * Every length inside is a millimetre of the sheet (`--mm`, a share of the
 * container's width — see certificate.css), so a 320px phone and a desktop
 * show the same composition with the same line breaks, only smaller (where
 * that is too small to read, CertificateStage adds the details as plain text
 * under the sheet). It is a paper artifact, so it keeps its ivory, navy and
 * gold in dark mode.
 *
 * Server-rendered with no client JavaScript: the drawn layer (frame, ribbon,
 * guilloche, seal) is SVG markup from ./art, and every word a reader needs is
 * real text in reading order, so it can be selected, translated and read by a
 * screen reader. The figure is named by a short caption for those who only
 * want the summary.
 */
export function CertificateTemplate({
  recipient,
  courseTitle,
  categoryName,
  hours,
  dateISO,
  expertName,
  certificateId,
  sample,
  labels,
  className,
}: CertificateTemplateProps) {
  // Unique per certificate and course, so two sheets on one page never share SVG ids.
  const uid = `ct${hash(`${certificateId}|${courseTitle}`).toString(36)}`;
  const name = recipient?.trim() || null;
  const date = formatCertDate(dateISO, labels);
  const facts: [string, string][] = [];
  if (categoryName) facts.push([labels.category, categoryName]);
  if (hours) facts.push([labels.hours, hours]);
  facts.push([labels.date, date]);

  return (
    <figure className={cn("cert", certSerif.variable, className)}>
      <figcaption className="sr-only">
        {`${sample ? labels.captionSample : labels.caption}: ${courseTitle}`}
      </figcaption>
      <div className="cert-sheet">
        <Svg markup={certificateArt(certificateId, uid, labels.sealText)} className="cert-art" />

        <div className="cert-col">
          <div className="cert-brand">
            {/* Declared at about the size it is shown (the file is 276 × 512),
                so the optimiser serves a small file for a small mark. */}
            <Image src="/brand/aztu-mark.png" alt="" width={28} height={52} className="cert-shield" />
            <p className="cert-logo">
              <small>AZTU</small>{" "}
              <b>EduPlatform</b>
            </p>
          </div>
          <p className="cert-uni">{labels.university}</p>

          <p className="cert-title">{labels.title}</p>
          <p className="cert-sub">
            <span aria-hidden className="cert-sub-rule" />
            {labels.subtitle}
            <span aria-hidden className="cert-sub-rule" />
          </p>

          <p className={cn("cert-name", !name && "is-placeholder")} data-size={sizeOf(name ?? "", 24, 32)}>
            {name ?? labels.recipientPlaceholder}
          </p>
          <span aria-hidden className="cert-name-rule" />
          <p className="cert-done">{labels.completed}</p>
          <p className="cert-course" data-size={sizeOf(courseTitle, 40, 64)}>
            {courseTitle}
          </p>

          {sample ? (
            // In the column's flow, in the space the title leaves above the
            // facts, so a title of any length pushes it down instead of
            // running under it. The caption already says "sample" to a screen
            // reader.
            <div className="cert-stamp-slot" aria-hidden>
              <p className="cert-stamp">
                <span>{labels.sample}</span>
              </p>
            </div>
          ) : null}

          <dl className="cert-facts">
            {facts.map(([l, v]) => (
              <div key={l}>
                <dt>{l}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="cert-signs">
            <div className="cert-sign">
              <span aria-hidden className="cert-sign-line" />
              {expertName ? <p className="cert-sign-who">{expertName}</p> : null}
              <p className={expertName ? "cert-sign-role" : "cert-sign-who"}>{labels.instructor}</p>
            </div>
            <p className="cert-id">
              <span className="cert-id-label">{labels.idLabel}</span>
              <span className="cert-id-num">{certificateId}</span>
            </p>
            <div className="cert-sign">
              <span aria-hidden className="cert-sign-line" />
              <p className="cert-sign-who">{labels.centre}</p>
              <p className="cert-sign-role">{labels.centreSub}</p>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

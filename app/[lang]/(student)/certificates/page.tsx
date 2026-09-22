import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { LinkGo } from "@/components/ui/link-go";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AccountIntro } from "../_components/AccountIntro";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("nav.certificates") };
}

/**
 * Certificates are not built yet, so this page says exactly that and nothing
 * more: no sample certificate, and no promise about which courses will issue
 * one. "Not yet" is said once (the empty state's title and line); the lead
 * only says what the section is for. The full-size plate, as on the
 * catalogue's empty state, so the page reads as designed rather than stubbed.
 */
export default async function CertificatesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div>
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("nav.certificates")}
        description={t("student.certificatesSubtitle")}
      />
      <EmptyState
        plate={t("student.plateCertificates")}
        headingLevel="h2"
        title={t("student.certificatesEmpty")}
        description={t("student.certificatesEmptyHint")}
        // The account column is 8–9 page columns, not the catalogue's 12, so
        // the plate takes five of the empty state's twelve (four leave it a
        // third smaller than the catalogue's) and the text follows at 6–12.
        className="mt-10 md:mt-14 lg:[&>*:first-child]:col-span-5"
        action={<LinkGo href={localeHref(locale, "/my-courses")}>{t("nav.myCourses")}</LinkGo>}
      />
    </div>
  );
}

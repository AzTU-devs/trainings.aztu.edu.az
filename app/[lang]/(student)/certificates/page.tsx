import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";

export const metadata: Metadata = { title: "Certificates" };

type Props = { params: Promise<{ lang: string }> };

export default async function CertificatesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getT(lang as Locale);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl leading-tight">{t("nav.certificates")}</h1>
      <EmptyState
        title={t("student.certificatesEmpty")}
        description={t("student.certificatesEmptyHint")}
      />
    </div>
  );
}

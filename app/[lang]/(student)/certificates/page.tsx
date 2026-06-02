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
      <h1 className="text-3xl font-bold tracking-tight">{t("nav.certificates")}</h1>
      <EmptyState
        title="—"
        description="Certificates will appear here once you complete courses."
      />
    </div>
  );
}

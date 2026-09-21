import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
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

export default async function CertificatesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="space-y-8">
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("nav.certificates")}
        description={t("student.certificatesSubtitle")}
      />
      <EmptyState
        icon={<Award strokeWidth={1.75} />}
        title={t("student.certificatesEmpty")}
        description={t("student.certificatesEmptyHint")}
        action={
          <Link
            href={localeHref(locale, "/my-courses")}
            className={buttonVariants({ variant: "soft" })}
          >
            {t("nav.myCourses")}
          </Link>
        }
      />
    </div>
  );
}

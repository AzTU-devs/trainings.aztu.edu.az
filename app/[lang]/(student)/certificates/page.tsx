import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { CertificateStage } from "@/features/certificate/CertificateStage";
import { participantCertificate } from "@/features/certificate/preview.server";
import { getSession } from "@/lib/auth/session";
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

  // The layout has already loaded the session (getSession is cached per
  // request), so the name is on the server: the preview renders with it and
  // nothing changes after hydration.
  const user = await getSession();
  const preview = await participantCertificate(user, t, locale);

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

      {/* Certificates are not issued yet; this shows what one will look like,
          filled in with the participant's own name and stamped "Sample". */}
      <section aria-labelledby="cert-preview-t" className="pt-2">
        <h2 id="cert-preview-t" className="font-display text-balance text-2xl leading-tight sm:text-[28px]">
          {t("certificate.previewTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {t("certificate.previewHint")}
        </p>
        <CertificateStage className="mt-6" {...preview} />
      </section>
    </div>
  );
}

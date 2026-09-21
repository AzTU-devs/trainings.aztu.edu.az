import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { TutorRegisterForm } from "@/features/auth/components/TutorRegisterForm";
import { RegisterRoleTabs } from "@/features/auth/components/RegisterRoleTabs";
import { categoryServerApi } from "@/features/category/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AuthCard, AuthFooterLink } from "../../_components/AuthCard";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("auth.tutorRegisterTitle"), description: t("auth.tutorRegisterSubtitle") };
}

export default async function TutorRegisterPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const categories = await categoryServerApi.list().catch(() => []);

  return (
    <AuthCard
      size="wide"
      icon={<GraduationCap />}
      title={t("auth.tutorRegisterTitle")}
      subtitle={t("auth.tutorRegisterSubtitle")}
      footer={
        <p>
          {t("auth.hasAccount")}{" "}
          <AuthFooterLink href={localeHref(locale, "/login")}>{t("common.signIn")}</AuthFooterLink>
        </p>
      }
    >
      <RegisterRoleTabs
        locale={locale}
        active="tutor"
        studentLabel={t("auth.studentTab")}
        tutorLabel={t("auth.tutorTab")}
      />

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-navy-50/70 p-4 text-sm leading-relaxed text-navy-800 ring-1 ring-inset ring-navy-100 dark:bg-navy-900/40 dark:text-navy-100 dark:ring-navy-800/70">
        <ShieldCheck className="mt-0.5 size-[18px] shrink-0" aria-hidden />
        <p>{t("auth.tutorApprovalNote")}</p>
      </div>

      <div className="mt-8">
        <TutorRegisterForm categories={categories ?? []} />
      </div>
    </AuthCard>
  );
}

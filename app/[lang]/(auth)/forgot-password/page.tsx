import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AuthBackLink, AuthCard } from "../_components/AuthCard";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("auth.forgotTitle"), description: t("auth.forgotSubtitle") };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <AuthCard
      icon={<KeyRound />}
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      footer={
        <AuthBackLink href={localeHref(locale, "/login")}>{t("auth.backToLogin")}</AuthBackLink>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}


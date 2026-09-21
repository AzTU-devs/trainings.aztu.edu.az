import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AuthBackLink, AuthCard } from "../_components/AuthCard";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("auth.resetTitle"), description: t("auth.resetSubtitle") };
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const { token } = await searchParams;
  const resetToken = Array.isArray(token) ? token[0] : token;

  return (
    <AuthCard
      icon={<KeyRound />}
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
      footer={
        <AuthBackLink href={localeHref(locale, "/login")}>{t("auth.backToLogin")}</AuthBackLink>
      }
    >
      <ResetPasswordForm token={resetToken} />
    </AuthCard>
  );
}

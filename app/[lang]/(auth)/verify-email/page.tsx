import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { VerifyEmail } from "@/features/auth/components/VerifyEmail";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { AuthCard } from "../_components/AuthCard";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("auth.verifyTitle"), description: t("auth.verifySubtitle") };
}

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const { token } = await searchParams;
  const verifyToken = Array.isArray(token) ? token[0] : token;

  return (
    <AuthCard
      icon={<MailCheck />}
      title={t("auth.verifyTitle")}
      subtitle={t("auth.verifySubtitle")}
    >
      <VerifyEmail token={verifyToken} />
    </AuthCard>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { VerifyEmail } from "@/features/auth/components/VerifyEmail";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your EduPlatform email address.",
};

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const { token } = await searchParams;
  const verifyToken = Array.isArray(token) ? token[0] : token;

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("auth.verifyTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.verifySubtitle")}</p>
        </div>
      </header>

      <VerifyEmail token={verifyToken} />
    </div>
  );
}

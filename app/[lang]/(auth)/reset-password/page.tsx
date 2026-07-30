import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your EduPlatform account.",
};

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const { token } = await searchParams;
  const resetToken = Array.isArray(token) ? token[0] : token;

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("auth.resetTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.resetSubtitle")}</p>
        </div>
      </header>

      <ResetPasswordForm token={resetToken} />

      <p className="text-center text-sm">
        <Link
          href={localeHref(locale, "/login")}
          className="font-medium text-primary hover:underline"
        >
          {t("auth.backToLogin")}
        </Link>
      </p>
    </div>
  );
}

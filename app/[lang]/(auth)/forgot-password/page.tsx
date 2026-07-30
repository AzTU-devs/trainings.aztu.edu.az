import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset access to your EduPlatform account.",
};

type Props = { params: Promise<{ lang: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("auth.forgotTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.forgotSubtitle")}</p>
        </div>
      </header>

      <ForgotPasswordForm />

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

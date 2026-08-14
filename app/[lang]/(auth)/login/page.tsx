import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your EduPlatform account.",
};

type Props = { params: Promise<{ lang: string }> };

export default async function LoginPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <LogIn className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("auth.loginTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </div>
      </header>

      <Suspense fallback={<div className="h-64" />}>
        <LoginForm />
      </Suspense>

      <div className="space-y-3 text-center text-sm">
        <Link
          href={localeHref(locale, "/forgot-password")}
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {t("auth.forgotLink")}
        </Link>
        <p className="text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link
            href={localeHref(locale, "/register")}
            className="text-primary font-medium hover:underline"
          >
            {t("common.signUp")}
          </Link>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-center text-sm">
        <p className="text-muted-foreground">{t("auth.tutorLoginPrompt")}</p>
        <a
          href={env.NEXT_PUBLIC_PORTAL_URL}
          className="mt-1 inline-block font-medium text-primary hover:underline"
        >
          {t("auth.tutorLoginCta")} →
        </a>
      </div>

      <p className="text-balance text-center text-[11px] leading-relaxed text-muted-foreground">
        By signing in you agree to the AZTU EduPlatform Terms and Privacy Policy.
      </p>
    </div>
  );
}

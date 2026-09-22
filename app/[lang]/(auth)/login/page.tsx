import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { env } from "@/lib/env";
import { AuthCard, AuthLinks } from "../_components/AuthCard";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("common.signIn"), description: t("auth.loginSubtitle") };
}

export default async function LoginPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // No "by signing in you agree to the Terms and Privacy Policy" note: the
  // platform has no such documents to link to yet, and people should not be
  // asked to agree to something they cannot read. Restore it (as links) when
  // they exist, under a new key that names the real documents: the old
  // `auth.legalSignIn`/`legalSignUp` keys no longer hold that wording.
  return (
    <AuthCard
      kicker={t("auth.kickerLogin")}
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <AuthLinks
          items={[
            {
              label: t("auth.noAccount"),
              href: localeHref(locale, "/register"),
              cta: t("common.signUp"),
            },
            // Experts and admins work in the separate portal app.
            {
              label: t("auth.tutorLoginPrompt"),
              href: env.NEXT_PUBLIC_PORTAL_URL,
              cta: t("auth.tutorLoginCta"),
              portal: true,
            },
          ]}
        />
      }
    >
      {/* Same height as the form, so nothing jumps when it mounts. */}
      <Suspense fallback={<div className="h-[16.5rem]" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

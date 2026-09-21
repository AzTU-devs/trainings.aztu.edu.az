import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, GraduationCap, LogIn } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { env } from "@/lib/env";
import { AuthCard, AuthFooterLink } from "../_components/AuthCard";

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
  // they exist — the `auth.legalSignIn` key is kept for that.
  return (
    <AuthCard
      icon={<LogIn />}
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <p>
          {t("auth.noAccount")}{" "}
          <AuthFooterLink href={localeHref(locale, "/register")}>{t("common.signUp")}</AuthFooterLink>
        </p>
      }
    >
      <Suspense fallback={<div className="h-64" />}>
        <LoginForm />
      </Suspense>

      {/* Experts and admins work in the separate portal app. */}
      <div className="mt-6 flex items-center gap-3.5 rounded-2xl bg-muted/70 p-4 dark:bg-accent/50">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-card text-navy-700 ring-1 ring-inset ring-border dark:text-navy-100">
          <GraduationCap className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 text-sm">
          <p className="text-muted-foreground">{t("auth.tutorLoginPrompt")}</p>
          <a
            href={env.NEXT_PUBLIC_PORTAL_URL}
            // Padding makes a 40px tap target without changing the line height.
            className="-my-2.5 inline-flex items-center gap-1 py-2.5 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("auth.tutorLoginCta")}
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>
    </AuthCard>
  );
}

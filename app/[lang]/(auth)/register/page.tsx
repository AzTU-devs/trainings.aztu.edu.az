import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { RegisterRoleTabs } from "@/features/auth/components/RegisterRoleTabs";
import { SocialAuthButtons } from "@/features/auth/components/SocialAuthButtons";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Join EduPlatform and start learning today.",
};

type Props = { params: Promise<{ lang: string }> };

export default async function RegisterPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UserPlus className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("auth.registerTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.registerSubtitle")}
          </p>
        </div>
      </header>

      <RegisterRoleTabs
        locale={locale}
        active="student"
        studentLabel={t("auth.studentTab")}
        tutorLabel={t("auth.tutorTab")}
      />

      <SocialAuthButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative mx-auto block w-fit bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">
          Or with email
        </span>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link
          href={localeHref(locale, "/login")}
          className="text-primary font-medium hover:underline"
        >
          {t("common.signIn")}
        </Link>
      </p>

      <p className="text-balance text-center text-[11px] leading-relaxed text-muted-foreground">
        By creating an account you agree to the AZTU EduPlatform Terms and Privacy Policy.
      </p>
    </div>
  );
}

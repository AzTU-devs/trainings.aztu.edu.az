import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { RegisterRoleTabs } from "@/features/auth/components/RegisterRoleTabs";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AuthCard, AuthLinks } from "../_components/AuthCard";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("auth.registerTitle"), description: t("auth.registerSubtitle") };
}

export default async function RegisterPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // No Terms / Privacy note until those documents exist to link to (see the
  // sign-in page).
  return (
    <AuthCard
      kicker={t("auth.kickerRegister")}
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <AuthLinks
          items={[
            {
              label: t("auth.hasAccount"),
              href: localeHref(locale, "/login"),
              cta: t("common.signIn"),
            },
          ]}
        />
      }
    >
      <RegisterRoleTabs
        locale={locale}
        active="student"
        label={t("auth.roleLabel")}
        studentLabel={t("auth.studentTab")}
        tutorLabel={t("auth.tutorTab")}
      />

      <div className="mt-8">
        <RegisterForm />
      </div>
    </AuthCard>
  );
}

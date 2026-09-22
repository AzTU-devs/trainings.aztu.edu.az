import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TutorRegisterForm } from "@/features/auth/components/TutorRegisterForm";
import { RegisterRoleTabs } from "@/features/auth/components/RegisterRoleTabs";
import { Note } from "@/components/editorial/Note";
import { categoryServerApi } from "@/features/category/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AuthCard, AuthLinks } from "../../_components/AuthCard";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("auth.tutorRegisterTitle"), description: t("auth.tutorRegisterSubtitle") };
}

export default async function TutorRegisterPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const categories = await categoryServerApi.list().catch(() => []);

  return (
    <AuthCard
      kicker={t("auth.kickerTutor")}
      title={t("auth.tutorRegisterTitle")}
      subtitle={t("auth.tutorRegisterSubtitle")}
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
        active="tutor"
        label={t("auth.roleLabel")}
        studentLabel={t("auth.studentTab")}
        tutorLabel={t("auth.tutorTab")}
      />

      {/* What happens after the form, said before it: the account waits for
          an admin, and publishing happens in the portal. */}
      <Note className="mt-8">{t("auth.tutorApprovalNote")}</Note>

      <div className="mt-10">
        <TutorRegisterForm categories={categories ?? []} />
      </div>
    </AuthCard>
  );
}

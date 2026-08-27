import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { TutorRegisterForm } from "@/features/auth/components/TutorRegisterForm";
import { RegisterRoleTabs } from "@/features/auth/components/RegisterRoleTabs";
import { categoryServerApi } from "@/features/category/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = {
  title: "Become a tutor",
  description: "Apply to teach on EduPlatform.",
};

type Props = { params: Promise<{ lang: string }> };

export default async function TutorRegisterPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const categories = await categoryServerApi.list().catch(() => []);

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="size-5" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-3xl leading-tight">
            {t("auth.tutorRegisterTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.tutorRegisterSubtitle")}
          </p>
        </div>
      </header>

      <RegisterRoleTabs
        locale={locale}
        active="tutor"
        studentLabel={t("auth.studentTab")}
        tutorLabel={t("auth.tutorTab")}
      />

      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {t("auth.tutorApprovalNote")}
      </p>

      <TutorRegisterForm categories={categories ?? []} />

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link
          href={localeHref(locale, "/login")}
          className="text-primary font-medium hover:underline"
        >
          {t("common.signIn")}
        </Link>
      </p>
    </div>
  );
}

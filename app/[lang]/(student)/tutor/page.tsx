import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { TutorProfileCard } from "@/features/tutor/components/TutorProfileCard";
import { tutorServerApi } from "@/features/tutor/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "Tutor profile" };

type Props = { params: Promise<{ lang: string }> };

export default async function MyTutorProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const profile = await tutorServerApi.myProfile().catch(() => null);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl leading-tight">{t("nav.tutor")}</h1>

      {profile ? (
        <TutorProfileCard
          tutor={profile}
          labels={{
            reviews: t("tutorPage.reviews", { count: profile.ratingCount }),
            years: t("tutorPage.years", { count: profile.yearsExperience ?? 0 }),
            specialties: t("tutorPage.specialties", {
              count: profile.expertiseCategoryIds.length,
            }),
            about: t("tutorPage.about"),
            website: t("tutorPage.website"),
            linkedin: t("tutorPage.linkedin"),
          }}
        />
      ) : (
        <EmptyState
          title={t("auth.tutorRegisterTitle")}
          description={t("auth.tutorRegisterSubtitle")}
          action={
            <Link href={localeHref(locale, "/register/tutor")}>
              <Button>{t("auth.tutorApplyCta")}</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}

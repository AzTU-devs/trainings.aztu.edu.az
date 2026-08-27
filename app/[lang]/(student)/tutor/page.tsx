import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { ExpertProfileCard } from "@/features/expert/components/ExpertProfileCard";
import { expertServerApi } from "@/features/expert/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "Expert profile" };

type Props = { params: Promise<{ lang: string }> };

export default async function MyExpertProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const profile = await expertServerApi.myProfile().catch(() => null);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl leading-tight">{t("experts.myProfile")}</h1>

      {profile ? (
        <ExpertProfileCard
          expert={profile}
          as="h2"
          labels={{
            reviews: t("experts.reviews", { count: profile.ratingCount }),
            years: t("experts.years", { count: profile.yearsExperience ?? 0 }),
            specialties: t("experts.specialties", {
              count: profile.expertiseCategoryIds.length,
            }),
            about: t("experts.about"),
            website: t("experts.website"),
            linkedin: t("experts.linkedin"),
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

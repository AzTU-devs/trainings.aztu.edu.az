import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { ExpertProfileCard } from "@/features/expert/components/ExpertProfileCard";
import { expertServerApi } from "@/features/expert/api.server";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { AccountIntro } from "../_components/AccountIntro";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("experts.myProfile") };
}

export default async function MyExpertProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const profile = await expertServerApi.myProfile().catch(() => null);

  return (
    <div className="space-y-8">
      <AccountIntro
        eyebrow={t("experts.profileEyebrow")}
        title={t("experts.myProfile")}
        description={profile ? t("student.tutorSubtitle") : undefined}
      />

      {profile ? (
        <ExpertProfileCard
          expert={profile}
          locale={locale}
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
          icon={<GraduationCap strokeWidth={1.75} />}
          title={t("auth.tutorRegisterTitle")}
          description={t("auth.tutorRegisterSubtitle")}
          action={
            <Link href={localeHref(locale, "/register/tutor")} className={buttonVariants()}>
              {t("auth.tutorApplyCta")}
            </Link>
          }
        />
      )}
    </div>
  );
}

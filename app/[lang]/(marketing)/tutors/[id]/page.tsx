import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { tutorServerApi } from "@/features/tutor/api.server";
import { TutorProfileCard } from "@/features/tutor/components/TutorProfileCard";
import { fullTutorName, type TutorProfile } from "@/features/tutor/types";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const tutor = await tutorServerApi.byId(id);
    return {
      title: fullTutorName(tutor),
      description: tutor.headline ?? tutor.bio?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: "Tutor" };
  }
}

export default async function PublicTutorPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  let tutor: TutorProfile | null = null;
  try {
    tutor = await tutorServerApi.byId(id);
  } catch {
    tutor = null;
  }

  if (!tutor || tutor.approvalStatus !== "APPROVED") {
    return (
      <div className="container-fluid max-w-3xl space-y-6 py-10">
        <Breadcrumbs
          items={[
            { label: t("common.home"), href: localeHref(locale, "/") },
            { label: t("common.courses"), href: localeHref(locale, "/courses") },
            { label: t("nav.tutor") },
          ]}
        />
        <Card>
          <CardContent className="space-y-4 p-10 text-center">
            <h1 className="font-display text-2xl leading-tight">
              {t("tutorPage.notFoundTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("tutorPage.notFoundHint")}
            </p>
            <Link href={localeHref(locale, "/courses")} className="inline-block">
              <Button variant="outline">
                <ArrowLeft className="size-4" /> {t("tutorPage.backToCourses")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-fluid max-w-3xl space-y-6 py-10">
      <Breadcrumbs
        items={[
          { label: t("common.home"), href: localeHref(locale, "/") },
          { label: t("common.courses"), href: localeHref(locale, "/courses") },
          { label: fullTutorName(tutor) },
        ]}
      />
      <TutorProfileCard
        tutor={tutor}
        labels={{
          reviews: t("tutorPage.reviews", { count: tutor.ratingCount }),
          years: t("tutorPage.years", { count: tutor.yearsExperience ?? 0 }),
          specialties: t("tutorPage.specialties", {
            count: tutor.expertiseCategoryIds.length,
          }),
          about: t("tutorPage.about"),
          website: t("tutorPage.website"),
          linkedin: t("tutorPage.linkedin"),
        }}
      />
    </div>
  );
}

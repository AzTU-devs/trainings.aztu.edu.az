import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { TutorProfileCard } from "@/features/tutor/components/TutorProfileCard";
import { tutorServerApi } from "@/features/tutor/api.server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "Tutor profile" };

type Props = { params: Promise<{ lang: string }> };

export default async function MyTutorProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const profile = await tutorServerApi.myProfile().catch(() => null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Tutor profile</h1>

      {profile ? (
        <TutorProfileCard tutor={profile} />
      ) : (
        <EmptyState
          title="You're not a tutor yet"
          description="Apply to become a tutor and start publishing courses on EduPlatform."
          action={
            <Link href={localeHref(locale, "/dashboard")}>
              <Button>Apply to teach</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}

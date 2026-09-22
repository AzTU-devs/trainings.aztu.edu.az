import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Dept } from "@/components/editorial/Dept";
import { ProfileSettingsForm } from "@/features/auth/components/ProfileSettingsForm";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerificationButton";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { AccountIntro } from "../_components/AccountIntro";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("settings.title") };
}

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getT(lang as Locale);
  const user = await getSession();
  if (!user) return null;

  return (
    <div>
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />
      {!user.emailVerified ? (
        <div className="mt-10">
          <ResendVerificationButton />
        </div>
      ) : null}
      <section aria-labelledby="settings-profile" className="mt-10 md:mt-14">
        <Dept number="01" id="settings-profile" label={t("settings.profileSection")} />
        <p className="t-small mt-3 text-ink-3">{t("settings.profileSectionHint")}</p>
        <div className="mt-8">
          <ProfileSettingsForm user={user} />
        </div>
      </section>
    </div>
  );
}

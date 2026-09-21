import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UserRound } from "lucide-react";
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
    <div className="space-y-8">
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />
      {!user.emailVerified ? <ResendVerificationButton /> : null}
      <section
        aria-labelledby="settings-profile"
        className="rounded-3xl border border-border/80 bg-card elev-1"
      >
        <div className="flex items-start gap-4 border-b border-border/80 px-6 py-5 sm:px-8 sm:py-6">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
          >
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id="settings-profile" className="font-display text-lg leading-snug">
              {t("settings.profileSection")}
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              {t("settings.profileSectionHint")}
            </p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <ProfileSettingsForm user={user} />
        </div>
      </section>
    </div>
  );
}

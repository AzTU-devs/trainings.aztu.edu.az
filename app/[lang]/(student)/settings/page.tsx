import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettingsForm } from "@/features/auth/components/ProfileSettingsForm";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerificationButton";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";

export const metadata: Metadata = { title: "Settings" };

type Props = { params: Promise<{ lang: string }> };

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getT(lang as Locale);
  const user = await getSession();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-3xl leading-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>
      {!user.emailVerified ? <ResendVerificationButton /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profileSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm user={user} />
        </CardContent>
      </Card>
    </div>
  );
}

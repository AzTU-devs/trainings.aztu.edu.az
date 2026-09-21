import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NotificationList } from "@/features/notification/components/NotificationList";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { AccountIntro } from "../_components/AccountIntro";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("nav.notifications") };
}

export default async function NotificationsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getT(lang as Locale);

  return (
    <div className="space-y-8">
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("student.notificationsTitle")}
        description={t("student.notificationsSubtitle")}
      />
      <NotificationList />
    </div>
  );
}

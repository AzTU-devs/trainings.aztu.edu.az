import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { ProfileView } from "../_components/ProfileView";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("nav.profile") };
}

export default async function ProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const user = await getSession();
  if (!user) return null;

  return <ProfileView user={user} locale={locale} />;
}

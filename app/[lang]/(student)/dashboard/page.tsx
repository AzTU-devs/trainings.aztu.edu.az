import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { fullName } from "@/types/user";
import { DashboardView } from "../_components/DashboardView";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("nav.dashboard") };
}

export default async function DashboardPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const user = await getSession();

  const enrollments = await enrollmentServerApi.mine().catch(() => []);

  return (
    <DashboardView
      locale={locale}
      name={user ? user.firstName || fullName(user) : ""}
      enrollments={enrollments}
    />
  );
}

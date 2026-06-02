import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { getSession } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function StudentLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const user = await getSession();
  if (!user) {
    redirect(localeHref(locale, "/login"));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto flex flex-1 gap-6 px-4 py-6">
        <StudentSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

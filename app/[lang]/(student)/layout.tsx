import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
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

  const t = await getT(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        {t("nav.skipToContent")}
      </a>
      <Header />
      {/* The account area sits on the same 12-column grid as the public
          pages: the section index in columns 1–3 (a scrolling strip of pills
          above the content below 1024), the page itself from column 5 — the
          empty fourth column is the gutter that keeps it reading like a page
          rather than a control panel. */}
      <div className="wrap g12 w-full flex-1 content-start gap-y-8 pb-20 pt-5 lg:pb-28 lg:pt-10">
        <StudentSidebar />
        <main
          id="main"
          className="col-span-4 min-w-0 md:col-span-8 lg:col-span-9 lg:col-start-4 xl:col-span-8 xl:col-start-5"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

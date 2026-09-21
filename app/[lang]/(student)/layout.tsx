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
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground elev-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t("nav.skipToContent")}
      </a>
      <Header />
      {/* The same container as the floating header, so the sidebar card lines
          up under the logo and the content under the search field. Below md
          the sidebar becomes a pill strip stacked above the content. */}
      <div className="container-fluid flex flex-1 flex-col gap-6 pb-16 pt-6 md:flex-row md:gap-8 md:pt-8 lg:gap-10">
        <StudentSidebar />
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

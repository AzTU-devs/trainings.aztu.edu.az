import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { AppProviders } from "@/providers/AppProviders";
import { I18nProvider } from "@/i18n/client";
import { getDictionary } from "@/i18n/dictionaries";
import { getT } from "@/i18n/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { bodyClassName, htmlClassName } from "../fonts";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * This is the root layout (there is no app/layout.tsx): every page lives under
 * a locale, so the document itself can be rendered in that locale — `<html
 * lang>` is right in the server HTML, and the default title and description
 * are in the page's language. Moving between /az and /en swaps the root
 * layout, which Next does with a full page load, so nothing has to patch
 * `lang` on the client.
 *
 * URLs outside any locale never render here: the proxy redirects them into
 * one, and what it cannot (a missing file, an unknown /api path) gets
 * app/global-not-found.tsx.
 */
export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  const t = await getT(isLocale(lang) ? lang : defaultLocale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("meta.siteTitle"), template: "%s · AzTU EduPlatform" },
    description: t("meta.siteDescription"),
    openGraph: {
      type: "website",
      siteName: "AzTU EduPlatform",
      url: siteUrl,
      locale: lang === "az" ? "az_AZ" : "en_US",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#060d18" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const messages = await getDictionary(locale);

  return (
    <html lang={locale} className={htmlClassName} suppressHydrationWarning>
      <body className={bodyClassName}>
        <I18nProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </I18nProvider>
      </body>
    </html>
  );
}

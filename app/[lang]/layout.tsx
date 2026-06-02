import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppProviders } from "@/providers/AppProviders";
import { I18nProvider } from "@/i18n/client";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const messages = await getDictionary(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <AppProviders>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
          }}
        />
        {children}
      </AppProviders>
    </I18nProvider>
  );
}

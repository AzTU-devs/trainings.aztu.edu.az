import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { getT } from "@/i18n/server";
import { defaultLocale, isLocale } from "@/i18n/config";

/**
 * The 404's own head. When a page calls notFound(), Next builds the error
 * document's metadata from the layouts plus this file, never from the page
 * that threw, so a title set anywhere else only reaches the browser as
 * streamed data and bots saw the home title. Here it is in the server HTML:
 * "Səhifə tapılmadı · AzTU EduPlatform", and noindex, which also overrides
 * the layout's "index, follow" (Next adds its own noindex for a 404 as well).
 * Metadata functions of this file receive the [lang] segment's params.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = await getT(isLocale(lang) ? lang : defaultLocale);
  return { title: t("errors.notFoundKicker"), robots: { index: false, follow: true } };
}

/**
 * notFound() anywhere under a locale lands here: a bad course slug or expert
 * id, and every unknown URL through app/[lang]/[...missing]. It renders
 * inside [lang]/layout, so unlike the root 404 it knows the language (one
 * language only, from the dictionary) and keeps the visitor on the site:
 * header, search and footer included.
 *
 * A server component only so it can hand the footer its year (see Footer);
 * the body is a client component because not-found receives no params, and
 * the locale comes from the I18nProvider.
 */
export default function LocaleNotFound() {
  return (
    <SiteShell year={new Date().getFullYear()}>
      <NotFoundContent />
    </SiteShell>
  );
}

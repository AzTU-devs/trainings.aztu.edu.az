import { permanentRedirect } from "next/navigation";
import { localeHref } from "@/i18n/href";
import { isLocale, type Locale } from "@/i18n/config";

type Props = { params: Promise<{ lang: string; id: string }> };

/**
 * `/tutors/:id` predates the rename to "experts". Kept as a permanent redirect
 * so links already in the wild — and anything indexed — land on the new URL
 * instead of a 404.
 */
export default async function LegacyTutorRedirect({ params }: Props) {
  const { lang, id } = await params;
  const locale = (isLocale(lang) ? lang : "en") as Locale;
  permanentRedirect(localeHref(locale, `/experts/${id}`));
}

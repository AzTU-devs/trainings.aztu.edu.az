import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckoutClient } from "@/features/payment/components/CheckoutClient";
import { courseServerApi } from "@/features/course/api.server";
import { getSession } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "Checkout" };

type Props = { params: Promise<{ lang: string; slug: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const user = await getSession();
  if (!user) {
    redirect(
      `${localeHref(locale, "/login")}?next=${encodeURIComponent(
        localeHref(locale, `/checkout/${slug}`),
      )}`,
    );
  }

  const course = await courseServerApi.bySlug(slug).catch(() => null);
  if (!course) notFound();

  // Free courses skip checkout
  if (course.free) {
    redirect(localeHref(locale, `/courses/${slug}`));
  }

  return <CheckoutClient course={course} />;
}

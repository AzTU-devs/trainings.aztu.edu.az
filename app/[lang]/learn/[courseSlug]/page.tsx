import { notFound, redirect } from "next/navigation";
import { courseServerApi } from "@/features/course/api.server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = { params: Promise<{ lang: string; courseSlug: string }> };

export default async function LearnCourseRoot({ params }: Props) {
  const { lang, courseSlug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const course = await courseServerApi.bySlug(courseSlug);
  const firstLesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id);
  if (!firstLesson) notFound();

  redirect(localeHref(locale, `/learn/${courseSlug}/${firstLesson.id}`));
}

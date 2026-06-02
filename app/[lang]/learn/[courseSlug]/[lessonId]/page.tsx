import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { LearningClient } from "@/features/learning/components/LearningClient";
import { courseServerApi } from "@/features/course/api.server";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import { getSession } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const metadata: Metadata = { title: "Learn" };

type Props = {
  params: Promise<{ lang: string; courseSlug: string; lessonId: string }>;
};

export default async function LearnLessonPage({ params }: Props) {
  const { lang, courseSlug, lessonId } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const user = await getSession();
  if (!user) {
    redirect(
      `${localeHref(locale, "/login")}?next=${encodeURIComponent(
        localeHref(locale, `/learn/${courseSlug}/${lessonId}`),
      )}`,
    );
  }

  const course = await courseServerApi.bySlug(courseSlug);

  const lessonExists = course.modules.some((m) =>
    m.lessons.some((l) => l.id === lessonId),
  );
  if (!lessonExists) notFound();

  try {
    const enrollments = await enrollmentServerApi.mine();
    const isEnrolled = enrollments.some((e) => e.courseId === course.id);
    if (!isEnrolled) {
      redirect(localeHref(locale, `/courses/${courseSlug}`));
    }
  } catch {
    redirect(localeHref(locale, `/courses/${courseSlug}`));
  }

  return (
    <LearningClient
      course={course}
      currentLessonId={lessonId}
      initialProgress={{}}
    />
  );
}

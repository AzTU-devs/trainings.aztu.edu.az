import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { RichText } from "@/components/common/RichText";
import { hasRichText } from "@/lib/rich-text.server";
import { LearningClient } from "@/features/learning/components/LearningClient";
import { courseServerApi } from "@/features/course/api.server";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import { getSession } from "@/lib/auth/session";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = {
  params: Promise<{ lang: string; courseSlug: string; lessonId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("learn.title") };
}

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

  const lesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === lessonId);
  if (!lesson) notFound();

  let isEnrolled = false;
  try {
    const enrollments = await enrollmentServerApi.mine();
    isEnrolled = enrollments.some((e) => e.courseId === course.id);
  } catch {
    isEnrolled = false;
  }
  if (!isEnrolled) {
    redirect(localeHref(locale, `/courses/${courseSlug}`));
  }

  const savedProgress = await enrollmentServerApi.lessonProgress(course.id);
  const initialProgress = Object.fromEntries(
    savedProgress.map((p) => [p.lessonId, p]),
  );

  // The description is rich text, sanitized here on the server: the player
  // is a client component and gets it already rendered.
  return (
    <LearningClient
      course={course}
      currentLessonId={lessonId}
      initialProgress={initialProgress}
      lessonDescription={
        hasRichText(lesson.description) ? (
          <RichText
            value={lesson.description}
            className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground"
          />
        ) : null
      }
    />
  );
}

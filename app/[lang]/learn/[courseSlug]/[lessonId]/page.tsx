import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { LearningClient } from "@/features/learning/components/LearningClient";
import { courseServerApi } from "@/features/course/api.server";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { primaryCategoryId, toCategoryRef, type CategoryRef } from "@/features/category/style";
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

  const lessonExists = course.modules.some((m) =>
    m.lessons.some((l) => l.id === lessonId),
  );
  if (!lessonExists) notFound();

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

  // Presentation only: the course's primary category colours the lesson
  // stage the way it colours the course's poster everywhere else. Read-only,
  // cached for 300 s like the course page's own category lookup, and optional
  // — if it fails the stage uses the navy brand colours.
  let category: CategoryRef | null = null;
  try {
    const [categories, t] = await Promise.all([
      categoryServerApi.listCached(300),
      getT(locale),
    ]);
    const byId = new Map(categories.map((c) => [c.id, c] as const));
    const primary = primaryCategoryId(course.categoryIds, byId);
    const found = primary ? byId.get(primary) : undefined;
    category = found ? toCategoryRef(found, t, locale) : null;
  } catch {
    category = null;
  }

  return (
    <LearningClient
      course={course}
      currentLessonId={lessonId}
      initialProgress={initialProgress}
      category={category}
    />
  );
}

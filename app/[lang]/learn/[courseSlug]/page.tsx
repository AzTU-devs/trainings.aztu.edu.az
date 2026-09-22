import { notFound, redirect } from "next/navigation";
import { courseServerApi } from "@/features/course/api.server";
import { courseSlugsById } from "@/features/course/slugs.server";
import type { ApiError } from "@/types/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = { params: Promise<{ lang: string; courseSlug: string }> };

export default async function LearnCourseRoot({ params }: Props) {
  const { lang, courseSlug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  let course;
  try {
    course = await courseServerApi.bySlug(courseSlug);
  } catch (err) {
    if ((err as ApiError).status !== 404) throw err;
    // Older links (and bookmarks) address the player by course id. Send them to
    // the slug when the course is in the catalogue; otherwise back to the
    // participant's own course list rather than an error page.
    const slug = UUID.test(courseSlug) ? (await courseSlugsById()).get(courseSlug) : undefined;
    redirect(localeHref(locale, slug ? `/learn/${slug}` : "/my-courses"));
  }
  const firstLesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id);

  // A published course with no lessons yet is an ordinary state — the tutor
  // publishes, then fills it in — and enrolling lands here immediately. This used
  // to be notFound(), which dead-ended the student on the root 404 page: that page
  // renders outside app/[lang]/layout.tsx, so it has no session and no header, and
  // being enrolled looked like being signed out. Send them back to the course
  // instead, where their enrolment is visible and the curriculum appears as soon
  // as there is one.
  if (!firstLesson) {
    redirect(localeHref(locale, `/courses/${courseSlug}`));
  }

  redirect(localeHref(locale, `/learn/${courseSlug}/${firstLesson.id}`));
}

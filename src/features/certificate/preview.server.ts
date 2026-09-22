import "server-only";
import { categoryServerApi } from "@/features/category/api.server";
import { categoryLabel } from "@/features/category/label";
import { courseServerApi } from "@/features/course/api.server";
import { courseSlugsById } from "@/features/course/slugs.server";
import { enrollmentServerApi } from "@/features/enrollment/api.server";
import type { Enrollment } from "@/features/enrollment/types";
import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/format";
import { fullName, type User } from "@/types/user";
import type { CertificateTemplateProps } from "./CertificateTemplate";
import { courseCertificate } from "./course";
import { bakuDateISO } from "./date";

/**
 * The participant's own preview of the certificate: their name from the
 * session and, when they have finished a course, that course's details, dated
 * the day they finished it. Everything comes from the server, so nothing
 * differs between the server and the browser.
 *
 * Only a finished course is filled in. The sheet says "has successfully
 * completed the course …" above their real name, which would be untrue of a
 * course they are still taking (most participants' only enrolments), so
 * without a finished one it keeps the template's own words ("Course title").
 *
 * Every lookup is optional: if the course cannot be read, the sheet simply
 * leaves out what it does not know. The "Sample" stamp always stays on.
 */
export async function participantCertificate(user: User | null, t: TFunction, locale: Locale): Promise<CertificateTemplateProps> {
  const today = bakuDateISO();
  const enrollments = await enrollmentServerApi.mine().catch(() => [] as Enrollment[]);
  const recent = (e: Enrollment) => Date.parse(e.completedAt ?? e.lastAccessedAt ?? e.enrolledAt) || 0;
  const pick = enrollments.filter((e) => e.status === "COMPLETED").sort((a, b) => recent(b) - recent(a))[0];

  const recipient = user ? fullName(user) : null;
  if (!pick) {
    return courseCertificate({ t, locale, today, courseId: user?.id ?? "preview", title: t("certificate.coursePlaceholder"), recipient });
  }
  const finished = Date.parse(pick.completedAt ?? "");

  const slug = (await courseSlugsById()).get(pick.courseId);
  const [course, categories] = await Promise.all([
    slug ? courseServerApi.bySlug(slug).catch(() => null) : null,
    categoryServerApi.list().catch(() => null),
  ]);
  const category = course && categories?.find((c) => course.categoryIds.includes(c.id));
  const seconds = course
    ? course.onlineDetails?.totalVideoSeconds ||
      course.modules.flatMap((m) => m.lessons).reduce((s, l) => s + (l.durationSeconds ?? 0), 0) ||
      null
    : null;

  return courseCertificate({
    t,
    locale,
    today,
    dateISO: Number.isFinite(finished) ? bakuDateISO(finished) : null,
    courseId: pick.courseId,
    idSeed: `${user?.id ?? "preview"}:${pick.courseId}`,
    title: course?.title ?? pick.courseTitle,
    categoryName: category ? categoryLabel(category, t, locale) : null,
    expertName: course?.tutorDisplayName ?? null,
    totalHours: course?.offlineDetails?.totalHours,
    seconds,
    recipient,
  });
}

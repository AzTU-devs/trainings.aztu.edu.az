import type { TFunction } from "@/i18n/format";
import { formatCompact, formatRating } from "@/lib/utils/format";
import type { CourseLevel, CourseSummary, CourseType } from "./types";

/**
 * Every piece of course text a card or page prints, in the page's language,
 * built once per render on the server and handed to the components below.
 * Numbers go through the locale-explicit formatters so the same text comes
 * out wherever it is rendered.
 */
export type CourseLabels = ReturnType<typeof courseLabels>;

/** A course counts as new for three weeks after it is published. */
const NEW_FOR_MS = 21 * 24 * 60 * 60 * 1000;

export function courseLabels(t: TFunction, locale: string, now: number = Date.now()) {
  const level: Record<CourseLevel, string> = {
    BEGINNER: t("ui.levelBeginner"),
    INTERMEDIATE: t("ui.levelIntermediate"),
    ADVANCED: t("ui.levelAdvanced"),
    ALL: t("ui.levelAll"),
  };
  const format: Record<CourseType, string> = {
    ONLINE: t("ui.online"),
    OFFLINE: t("ui.inPerson"),
  };
  return {
    level,
    format,
    isNew: t("ui.new"),
    newCourse: t("ui.newCourse"),
    newest: t("ui.newestCourse"),
    expert: t("ui.expert"),
    free: t("ui.free"),
    viewCourse: t("ui.viewCourse"),
    duration(seconds: number | null | undefined): string | null {
      if (!seconds || seconds <= 0) return null;
      // Round to whole minutes first, so 2h 59m 40s reads "3 h", not "2 h 60 min".
      const total = Math.round(seconds / 60);
      const h = Math.floor(total / 60);
      const m = total % 60;
      if (h && m) return t("ui.durationHm", { h, m });
      if (h) return t("ui.durationH", { h });
      return t("ui.durationM", { m: Math.max(m, 1) });
    },
    rating: (avg: string | number) => formatRating(avg, locale),
    count: (n: number) => formatCompact(n, locale),
    starsLabel: (avg: string | number) => t("ui.starsLabel", { value: formatRating(avg, locale) }),
    isNewCourse(course: Pick<CourseSummary, "publishedAt">): boolean {
      if (!course.publishedAt) return false;
      const at = Date.parse(course.publishedAt);
      return Number.isFinite(at) && now - at < NEW_FOR_MS;
    },
  };
}

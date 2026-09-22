import { CirclePlay, CircleHelp, File, FileText, Radio, type LucideIcon } from "lucide-react";
import type { TFunction } from "@/i18n/format";
import type { CourseLevel, CourseModule, CourseType, LessonContentType } from "./types";

/**
 * Words for course facts, shared by cards, rows, the course page and the
 * player. Universal and pure: everything goes through the dictionary, so a
 * client component prints the same text as the server.
 */

/** "8 saat 26 dəq" (long) / "8 s 26 dəq" (short); "8 h 26 min" in English. Empty for 0 or less. */
export function formatDuration(seconds: number | null | undefined, t: TFunction, style: "long" | "short" = "long") {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  // A lesson under a minute still reads as a minute, never "0 dəq".
  const m = h ? Math.floor((seconds % 3600) / 60) : Math.max(1, Math.round((seconds % 3600) / 60));
  const s = style === "short" ? "Short" : "";
  if (h && m) return t(`ui.durHM${s}`, { h, m });
  if (h) return t(`ui.durH${s}`, { h });
  return t(`ui.durM${s}`, { m });
}

export const LEVEL_KEY: Record<CourseLevel, string> = {
  BEGINNER: "common.beginner",
  INTERMEDIATE: "common.intermediate",
  ADVANCED: "common.advanced",
  ALL: "common.allLevels",
};

export const FORMAT_KEY: Record<CourseType, string> = {
  ONLINE: "common.online",
  OFFLINE: "common.offline",
};

/**
 * Per lesson type: its icon, the counted phrase ("{count} video dərs", ICU
 * plural in English) and the type's name (the lesson row's label).
 */
export const LESSON_KIND: Record<LessonContentType, { icon: LucideIcon; key: string; nameKey: string }> = {
  VIDEO: { icon: CirclePlay, key: "ui.kindVideo", nameKey: "ui.kindVideoName" },
  TEXT: { icon: FileText, key: "ui.kindText", nameKey: "ui.kindTextName" },
  PDF: { icon: File, key: "ui.kindPdf", nameKey: "ui.kindPdfName" },
  QUIZ: { icon: CircleHelp, key: "ui.kindQuiz", nameKey: "ui.kindQuizName" },
  LIVE_SESSION: { icon: Radio, key: "ui.kindLive", nameKey: "ui.kindLiveName" },
};

const KIND_ORDER: LessonContentType[] = ["VIDEO", "TEXT", "PDF", "QUIZ", "LIVE_SESSION"];

/** How many lessons of each type a curriculum has, in a fixed order, zero counts left out. */
export function lessonKindCounts(modules: readonly CourseModule[]): { kind: LessonContentType; count: number }[] {
  const counts = new Map<LessonContentType, number>();
  for (const mod of modules) {
    for (const lesson of mod.lessons) counts.set(lesson.contentType, (counts.get(lesson.contentType) ?? 0) + 1);
  }
  return KIND_ORDER.filter((k) => (counts.get(k) ?? 0) > 0).map((kind) => ({ kind, count: counts.get(kind) ?? 0 }));
}

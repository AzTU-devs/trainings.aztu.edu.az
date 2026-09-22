"use client";

import { Accordion } from "@/components/common/Accordion";
import { BlankPlate } from "@/components/editorial/BlankPlate";
import { Tag } from "@/components/ui/badge";
import { useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import { LESSON_KIND, formatDuration } from "../format";
import type { CourseModule, LessonContentType } from "../types";

/**
 * A lesson's length in the one duration style the site uses everywhere ("12
 * dəq", "1 s 5 dəq", "2 s"), so this list, the module meta beside it and the
 * player's sidebar print the same lesson the same way; a clock reading such
 * as "17:00" would look like a time of day. "—" when the author has not set it.
 */
function lessonLength(seconds: number, t: TFunction) {
  return formatDuration(seconds, t, "short") || "—";
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The curriculum: the summary line with "expand all", the lesson-type counts
 * (computed from each lesson's type, never typed by hand), then one module per
 * row with the first one open. A lesson marked as a preview is only labelled:
 * /learn needs sign-in and enrolment, so it cannot be a link for visitors.
 *
 * With no modules it says so next to an empty plate instead of showing an
 * empty list.
 */
export function CurriculumAccordion({
  modules,
  kinds = [],
  totalSeconds = 0,
  emptyMessage,
  emptyHint,
}: {
  modules: CourseModule[];
  /** lessonKindCounts(modules), computed once by the page (the enrol card shows the same tags). */
  kinds?: { kind: LessonContentType; count: number }[];
  /** The course length for the summary (the online total, else the sum of the lessons). */
  totalSeconds?: number;
  emptyMessage?: string;
  emptyHint?: string;
}) {
  const t = useT();
  const lessonCount = modules.reduce((s, m) => s + m.lessons.length, 0);

  if (!modules.length || lessonCount === 0) {
    return (
      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8">
        <BlankPlate label={t("courseDetail.zeroLessons")} square />
        <div className="min-w-0">
          <p className="t-title">{emptyMessage ?? t("courseDetail.curriculumEmpty")}</p>
          {emptyHint ? <p className="t-body mt-2">{emptyHint}</p> : null}
        </div>
      </div>
    );
  }

  const summary = [
    t("courseDetail.modules", { count: modules.length }),
    t("courseDetail.lessons", { count: lessonCount }),
    formatDuration(totalSeconds, t, "long"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Accordion
      variant="module"
      defaultOpen={modules[0] ? [modules[0].id] : []}
      toggleAll={
        modules.length > 1
          ? { openLabel: t("ui.expandAll"), closeLabel: t("ui.collapseAll") }
          : undefined
      }
      // The Accordion puts `summary` in the left cell of its header row. With
      // that cell as `display: contents`, the summary line and the kinds become
      // items of the row itself: the line sits beside "Hamısını açın" and the
      // kinds wrap onto a full-width line under both. The module number never
      // breaks ("MODULE 01" is a hair wider than its 72px column in English),
      // and like every mono label it is set in the 500 weight. "Hamısını açın"
      // is the only way to open every module on a phone, so its hit area is
      // padded to 43px tall; the negative margin keeps the row's height.
      className="[&>div:first-child>button]:-my-2.5 [&>div:first-child>button]:py-2.5 [&>div:first-child>div:first-child]:contents [&_.mn]:font-medium [&_.mn]:whitespace-nowrap"
      summary={
        <>
          <p className="min-w-0">{summary}</p>
          {kinds.length ? (
            <div className="kinds order-last basis-full">
              {kinds.map(({ kind, count }) => (
                <Tag key={kind} icon={LESSON_KIND[kind].icon}>
                  {t(LESSON_KIND[kind].key, { count })}
                </Tag>
              ))}
            </div>
          ) : null}
        </>
      }
      items={modules.map((mod, i) => {
        const seconds = mod.lessons.reduce((s, l) => s + (l.durationSeconds ?? 0), 0);
        return {
          id: mod.id,
          number: t("courseDetail.moduleN", { n: pad(i + 1) }),
          title: mod.title,
          meta: [
            t("courseDetail.lessons", { count: mod.lessons.length }),
            formatDuration(seconds, t, "short"),
          ]
            .filter(Boolean)
            .join(" · "),
          content: (
            <ol className="lessons">
              {mod.lessons.map((lesson) => {
                const kind = LESSON_KIND[lesson.contentType] ?? LESSON_KIND.TEXT;
                const Icon = kind.icon;
                const typeName = t(kind.nameKey);
                return (
                  // The length column is 80px rather than globals.css's 64px:
                  // durations are in words now, and "1 s 30 dəq" is ten mono
                  // characters.
                  <li key={lesson.id} className="lesson md:grid-cols-[22px_minmax(0,1fr)_110px_80px]">
                    <Icon aria-hidden="true" strokeWidth={1.75} />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      <span className="sr-only">{typeName}: </span>
                      {lesson.title}
                      {/* A status, not a link (visitors cannot open it, D4): a
                          small outlined tag instead of the underlined link look
                          globals.css gives `.pv`. Utilities win over that layer. */}
                      {lesson.preview ? (
                        <span className="pv rounded-[3px] border-b-0 px-1.5 py-px font-medium shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--c-gold-ink)_45%,transparent)]">
                          {t("ui.preview")}
                        </span>
                      ) : null}
                    </span>
                    <span className="lt font-medium" aria-hidden="true">
                      {typeName}
                    </span>
                    <span className="d">{lessonLength(lesson.durationSeconds, t)}</span>
                  </li>
                );
              })}
            </ol>
          ),
        };
      })}
    />
  );
}

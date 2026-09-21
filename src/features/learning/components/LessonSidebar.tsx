"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Play } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import { cn } from "@/lib/utils/cn";
import type { CourseModule } from "@/features/course/types";
import type { LessonProgress } from "@/features/enrollment/types";

type Props = {
  courseSlug: string;
  modules: CourseModule[];
  currentLessonId: string;
  progress: Record<string, LessonProgress>;
  /** Shown in the card's header; the player computes them once for both. */
  completedCount: number;
  totalLessons: number;
  percent: number;
};

/** "1 h 5 min" in the page's language; nothing at all for an unknown length. */
function durationLabel(seconds: number, t: TFunction) {
  if (!seconds || seconds < 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h && m) return t("courses.durationHm", { h, m });
  if (h) return t("courses.durationH", { h });
  return t("courses.durationM", { m: Math.max(m, 1) });
}

export function LessonSidebar({
  courseSlug,
  modules,
  currentLessonId,
  progress,
  completedCount,
  totalLessons,
  percent,
}: Props) {
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);

  // On wide screens the list scrolls inside a sticky card; open it at the
  // lesson being watched rather than at lesson one. Only the list moves.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.scrollHeight <= list.clientHeight) return;
    list.scrollTop = current.offsetTop - list.clientHeight / 3;
  }, [currentLessonId]);

  // Lessons are numbered through the whole course, not restarted per module.
  const lessonNumbers = new Map(
    modules.flatMap((m) => m.lessons).map((l, i) => [l.id, i + 1] as const),
  );

  return (
    <aside className="overflow-hidden rounded-3xl border border-border/80 bg-card elev-1 lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100dvh-7.5rem)] lg:flex-col">
      <div className="border-b border-border/80 px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg leading-snug">{t("learn.courseContent")}</h2>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            {t("learn.progressSummary", { done: completedCount, total: totalLessons })}
          </span>
        </div>
        <div
          aria-hidden
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.08]"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div
        ref={listRef}
        className="relative space-y-1 overflow-y-auto overscroll-contain p-2 lg:flex-1"
      >
        {modules.map((mod, moduleIndex) => {
          const moduleDone = mod.lessons.filter(
            (l) => progress[l.id]?.status === "COMPLETED",
          ).length;
          return (
            <section key={mod.id} aria-label={mod.title}>
              <div className="flex items-start justify-between gap-3 px-3 pb-2 pt-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    {t("learn.moduleLabel", { n: moduleIndex + 1 })}
                  </div>
                  <h3 className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
                    {mod.title}
                  </h3>
                </div>
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                    moduleDone === mod.lessons.length && mod.lessons.length > 0
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {moduleDone}/{mod.lessons.length}
                </span>
              </div>
              <ul className="grid gap-0.5">
                {mod.lessons.map((lesson) => {
                  const pr = progress[lesson.id];
                  const completed = pr?.status === "COMPLETED";
                  const active = lesson.id === currentLessonId;
                  const duration = durationLabel(lesson.durationSeconds, t);
                  return (
                    <li key={lesson.id}>
                      <LocaleLink
                        href={`/learn/${courseSlug}/${lesson.id}`}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-start gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors duration-200",
                          active
                            ? "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        {completed ? (
                          <CheckCircle2
                            aria-hidden
                            className="mt-px size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                          />
                        ) : active ? (
                          <span
                            aria-hidden
                            className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                          >
                            <Play className="ml-px size-2.5 fill-current" />
                          </span>
                        ) : (
                          <span
                            aria-hidden
                            className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-border text-[10px] font-semibold tabular-nums text-muted-foreground"
                          >
                            {lessonNumbers.get(lesson.id)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "line-clamp-2 leading-snug",
                              active ? "font-semibold" : "font-medium",
                            )}
                          >
                            {lesson.title}
                          </div>
                          {duration || completed ? (
                            <div
                              className={cn(
                                "mt-0.5 text-xs",
                                active
                                  ? "text-navy-700/75 dark:text-navy-100/75"
                                  : "text-muted-foreground",
                              )}
                            >
                              {duration}
                              {completed ? (
                                <span className="sr-only">
                                  {duration ? " · " : ""}
                                  {t("learn.completed")}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </LocaleLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

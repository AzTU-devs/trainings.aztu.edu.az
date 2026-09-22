"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Accordion } from "@/components/common/Accordion";
import { formatDuration, LESSON_KIND } from "@/features/course/format";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import type { CourseModule } from "@/features/course/types";
import type { LessonProgress } from "@/features/enrollment/types";

type Props = {
  courseSlug: string;
  modules: CourseModule[];
  currentLessonId: string;
  progress: Record<string, LessonProgress>;
  /** Shown in the list's header; the player computes them once for both. */
  completedCount: number;
  totalLessons: number;
  percent: number;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The course's table of contents beside the lesson: the module accordion the
 * course page uses, opened at the module being studied, with one row per
 * lesson (type icon — or a gold check once completed —, title, length). The
 * current lesson carries the gold left rule. On wide screens the list sticks
 * beside the stage and scrolls on its own.
 */
export function LessonSidebar({
  courseSlug,
  modules,
  currentLessonId,
  progress,
  completedCount,
  totalLessons,
  percent,
  className,
}: Props) {
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);

  // On wide screens the list scrolls inside the sticky column; open it at the
  // lesson being studied rather than at lesson one. Only the list moves.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.scrollHeight <= list.clientHeight) return;
    list.scrollTop = current.offsetTop - list.clientHeight / 3;
  }, [currentLessonId]);

  const currentModule = modules.find((m) => m.lessons.some((l) => l.id === currentLessonId));

  const items = modules.map((mod, moduleIndex) => {
    const done = mod.lessons.filter((l) => progress[l.id]?.status === "COMPLETED").length;
    return {
      id: mod.id,
      number: t("learn.moduleLabel", { n: pad(moduleIndex + 1) }),
      title: mod.title,
      meta: (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums">
          {done === mod.lessons.length && done > 0 ? (
            <Check aria-hidden="true" strokeWidth={2} className="size-3.5 text-gold-ink" />
          ) : null}
          {done}/{mod.lessons.length}
        </span>
      ),
      content: (
        <ol className="pb-4">
          {mod.lessons.map((lesson) => {
            const completed = progress[lesson.id]?.status === "COMPLETED";
            const active = lesson.id === currentLessonId;
            const Icon = completed ? Check : LESSON_KIND[lesson.contentType]?.icon;
            const duration = formatDuration(lesson.durationSeconds, t, "short");
            return (
              <li key={lesson.id}>
                <LocaleLink
                  href={`/learn/${courseSlug}/${lesson.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "grid grid-cols-[18px_minmax(0,1fr)_auto] items-start gap-3 border-l-2 py-2.5 pl-3 pr-2 text-[15px] leading-snug transition-colors duration-(--dur-1)",
                    active
                      ? "border-gold bg-paper-2 font-semibold text-ink"
                      : "border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink",
                  )}
                >
                  {Icon ? (
                    <Icon
                      aria-hidden="true"
                      strokeWidth={completed ? 2.25 : 1.75}
                      className={cn("mt-0.5 size-[18px]", completed ? "text-gold-ink" : "text-ink-3")}
                    />
                  ) : (
                    <span />
                  )}
                  <span className="min-w-0">
                    <span className="line-clamp-2">{lesson.title}</span>
                    {completed ? <span className="sr-only"> · {t("learn.completed")}</span> : null}
                  </span>
                  {duration ? (
                    <span className="whitespace-nowrap pt-0.5 font-mono text-xs font-normal text-ink-3">
                      {duration}
                    </span>
                  ) : (
                    <span />
                  )}
                </LocaleLink>
              </li>
            );
          })}
        </ol>
      ),
    };
  });

  return (
    <aside
      aria-labelledby="lesson-list-h"
      className={cn(
        "min-w-0 lg:sticky lg:top-[88px] lg:flex lg:max-h-[calc(100dvh-112px)] lg:flex-col",
        className,
      )}
    >
      <div className="pb-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="lesson-list-h" className="t-kicker text-ink-2">
            {t("learn.courseContent")}
          </h2>
          <span className="font-mono text-xs tabular-nums text-ink-3">
            {t("learn.progressSummary", { done: completedCount, total: totalLessons })}
          </span>
        </div>
        {/* Phones: the list sits far below the top bar, so it repeats the
            meter over the lessons it counts. The warm paper-2 track of the
            prototype's meters; in the dark edition the soft hairline, so an
            empty or barely started course still shows its full length. */}
        <div aria-hidden="true" className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-2 dark:bg-line sm:hidden">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-(--dur-3) ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div
        ref={listRef}
        className="relative lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 [&_.acc-btn]:py-4 [&_.mod-btn_.q]:text-base lg:[&_.mod-btn]:grid-cols-[80px_minmax(0,1fr)_auto_32px] [&_.pm]:size-8"
      >
        {/* Keyed by the module being studied: moving into the next module
            re-opens the accordion there instead of keeping the old one open. */}
        <Accordion key={currentModule?.id ?? "none"} variant="module" items={items} defaultOpen={currentModule ? [currentModule.id] : []} />
      </div>
    </aside>
  );
}

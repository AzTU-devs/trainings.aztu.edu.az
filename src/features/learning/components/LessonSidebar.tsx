"use client";

import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/utils/format";
import type { CourseModule } from "@/features/course/types";
import type { LessonProgress } from "@/features/enrollment/types";

type Props = {
  courseSlug: string;
  modules: CourseModule[];
  currentLessonId: string;
  progress: Record<string, LessonProgress>;
};

export function LessonSidebar({
  courseSlug,
  modules,
  currentLessonId,
  progress,
}: Props) {
  const t = useT();
  return (
    <aside className="w-full shrink-0 overflow-y-auto border-r border-border bg-card md:w-80">
      <div className="border-b border-border p-4 text-sm font-semibold">
        {t("learn.lessonsTab")}
      </div>
      {modules.map((mod) => (
        <div key={mod.id} className="border-b border-border">
          <div className="bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {mod.title}
          </div>
          <ul>
            {mod.lessons.map((lesson) => {
              const pr = progress[lesson.id];
              const completed = pr?.status === "COMPLETED";
              const active = lesson.id === currentLessonId;
              return (
                <li key={lesson.id}>
                  <LocaleLink
                    href={`/learn/${courseSlug}/${lesson.id}`}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/50",
                      active && "bg-primary/10",
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    ) : active ? (
                      <PlayCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "truncate",
                          active && "font-medium text-primary",
                        )}
                      >
                        {lesson.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(lesson.durationSeconds)}
                      </div>
                    </div>
                  </LocaleLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, Lock, PlayCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";
import type { CourseModule } from "../types";

export function CurriculumAccordion({
  modules,
  emptyMessage,
}: {
  modules: CourseModule[];
  emptyMessage?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

  if (!modules.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage ?? "Curriculum has not been published yet."}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {modules.map((mod) => {
        const isOpen = openId === mod.id;
        const totalSec = mod.lessons.reduce(
          (sum, l) => sum + (l.durationSeconds ?? 0),
          0,
        );
        return (
          <div key={mod.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : mod.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-accent/50"
            >
              <div>
                <div className="font-medium">{mod.title}</div>
                <div className="text-xs text-muted-foreground">
                  {mod.lessons.length} lessons · {formatDuration(totalSec)}
                </div>
              </div>
              <ChevronDown
                className={
                  "size-4 transition-transform " + (isOpen ? "rotate-180" : "")
                }
              />
            </button>
            {isOpen ? (
              <ul className="divide-y divide-border border-t border-border">
                {mod.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-3 px-5 py-3 text-sm"
                  >
                    {lesson.preview ? (
                      <PlayCircle className="size-4 text-primary" />
                    ) : (
                      <Lock className="size-4 text-muted-foreground" />
                    )}
                    <span className="flex-1">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(lesson.durationSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

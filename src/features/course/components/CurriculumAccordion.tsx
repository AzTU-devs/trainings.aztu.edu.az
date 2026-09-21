"use client";

import { useId, useState } from "react";
import { ChevronDown, CirclePlay, ListTree, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import type { CourseModule } from "../types";

/** A module's total, e.g. "1 saat 20 dəq" — formatDuration's units are English-only. */
function durationText(seconds: number, t: TFunction) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h && m) return t("courseDetail.durationHM", { h, m });
  if (h) return t("courseDetail.durationH", { h });
  return t("courseDetail.durationM", { m: Math.max(m, 1) });
}

/** A lesson's length as a clock reading (12:05, 1:02:30), which needs no words. */
function clock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function CurriculumAccordion({
  modules,
  emptyMessage,
  emptyHint,
}: {
  modules: CourseModule[];
  emptyMessage?: string;
  emptyHint?: string;
}) {
  const t = useT();
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

  if (!modules.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100">
          <ListTree aria-hidden className="size-5" />
        </span>
        <p className="mt-4 font-display text-base leading-snug">
          {emptyMessage ?? t("courseDetail.curriculumEmpty")}
        </p>
        {emptyHint ? (
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {emptyHint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((mod, index) => {
        const isOpen = openId === mod.id;
        const totalSec = mod.lessons.reduce(
          (sum, l) => sum + (l.durationSeconds ?? 0),
          0,
        );
        const panelId = `${baseId}-${mod.id}`;
        return (
          <div
            key={mod.id}
            className={cn(
              "overflow-hidden rounded-2xl border transition-[border-color,box-shadow,background-color] duration-200",
              isOpen
                ? "border-border bg-card elev-2"
                : "border-border/80 bg-background/60 hover:border-primary/30 dark:bg-background/40",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : mod.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-2xl font-display text-sm tabular-nums transition-colors duration-200",
                  isOpen
                    ? "bg-primary text-primary-foreground"
                    : "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">{mod.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("courseDetail.lessons", { count: mod.lessons.length })}
                  {totalSec > 0 ? ` · ${durationText(totalSec, t)}` : null}
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </span>
            </button>
            {isOpen ? (
              <ul id={panelId} className="border-t border-border px-2 py-2 sm:px-3">
                {mod.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
                  >
                    {lesson.preview ? (
                      <CirclePlay aria-hidden className="size-[18px] shrink-0 text-primary" />
                    ) : (
                      <Lock aria-hidden className="size-4 shrink-0 text-muted-foreground/70" />
                    )}
                    {/* The marker flows after the title, so on a phone it wraps
                        under a long title instead of squeezing it. */}
                    <span className="min-w-0 flex-1 leading-snug">
                      {lesson.title}
                      {lesson.preview ? (
                        <span className="ml-2 inline-block rounded-full bg-gold-500/15 px-2.5 py-1 align-[1px] text-[11px] font-semibold leading-none text-gold-700 dark:text-gold-300">
                          {t("courseDetail.preview")}
                        </span>
                      ) : null}
                    </span>
                    {lesson.durationSeconds > 0 ? (
                      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {clock(lesson.durationSeconds)}
                      </span>
                    ) : null}
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

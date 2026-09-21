"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/Logo";
import { LocaleLink } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils/cn";
import { VideoPlayer } from "./VideoPlayer";
import { LessonSidebar } from "./LessonSidebar";
import { useUpdateLessonProgress } from "@/features/enrollment/hooks";
import { enrollmentApi } from "@/features/enrollment/api";
import { useAppDispatch } from "@/store/hooks";
import {
  markSaved,
  setCurrentLesson,
  setProgress,
} from "@/store/slices/player-slice";
import { useT, useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import type { Course } from "@/features/course/types";
import type { LessonProgress } from "@/features/enrollment/types";

type Props = {
  course: Course;
  currentLessonId: string;
  initialProgress: Record<string, LessonProgress>;
};

const SAVE_INTERVAL_MS = 10_000;

export function LearningClient({
  course,
  currentLessonId,
  initialProgress,
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useT();
  const locale = useLocale();
  const updateProgress = useUpdateLessonProgress(course.id);

  const [progress, setLocalProgress] =
    useState<Record<string, LessonProgress>>(initialProgress);
  const lastSavedRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  const flatLessons = useMemo(
    () => course.modules.flatMap((m) => m.lessons),
    [course.modules],
  );
  const currentLesson = useMemo(
    () => flatLessons.find((l) => l.id === currentLessonId),
    [flatLessons, currentLessonId],
  );
  const nextLesson = useMemo(() => {
    const idx = flatLessons.findIndex((l) => l.id === currentLessonId);
    return idx >= 0 ? flatLessons[idx + 1] : undefined;
  }, [flatLessons, currentLessonId]);

  const currentProgress = progress[currentLessonId];
  const completed = currentProgress?.status === "COMPLETED";

  useEffect(() => {
    dispatch(setCurrentLesson(currentLessonId));
  }, [currentLessonId, dispatch]);

  const save = (status: LessonProgress["status"]) => {
    updateProgress.mutate(
      {
        lessonId: currentLessonId,
        status,
        positionSec: Math.floor(currentTimeRef.current),
      },
      {
        onSuccess: (data) => {
          setLocalProgress((p) => ({ ...p, [currentLessonId]: data }));
          dispatch(markSaved());
        },
      },
    );
  };

  const onTimeUpdate = (currentTime: number, duration: number) => {
    currentTimeRef.current = currentTime;
    durationRef.current = duration;
    dispatch(setProgress({ currentTime, duration }));
    const now = Date.now();
    if (now - lastSavedRef.current > SAVE_INTERVAL_MS && !completed) {
      lastSavedRef.current = now;
      save("IN_PROGRESS");
    }
  };

  const onEnded = () => save("COMPLETED");

  // Best-effort save when the tab is being hidden or unloaded. We can't use
  // navigator.sendBeacon here because the progress endpoint lives on the
  // backend origin and requires a Bearer token (a beacon can't attach one).
  // Instead we fire the authenticated client request and don't await it —
  // the browser keeps in-flight fetches alive through `pagehide`/`visibilitychange`
  // long enough for this small PUT to land.
  useEffect(() => {
    const flush = () => {
      if (completed || currentTimeRef.current <= 0) return;
      void enrollmentApi
        .updateLessonProgress(course.id, currentLessonId, {
          status: "IN_PROGRESS",
          positionSec: Math.floor(currentTimeRef.current),
        })
        .catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [completed, course.id, currentLessonId]);

  const totalLessons = flatLessons.length;
  const completedCount = Object.values(progress).filter(
    (p) => p.status === "COMPLETED",
  ).length;
  const percent = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  // Where the current lesson sits, for the labels above the player. Display
  // only — navigation still goes through `nextLesson` above.
  const lessonIndex = flatLessons.findIndex((l) => l.id === currentLessonId);
  const moduleIndex = course.modules.findIndex((m) =>
    m.lessons.some((l) => l.id === currentLessonId),
  );
  const currentModule = moduleIndex >= 0 ? course.modules[moduleIndex] : undefined;

  return (
    <div className="min-h-dvh pb-12">
      {/* A focused shell instead of the site header: a way back to the
          course, where you are in it, and how far through you are. */}
      <header className="sticky top-3 z-40 mt-3 px-3 sm:px-5">
        <div className="glass-bar mx-auto flex h-16 max-w-[90rem] items-center gap-2 rounded-full border border-border/80 pl-2 pr-2.5 elev-2 sm:gap-3">
          <LocaleLink
            href={`/courses/${course.slug}`}
            aria-label={t("learn.backToCourse")}
            title={t("learn.backToCourse")}
            className="grid size-11 shrink-0 place-items-center rounded-full text-foreground transition-colors duration-200 hover:bg-accent"
          >
            <ArrowLeft className="size-5" />
          </LocaleLink>
          <LocaleLink
            href="/"
            aria-label="AzTU EduPlatform"
            className="hidden shrink-0 rounded-full pr-1 md:block"
          >
            <Logo />
          </LocaleLink>
          <span aria-hidden className="mx-1 hidden h-8 w-px bg-border md:block" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-snug sm:text-sm">
              {course.title}
            </div>
            {lessonIndex >= 0 ? (
              <div className="truncate text-xs text-muted-foreground">
                {t("learn.lessonOf", { current: lessonIndex + 1, total: totalLessons })}
              </div>
            ) : null}
          </div>
          <ProgressRing percent={percent} label={t("learn.courseProgress")} />
        </div>
      </header>

      <div className="mx-auto grid max-w-[90rem] gap-5 px-3 pt-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-border/80 bg-card p-2 elev-1">
            <VideoPlayer
              src={currentLesson?.videoUrl ?? null}
              initialPositionSec={currentProgress?.positionSec ?? 0}
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
            />
          </div>

          <section className="rounded-3xl border border-border/80 bg-card p-5 elev-1 sm:p-7">
            {currentModule ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-gold-500" />
                <span className="truncate">
                  {t("learn.moduleLabel", { n: moduleIndex + 1 })} · {currentModule.title}
                </span>
              </div>
            ) : null}
            <h1 className="mt-3 font-display text-balance text-2xl leading-tight sm:text-3xl">
              {currentLesson?.title ?? t("learn.noLessonSelected")}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {completed ? (
                <Badge variant="success" className="h-11 gap-2 px-5 text-sm">
                  <CheckCircle2 aria-hidden className="size-4" />
                  {t("learn.completed")}
                </Badge>
              ) : (
                <Button
                  onClick={() => save("COMPLETED")}
                  loading={updateProgress.isPending}
                >
                  {updateProgress.isPending ? null : <Check aria-hidden />}
                  {t("learn.markComplete")}
                </Button>
              )}
              {nextLesson ? (
                <Button
                  variant={completed ? "default" : "outline"}
                  className="group"
                  onClick={() =>
                    router.push(
                      localeHref(locale, `/learn/${course.slug}/${nextLesson.id}`),
                    )
                  }
                >
                  {t("learn.nextLesson")}
                  <ArrowRight
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Button>
              ) : null}
            </div>

            {currentLesson?.description ? (
              <div className="mt-7 border-t border-border/80 pt-6">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("learn.aboutLesson")}
                </h2>
                <p className="mt-2 max-w-3xl whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                  {currentLesson.description}
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <LessonSidebar
          courseSlug={course.slug}
          modules={course.modules}
          currentLessonId={currentLessonId}
          progress={progress}
          completedCount={completedCount}
          totalLessons={totalLessons}
          percent={percent}
        />
      </div>
    </div>
  );
}

/** Course completion as a small ring — legible at a glance, even on a phone. */
function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const done = percent >= 100;
  return (
    <span
      role="img"
      aria-label={`${label}: ${percent}%`}
      className="relative grid size-11 shrink-0 place-items-center"
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-muted dark:stroke-white/10" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, percent)) / 100)}
          className={cn(
            "transition-[stroke-dashoffset] duration-500",
            done ? "stroke-emerald-500" : "stroke-primary",
          )}
        />
      </svg>
      <span aria-hidden className="text-[10px] font-bold tabular-nums text-foreground">
        {percent}%
      </span>
    </span>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "./VideoPlayer";
import { LessonSidebar } from "./LessonSidebar";
import { useUpdateLessonProgress } from "@/features/enrollment/hooks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
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

  useEffect(() => {
    const handler = () => {
      if (!completed && currentTimeRef.current > 0) {
        navigator.sendBeacon?.(
          `/api/portal/enrollments/courses/${course.id}/lessons/${currentLessonId}/progress`,
          new Blob(
            [
              JSON.stringify({
                status: "IN_PROGRESS",
                positionSec: Math.floor(currentTimeRef.current),
              }),
            ],
            { type: "application/json" },
          ),
        );
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [completed, course.id, currentLessonId]);

  const totalLessons = flatLessons.length;
  const completedCount = Object.values(progress).filter(
    (p) => p.status === "COMPLETED",
  ).length;
  const percent = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <LessonSidebar
        courseSlug={course.slug}
        modules={course.modules}
        currentLessonId={currentLessonId}
        progress={progress}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex items-center gap-4 px-6 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-muted-foreground">
                {course.title}
              </div>
              <h1 className="truncate text-base font-semibold">
                {currentLesson?.title ?? t("learn.noLessonSelected")}
              </h1>
            </div>
            <div className="hidden min-w-[180px] items-center gap-2 sm:flex">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {percent}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <VideoPlayer
            src={currentLesson?.videoUrl ?? null}
            initialPositionSec={currentProgress?.positionSec ?? 0}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
          />

          <div className="flex flex-wrap items-center gap-3">
            {completed ? (
              <Badge variant="success">{t("learn.completed")}</Badge>
            ) : (
              <Button
                onClick={() => save("COMPLETED")}
                loading={updateProgress.isPending}
              >
                {t("learn.markComplete")}
              </Button>
            )}
            {nextLesson ? (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    localeHref(locale, `/learn/${course.slug}/${nextLesson.id}`),
                  )
                }
              >
                {t("learn.nextLesson")} →
              </Button>
            ) : null}
          </div>

          {currentLesson?.description ? (
            <div className="prose max-w-none text-sm">
              <p className="whitespace-pre-line text-muted-foreground">
                {currentLesson.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

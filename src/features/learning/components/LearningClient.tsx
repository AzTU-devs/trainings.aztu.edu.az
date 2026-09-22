"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { Kicker } from "@/components/editorial/Kicker";
import { CoverArt } from "@/components/cover/CoverArt";
import { catAttrs, seedOf, type CategoryRef } from "@/features/category/style";
import { formatDuration, LESSON_KIND } from "@/features/course/format";
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
  /**
   * The course's primary category, resolved on the server. Presentation
   * only: it colours the stage when a lesson has no video, the way it colours
   * the course's poster everywhere else. Null draws the navy brand art.
   */
  category?: CategoryRef | null;
};

const SAVE_INTERVAL_MS = 10_000;

export function LearningClient({
  course,
  currentLessonId,
  initialProgress,
  category = null,
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
  // The lesson before this one, as a plain link to its URL — the same kind
  // of link the lesson list already renders for every lesson.
  const prevLesson = lessonIndex > 0 ? flatLessons[lessonIndex - 1] : undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  const kind = currentLesson ? LESSON_KIND[currentLesson.contentType] : undefined;
  const lessonLength = formatDuration(currentLesson?.durationSeconds, t, "long");
  const progressLabel = `${t("learn.courseProgress")}: ${t("student.percent", { n: percent })}`;

  // Without a video the stage shows the course's own poster art in its night
  // palette (the same seed as the course's cover, so it is recognisably this
  // course). Most motifs put their figure dead centre, which is where the
  // lesson type and the honest message sit, so the art is slid into the right
  // third and a mask keeps the middle solid: only the edge shows the poster,
  // clearly, as a frame rather than a dim picture behind the text. The mask
  // is solid to half the stage plus half the message's widest measure (34ch)
  // and a margin (--a: 7.5rem, 10.5rem from sm), then eases out over the rest
  // (a linear ramp reads as a hard vertical cut); the art slides by
  // 22.5% + 0.55·a so the motif's centre lands in that strip. Measured from
  // the text rather than set in percentages, the centre stays clean at every
  // stage width (a phone, the 630px lg column, 888px). The stage
  // is dark in both editions, so its colours are fixed values: the back-cover
  // black (#060b14), one step below the night paper (#0b1320), so in the dark
  // edition the screen still has an edge instead of dissolving into the page.
  const KindIcon = kind?.icon;
  const stageFallback = (
    <div
      {...catAttrs(category)}
      className="relative grid aspect-video w-full place-items-center overflow-hidden bg-[#060b14] [--a:7.5rem] sm:[--a:10.5rem]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-x-[calc(22.5%_+_0.55_*_var(--a))] opacity-70"
        style={
          {
            "--cv-bg": "#060b14",
            "--cv-fg": "var(--cat-t)",
            "--cv-ac": "#c8a951",
            ...catAttrs(category).style,
          } as CSSProperties
        }
      >
        <CoverArt
          cat={category?.key ?? "brand"}
          seed={seedOf(course.id)}
          ratio={16 / 9}
          noTech
          className="absolute inset-0 size-full"
        />
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,#060b14_calc(50%_+_var(--a)),rgb(6_11_20/0.88)_calc(57.5%_+_0.85_*_var(--a)),rgb(6_11_20/0.5)_calc(70%_+_0.6_*_var(--a)),rgb(6_11_20/0.12)_calc(85%_+_0.3_*_var(--a)),rgb(6_11_20/0)_calc(95%_+_0.1_*_var(--a)))]"
      />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {KindIcon ? (
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-full text-[#d6bb6a] shadow-[inset_0_0_0_1px_rgb(214_187_106/0.6)] sm:size-14"
          >
            <KindIcon className="size-5 sm:size-6" strokeWidth={1.75} />
          </span>
        ) : null}
        {kind ? (
          <p className="mt-3 font-mono text-xs font-medium uppercase tracking-[0.08em] text-[#b3bfd2] sm:mt-4">
            {t(kind.nameKey)}
          </p>
        ) : null}
        <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-[#eee8dc] sm:text-base">
          {currentLesson?.contentType === "VIDEO" || !currentLesson
            ? t("learn.videoUnavailable")
            : t("learn.materialUnavailable")}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        {t("nav.skipToContent")}
      </a>
      {/* A focused shell instead of the site header: the brand, the course,
          how far through it you are, and a way back to it. "How far" is the
          same figure at every width — lessons completed, with the gold meter
          — so the bar never says "0/18" on a laptop and "Lesson 1 of 18" on
          a phone. Where you are in the course is the kicker's job below. */}
      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--c-paper)_88%,transparent)] backdrop-blur-[16px] backdrop-saturate-[1.4]">
        <div className="wrap flex h-16 items-center gap-3 md:gap-5">
          {/* 44px square at least: on phones the mark alone is only 20px wide. */}
          <LocaleLink href="/" aria-label="AzTU EduPlatform" className="grid min-h-11 min-w-11 shrink-0 place-items-center">
            <Logo className="hidden md:inline-flex" />
            <Logo variant="mark" className="md:hidden" />
          </LocaleLink>
          <span aria-hidden="true" className="h-8 w-px shrink-0 bg-line-2" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-snug text-ink">
              <span className="sr-only">{t("learn.courseTitleLabel")}: </span>
              {course.title}
            </p>
            {/* Phones: the figure and a short meter under the title. Only one
                of the two meters is displayed at a time, so a screen reader
                hears the figure once. */}
            <div role="img" aria-label={progressLabel} className="mt-0.5 flex items-center gap-2.5 sm:hidden">
              <span aria-hidden="true" className="truncate font-mono text-xs tabular-nums text-ink-2">
                {t("learn.progressShort", { done: completedCount, total: totalLessons })}
              </span>
              <span aria-hidden="true" className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-paper-2 dark:bg-line">
                <span
                  className="block h-full rounded-full bg-gold transition-[width] duration-(--dur-3) ease-out motion-reduce:transition-none"
                  style={{ width: `${percent}%` }}
                />
              </span>
            </div>
          </div>
          <div role="img" aria-label={progressLabel} className="hidden shrink-0 items-center gap-3 sm:flex">
            <span aria-hidden="true" className="font-mono text-xs tabular-nums text-ink-2">
              {t("learn.progressShort", { done: completedCount, total: totalLessons })}
            </span>
            {/* Warm paper-2 track, as in the prototype's meters; paper-2 all but
                vanishes on night paper, so the dark edition takes the soft hairline. */}
            <span aria-hidden="true" className="h-1.5 w-[120px] overflow-hidden rounded-full bg-paper-2 dark:bg-line">
              <span
                className="block h-full rounded-full bg-gold transition-[width] duration-(--dur-3) ease-out motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
              />
            </span>
          </div>
          <LocaleLink
            href={`/courses/${course.slug}`}
            aria-label={t("learn.backToCourse")}
            className={cn(buttonVariants({ variant: "quiet", size: "sm" }), "shrink-0 max-md:size-10 max-md:px-0")}
          >
            <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
            <span className="hidden md:inline">{t("learn.backToCourse")}</span>
          </LocaleLink>
        </div>
      </header>

      <main id="main" className="wrap g12 w-full flex-1 content-start gap-y-12 pb-20 pt-0 sm:pt-6 md:pt-8 lg:pb-28">
        <div className="col-span-4 min-w-0 md:col-span-8 lg:col-span-8">
          {/* A dark screen in both editions (see stageFallback). The ring is
              drawn on top of the video by an overlay, not as the frame's own
              inset shadow, because the video or the fallback fills the frame
              and would paint over it. Light enough to catch on the night
              paper, too faint to matter on the day paper. Edge to edge on
              phones, where only the top and bottom edges show. */}
          <div className="relative overflow-hidden bg-[#060b14] max-sm:-mx-(--margin) sm:rounded-card">
            <VideoPlayer
              src={currentLesson?.videoUrl ?? null}
              initialPositionSec={currentProgress?.positionSec ?? 0}
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
              fallback={stageFallback}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgb(238_232_220/0.1)] sm:rounded-card"
            />
          </div>

          <div className="mt-7 md:mt-9">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              {lessonIndex >= 0 && moduleIndex >= 0 ? (
                <Kicker tone="gold">
                  {t("learn.moduleLesson", { m: pad(moduleIndex + 1), n: pad(lessonIndex + 1) })}
                </Kicker>
              ) : null}
              {kind ? (
                <Kicker as="span" tone="ink-3">
                  {t(kind.nameKey)}
                  {lessonLength ? ` · ${lessonLength}` : ""}
                </Kicker>
              ) : null}
            </div>
            <h1 className="t-display-m mt-3 max-w-[30ch]">
              {currentLesson?.title ?? t("learn.noLessonSelected")}
            </h1>
            {currentModule ? <p className="t-meta mt-3 text-[15px]">{currentModule.title}</p> : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              {/* The ring gives the pill a shape on night paper, where paper-2
                  alone is barely a shade off the page. Full width on phones,
                  like the button it replaces. */}
              {completed ? (
                <p className="inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-full bg-paper-2 px-5 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--c-line-2)] sm:w-auto sm:self-start">
                  <Check aria-hidden="true" strokeWidth={2.25} className="size-[18px] text-gold-ink" />
                  {t("learn.completed")}
                </p>
              ) : (
                <Button onClick={() => save("COMPLETED")} loading={updateProgress.isPending} className="w-full sm:w-auto">
                  {updateProgress.isPending ? null : <Check aria-hidden="true" />}
                  {t("learn.markComplete")}
                </Button>
              )}
              {/* Phones: two links share the row half and half; a lone link
                  (first or last lesson) takes the whole row rather than
                  sitting in one column of an empty grid. */}
              {prevLesson || nextLesson ? (
                <nav
                  aria-label={t("learn.lessonNav")}
                  className={cn("grid gap-3 sm:flex", prevLesson && nextLesson && "grid-cols-2")}
                >
                  {prevLesson ? (
                    <LocaleLink
                      href={`/learn/${course.slug}/${prevLesson.id}`}
                      className={cn(buttonVariants({ variant: "outline" }), "px-5 max-sm:gap-2 max-sm:px-3 max-sm:text-[15px]")}
                    >
                      <ArrowLeft aria-hidden="true" />
                      {t("learn.prevLesson")}
                    </LocaleLink>
                  ) : null}
                  {nextLesson ? (
                    <Button
                      variant={completed ? "default" : "outline"}
                      className="px-5 max-sm:gap-2 max-sm:px-3 max-sm:text-[15px]"
                      onClick={() =>
                        router.push(
                          localeHref(locale, `/learn/${course.slug}/${nextLesson.id}`),
                        )
                      }
                    >
                      {t("learn.nextLesson")}
                      <ArrowRight aria-hidden="true" data-go />
                    </Button>
                  ) : null}
                </nav>
              ) : null}
            </div>

            {currentLesson?.description ? (
              <section aria-labelledby="lesson-about" className="mt-12">
                <Kicker as="h2" id="lesson-about" tone="ink-2" className="border-t border-line-strong pt-3">
                  {t("learn.aboutLesson")}
                </Kicker>
                <div className="prose mt-5">
                  <p className="whitespace-pre-line">{currentLesson.description}</p>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <LessonSidebar
          className="col-span-4 md:col-span-8 lg:col-span-4"
          courseSlug={course.slug}
          modules={course.modules}
          currentLessonId={currentLessonId}
          progress={progress}
          completedCount={completedCount}
          totalLessons={totalLessons}
          percent={percent}
        />
      </main>
    </div>
  );
}

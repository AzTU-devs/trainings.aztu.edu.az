"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Globe,
  GraduationCap,
  Gift,
  MonitorPlay,
  MapPin,
  Signal,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/common/SectionHeading";
import { AztuMark } from "@/components/layout/AztuMark";
import { LocaleLink } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils/cn";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type HeroLabels = {
  university: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  browseCourses: string;
  createAccount: string;
  valueFree: string;
  valueProgress: string;
  valueModes: string;
  valueExperts: string;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

/**
 * The landing hero: a contained, rounded deep-navy panel.
 *
 * The left column carries the promise, a search that goes straight to the
 * catalogue and a short list of what is actually on offer. The right column is
 * `preview` — the page passes in the real newest course from the API (or a
 * purely decorative composition when the catalogue is empty), so nothing here
 * is a mock-up of a course that does not exist. Earlier versions showed an
 * invented course, XP and a row of made-up totals; those are gone for good.
 */
export function Hero({
  coursesHref,
  registerHref,
  labels,
  preview,
}: {
  coursesHref: string;
  registerHref: string;
  labels: HeroLabels;
  preview: ReactNode;
}) {
  const reduce = useReducedMotion();

  const values = [
    { icon: Gift, text: labels.valueFree },
    { icon: TrendingUp, text: labels.valueProgress },
    { icon: MonitorPlay, text: labels.valueModes },
    { icon: GraduationCap, text: labels.valueExperts },
  ];

  return (
    <section className="container-fluid pt-4">
      <div className="surface-deep relative isolate overflow-hidden rounded-4xl">
        {/* Two faint rings behind the preview give the right half some depth
            without adding another object to read. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 -z-10 hidden size-[40rem] rounded-full border border-white/[0.06] lg:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 -z-10 hidden size-[28rem] rounded-full border border-white/[0.07] lg:block"
        />

        <div className="grid items-center gap-14 px-5 pb-10 pt-12 sm:px-10 sm:pb-14 sm:pt-16 lg:grid-cols-12 lg:gap-10 lg:px-14 lg:py-20 xl:px-16">
          {/* ---- Copy ---- */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="min-w-0 lg:col-span-7"
          >
            <motion.div variants={item}>
              <Eyebrow tone="deep">{labels.university}</Eyebrow>
            </motion.div>

            <motion.h1
              variants={item}
              className="font-display mt-6 max-w-[15ch] text-balance text-[2.6rem] font-extrabold leading-[1.02] text-white sm:text-6xl lg:text-[4.25rem]"
            >
              {labels.heroTitle}
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/72 sm:text-lg"
            >
              {labels.heroSubtitle}
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
            >
              <form
                action={coursesHref}
                className="flex h-14 min-w-0 flex-1 items-center gap-2 rounded-full bg-card p-1.5 pl-5 text-card-foreground shadow-[0_18px_40px_-18px_rgb(0_6_16/0.9)] ring-1 ring-white/15 transition-shadow focus-within:ring-2 focus-within:ring-gold-400/70"
              >
                <Search aria-hidden className="size-[18px] shrink-0 text-muted-foreground" />
                <input
                  name="q"
                  type="search"
                  placeholder={labels.searchPlaceholder}
                  aria-label={labels.searchPlaceholder}
                  className="w-0 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                />
                {/* A phone has no room for the label beside the field, so there
                    the button is a round arrow and the label is read out only. */}
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "gold" }),
                    "size-11 shrink-0 px-0 sm:h-11 sm:w-auto sm:px-5",
                  )}
                >
                  <span className="sr-only sm:not-sr-only">{labels.browseCourses}</span>
                  <ArrowRight aria-hidden className="sm:hidden" />
                </button>
              </form>
              <a
                href={registerHref}
                className={cn(
                  buttonVariants({ variant: "onDeep" }),
                  "group h-14 shrink-0 px-6",
                )}
              >
                {labels.createAccount}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </motion.div>

            {/* What is on offer, in words rather than invented totals. On a
                phone the four read as a plain two-column list under a hairline:
                glass pills would have to wrap their longer labels onto two
                lines and crowd the rounded ends. From `sm` up they become
                pills, and on wide screens a tidy 2×2 block instead of wrapping
                3 + 1 at whatever width the longest locale happens to need. */}
            <motion.ul
              variants={item}
              className="mt-9 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/10 pt-7 sm:mt-10 sm:flex sm:flex-wrap sm:gap-2 sm:border-0 sm:pt-0 lg:grid lg:w-fit lg:grid-cols-2"
            >
              {values.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium leading-snug text-white/85 sm:min-h-10 sm:gap-2 sm:rounded-full sm:bg-white/[0.07] sm:py-0 sm:pl-1.5 sm:pr-4 sm:leading-tight sm:ring-1 sm:ring-inset sm:ring-white/12 sm:backdrop-blur-md"
                >
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-300"
                  >
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">{text}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* ---- Preview ---- */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.25 }}
            className="min-w-0 lg:col-span-5"
          >
            {preview}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Preview variants                                                   */
/* ------------------------------------------------------------------ */

export type HeroCourse = {
  slug: string;
  title: string;
  /** Already resolved with `mediaSrc()` on the server. */
  thumbnail: string | null;
  online: boolean;
  free: boolean;
  tutorName: string;
};

export type HeroCourseLabels = {
  eyebrow: string;
  cta: string;
  tutor: string;
  /** "Onlayn" / "Oflayn", for the frosted pill on the cover. */
  formatValue: string;
  /** "Pulsuz", or the course's price already formatted for the locale. */
  price: string;
  level: string;
  levelValue: string;
  /**
   * The second fact beside the level: the teaching language when the course
   * names one, otherwise the format.
   */
  extra: { kind: "language" | "format"; label: string; value: string };
};

/**
 * The newest published course, as a white card floating on the navy panel.
 * Every value on it — title, format, price, level, language, tutor — comes
 * from the API.
 *
 * The cover is dressed exactly like CourseCard's (same navy gradient for the
 * slug, initials in a frosted squircle, frosted format and price pills), so a
 * course without a thumbnail looks the same here as in the grid right below.
 */
export function HeroCourseCard({
  course,
  labels,
}: {
  course: HeroCourse;
  labels: HeroCourseLabels;
}) {
  const FormatIcon = course.online ? MonitorPlay : MapPin;
  const ExtraIcon = labels.extra.kind === "language" ? Globe : FormatIcon;

  return (
    <div className="relative mx-auto w-full max-w-[26rem] lg:mr-0">
      {/* A tilted plate behind the card: pure depth, it carries no content. */}
      <span
        aria-hidden
        className="absolute inset-x-8 -bottom-4 top-8 rotate-[4deg] rounded-3xl bg-white/[0.07] ring-1 ring-inset ring-white/12"
      />

      <LocaleLink
        href={`/courses/${course.slug}`}
        prefetch
        className="group relative block rounded-3xl bg-card p-2 text-card-foreground shadow-[0_40px_80px_-28px_rgb(0_6_16/0.95)] ring-1 ring-white/10 transition duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div
          className={cn(
            "relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br",
            coverFor(course.slug),
          )}
        >
          {course.thumbnail ? (
            // Same reasoning as CourseCard: `unoptimized` lets the browser load
            // the API's media URL directly instead of the server fetching the
            // public hostname through /_next/image, which can fail on the
            // university network. The title below names the course, so the
            // cover is decorative.
            <Image
              src={course.thumbnail}
              alt=""
              fill
              unoptimized
              sizes="416px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
          ) : (
            <CoverArt initials={initialsOf(course.title)} />
          )}

          {/* A light scrim keeps the pills legible on bright photos. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent"
          />
          <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
            <span className={cn(GLASS, "bg-black/30 text-white ring-1 ring-inset ring-white/20")}>
              <FormatIcon aria-hidden className="size-3.5" />
              {labels.formatValue}
            </span>
            <span
              className={cn(
                GLASS,
                "bg-white/90 text-navy-900 ring-1 ring-inset ring-white/60 dark:bg-navy-950/70 dark:text-white dark:ring-white/15",
              )}
            >
              {course.free ? (
                <span aria-hidden className="size-1.5 rounded-full bg-gold-500" />
              ) : null}
              {labels.price}
            </span>
          </div>
        </div>

        <div className="px-4 pb-4 pt-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-700 dark:text-gold-300">
            <Sparkles aria-hidden className="size-3.5" />
            {labels.eyebrow}
          </div>
          <h2 className="font-display mt-2 line-clamp-2 text-xl leading-snug transition-colors group-hover:text-primary">
            {course.title}
          </h2>

          <dl className="mt-5 grid grid-cols-2 gap-2">
            <Fact icon={<Signal className="size-4" />} label={labels.level} value={labels.levelValue} />
            <Fact
              icon={<ExtraIcon className="size-4" />}
              label={labels.extra.label}
              value={labels.extra.value}
            />
          </dl>

          <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-full bg-navy-50 text-xs font-bold text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
            >
              {initialsOf(course.tutorName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{course.tutorName}</div>
              <div className="text-xs text-muted-foreground">{labels.tutor}</div>
            </div>
            {/* The whole card is the link; on a phone the label gives way to
                the tutor's name and only the arrow remains. */}
            <span className="inline-flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-navy-50 text-[13px] font-semibold text-navy-700 transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:w-auto sm:px-4 dark:bg-navy-900/60 dark:text-navy-100">
              <span className="hidden sm:inline">{labels.cta}</span>
              <ArrowUpRight aria-hidden className="size-4" />
            </span>
          </div>
        </div>
      </LocaleLink>
    </div>
  );
}

/*
 * The cover pieces below mirror CourseCard (its COVERS, `coverFor`, `CoverArt`
 * and GLASS pill) so the same course has one "no thumbnail" look everywhere.
 * CourseCard does not export them yet; once it does, import them instead of
 * keeping this copy in step by hand.
 */
const COVERS = [
  "from-navy-500 via-navy-700 to-navy-950",
  "from-navy-600 via-navy-800 to-[#0b2545]",
  "from-[#1f6d8c] via-navy-700 to-navy-950",
  "from-navy-400 via-navy-700 to-navy-950",
  "from-[#2a5f7a] via-navy-800 to-navy-950",
  "from-navy-500 via-[#123f73] to-navy-900",
] as const;

function coverFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return COVERS[Math.abs(h) % COVERS.length];
}

/** Frosted pill laid over the cover image. */
const GLASS =
  "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold backdrop-blur-md";

function CoverArt({ initials }: { initials: string }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute -right-10 -top-14 size-48 rounded-full bg-[radial-gradient(circle,rgba(200,169,81,0.45)_0%,transparent_65%)] blur-2xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-20 -left-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(66,118,179,0.55)_0%,transparent_65%)] blur-2xl"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[image:var(--grain)] opacity-70 mix-blend-soft-light"
      />
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center pt-6 transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
      >
        <span className="grid size-16 place-items-center rounded-2xl bg-white/10 font-display text-2xl text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),0_16px_32px_-12px_rgb(0_6_16/0.6)] ring-1 ring-inset ring-white/20 backdrop-blur-sm">
          {initials}
        </span>
      </span>
    </>
  );
}

/*
 * On a phone each fact is only ~130px wide, so the icon steps aside to leave
 * the value room ("Azərbaycan dili" would otherwise be cut to "Azərbay…"), and
 * a value that still does not fit wraps instead of being truncated.
 */
function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-muted/70 px-3.5 py-2.5 sm:p-2.5">
      <span
        aria-hidden
        className="hidden size-9 shrink-0 place-items-center rounded-xl bg-card text-navy-700 elev-1 sm:grid dark:bg-navy-800/60 dark:text-navy-100 dark:ring-1 dark:ring-inset dark:ring-white/10"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
        <dd className="text-[13px] font-semibold leading-snug break-words">{value}</dd>
      </div>
    </div>
  );
}

/** Holds the card's footprint while the course list streams in. */
export function HeroCourseSkeleton() {
  return (
    <div className="relative mx-auto w-full max-w-[26rem] lg:mr-0" aria-hidden>
      <div className="rounded-3xl bg-white/[0.08] p-2 ring-1 ring-inset ring-white/12">
        <div className="aspect-[16/10] animate-pulse rounded-2xl bg-white/[0.08]" />
        <div className="space-y-3 px-4 pb-5 pt-5">
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/[0.12]" />
          <div className="h-5 w-4/5 animate-pulse rounded-full bg-white/[0.12]" />
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="h-14 animate-pulse rounded-2xl bg-white/[0.08]" />
            <div className="h-14 animate-pulse rounded-2xl bg-white/[0.08]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown only when nothing is published yet. It is deliberately abstract — the
 * university mark and a few glass shapes — so an empty catalogue never gets
 * dressed up as a course that is not there.
 */
export function HeroDecor() {
  const tiles = [
    { icon: BookOpen, className: "left-0 top-6 -rotate-6" },
    { icon: TrendingUp, className: "right-2 top-0 rotate-6" },
    { icon: Users, className: "bottom-4 left-8 rotate-3" },
    { icon: GraduationCap, className: "bottom-0 right-6 -rotate-3" },
  ];
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[17rem] sm:max-w-[24rem] lg:mr-0">
      <span className="absolute inset-[12%] rounded-full border border-white/10" />
      <span className="absolute inset-[26%] rounded-full border border-white/[0.14]" />
      <span className="absolute inset-[34%] grid place-items-center rounded-4xl bg-white/[0.08] ring-1 ring-inset ring-white/15 backdrop-blur-md">
        <AztuMark tone="onDeep" className="size-16" />
      </span>
      {tiles.map(({ icon: Icon, className }, i) => (
        <span
          key={i}
          className={cn(
            "absolute grid size-16 place-items-center rounded-2xl bg-white/[0.08] text-gold-300 ring-1 ring-inset ring-white/15 backdrop-blur-md",
            className,
          )}
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </span>
      ))}
    </div>
  );
}

function initialsOf(text: string) {
  return text
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

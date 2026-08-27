"use client";

import {
  Search,
  Check,
  ShieldCheck,
  Play,
  Star,
  Clock,
  Users,
  ArrowRight,
  Award,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/common/Counter";
import { AztuMark } from "@/components/layout/AztuMark";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type HeroLabels = {
  university: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  browseCourses: string;
  createAccount: string;
  badgeFree: string;
  badgeModes: string;
  badgeVerified: string;
  previewCourse1Title: string;
  previewCourse1Meta: string;
  previewCourse2Title: string;
  previewCourse2Meta: string;
  previewLessonDone: string;
  previewXp: string;
  statLearners: string;
  statCourses: string;
  statTutors: string;
  statRating: string;
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
 * Type-led hero on the deep navy canvas.
 *
 * The copy carries the page — an oversized serif statement on a 7/5 split —
 * and the right column shows one real product surface rather than a cluster of
 * floating decorations. The canvas itself supplies its lighting and grain via
 * `.surface-deep`, so there are no decorative elements in the markup.
 */
export function Hero({
  coursesHref,
  registerHref,
  labels,
}: {
  coursesHref: string;
  registerHref: string;
  labels: HeroLabels;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="surface-deep relative overflow-hidden">
      <div className="container-fluid grid items-center gap-16 py-20 lg:grid-cols-12 lg:gap-14 lg:py-32">
        {/* ---- Copy ---- */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-7"
        >
          <motion.div variants={item} className="mb-8 flex items-center gap-3">
            <AztuMark tone="onDeep" className="size-5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300">
              {labels.university}
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display max-w-[16ch] text-balance text-[2.9rem] leading-[1.02] text-white sm:text-6xl lg:text-[4.5rem]"
          >
            {labels.heroTitle}
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-lg text-pretty text-lg leading-relaxed text-white/60"
          >
            {labels.heroSubtitle}
          </motion.p>

          <motion.form
            variants={item}
            action={coursesHref}
            className="mt-10 flex max-w-lg items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] p-2 pl-5 backdrop-blur-md transition-colors focus-within:border-gold-500/50"
          >
            <Search className="size-4 shrink-0 text-white/45" />
            <input
              name="q"
              type="search"
              placeholder={labels.searchPlaceholder}
              aria-label={labels.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
            <Button type="submit" variant="gold" size="sm" className="shrink-0">
              {labels.browseCourses}
            </Button>
          </motion.form>

          <motion.div variants={item} className="mt-6">
            <a
              href={registerHref}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {labels.createAccount}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/55"
          >
            <Trust icon={<Check className="size-3.5" />} text={labels.badgeFree} />
            <Trust icon={<Check className="size-3.5" />} text={labels.badgeModes} />
            <Trust icon={<ShieldCheck className="size-3.5" />} text={labels.badgeVerified} />
          </motion.ul>
        </motion.div>

        {/* ---- Product panel ---- */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.25 }}
          className="lg:col-span-5"
        >
          <CoursePanel labels={labels} />
        </motion.div>
      </div>

      {/* ---- Proof strip ---- */}
      <div className="relative border-t border-white/10">
        <div className="container-fluid grid grid-cols-2 gap-y-10 py-12 sm:grid-cols-4 sm:gap-y-0">
          <Stat label={labels.statLearners} value={<Counter to={12} suffix="K+" />} />
          <Stat label={labels.statCourses} value={<Counter to={320} suffix="+" />} />
          <Stat label={labels.statTutors} value={<Counter to={80} suffix="+" />} />
          <Stat label={labels.statRating} value={<Counter to={4.8} decimals={1} />} />
        </div>
      </div>
    </section>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className="text-gold-400">
        {icon}
      </span>
      {text}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-l border-white/10 pl-5 first:border-l-0 first:pl-0 sm:border-l sm:pl-8 sm:first:pl-0">
      <div className="font-display text-4xl leading-none text-white sm:text-5xl">
        {value}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
    </div>
  );
}

/**
 * One product surface, not a cluster: a course with its cover, live progress
 * and what comes next. It says "this is a training platform" in a way three
 * floating glass rectangles never did.
 */
function CoursePanel({ labels }: { labels: HeroLabels }) {
  return (
    <article className="panel-onDeep rounded-[1.5rem] p-3">
      {/* Cover */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-[1.1rem] bg-gradient-to-br from-navy-400 via-navy-700 to-navy-950">
        <span
          aria-hidden
          className="absolute -right-8 -top-12 size-48 rounded-full bg-[radial-gradient(circle,rgba(200,169,81,0.55)_0%,transparent_65%)] blur-2xl"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur">
          Online
        </span>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full bg-white/15 ring-1 ring-inset ring-white/30 backdrop-blur-sm transition-transform duration-500 hover:scale-105">
            <Play className="size-5 translate-x-px fill-white text-white" />
          </span>
        </span>
      </div>

      {/* Title */}
      <div className="px-3 pb-1 pt-5">
        <h2 className="font-display text-xl leading-snug text-white">
          {labels.previewCourse1Title}
        </h2>
        <div className="mt-2.5 flex items-center gap-4 text-[11px] text-white/45">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3" />
            {labels.previewCourse1Meta}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3" />
            1.2K
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-3 fill-gold-400 text-gold-400" />
            4.9
          </span>
        </div>
      </div>

      {/* Live progress */}
      <div className="mt-5 rounded-2xl bg-white/[0.05] p-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-2 font-medium text-white">
            <span className="grid size-5 place-items-center rounded-full bg-gold-500/25 text-gold-300">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {labels.previewLessonDone}
          </span>
          <span className="font-medium text-gold-300">{labels.previewXp}</span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/12">
          <span className="block h-full w-[72%] rounded-full bg-gradient-to-r from-gold-500 to-gold-300" />
        </div>
      </div>

      {/* Up next */}
      <div className="mt-2 flex items-center gap-3 rounded-2xl p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950">
          <Award className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-white">
            {labels.previewCourse2Title}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-white/45">
            {labels.previewCourse2Meta}
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-white/35" />
      </div>
    </article>
  );
}

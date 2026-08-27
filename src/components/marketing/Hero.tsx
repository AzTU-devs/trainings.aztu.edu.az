"use client";

import {
  Search,
  Check,
  ShieldCheck,
  PlayCircle,
  Award,
  Star,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
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
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

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

  // Pointer parallax — normalised to [-0.5, 0.5] across the hero.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 90, damping: 20, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 90, damping: 20, mass: 0.5 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="surface-deep relative overflow-hidden"
    >
      {/* ---- Ambient background ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora -left-[12%] -top-[20%] size-[46rem] bg-[radial-gradient(circle,#1a5ba5_0%,transparent_62%)]" />
        <div
          className="aurora -right-[8%] top-[6%] size-[36rem] bg-[radial-gradient(circle,#c8a951_0%,transparent_62%)] opacity-[0.18]"
          style={{ animationDelay: "-9s" }}
        />
        <div className="absolute inset-0 grid-lines fade-edges" />
      </div>

      <div className="container-fluid relative grid items-center gap-16 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
        {/* ---- Copy column ---- */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-6"
        >
          <motion.div variants={item} className="mb-7 flex items-center gap-3">
            <span
              aria-hidden
              className="h-px w-8 bg-gradient-to-r from-gold-400 to-gold-400/0"
            />
            <AztuMark tone="onDeep" className="size-[18px]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
              {labels.university}
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display text-balance text-[2.75rem] leading-[1.06] text-white sm:text-6xl lg:text-[4.25rem]"
          >
            {labels.heroTitle}
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/65"
          >
            {labels.heroSubtitle}
          </motion.p>

          <motion.form
            variants={item}
            action={coursesHref}
            className="panel-onDeep mt-9 flex max-w-xl items-center gap-2 rounded-full p-2 pl-5 transition-[border-color] focus-within:border-gold-500/40"
          >
            <Search className="size-4 shrink-0 text-white/50" />
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

          <motion.div variants={item} className="mt-5">
            <a
              href={registerHref}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {labels.createAccount}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/60"
          >
            <Trust icon={<Check className="size-3.5" />} text={labels.badgeFree} />
            <Trust icon={<Check className="size-3.5" />} text={labels.badgeModes} />
            <Trust icon={<ShieldCheck className="size-3.5" />} text={labels.badgeVerified} />
          </motion.ul>
        </motion.div>

        {/* ---- Showcase column ---- */}
        <div className="relative hidden lg:col-span-6 lg:block">
          <Showcase sx={sx} sy={sy} labels={labels} />
        </div>
      </div>

      {/* ---- Stat bar ---- */}
      <div className="relative border-t border-white/10">
        <div className="container-fluid grid grid-cols-2 gap-y-9 divide-white/10 py-10 sm:grid-cols-4 sm:gap-y-0 sm:divide-x">
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
      <span
        aria-hidden
        className="grid size-5 place-items-center rounded-full bg-gold-500/15 text-gold-300"
      >
        {icon}
      </span>
      {text}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-2 text-center sm:px-6 sm:text-left sm:first:pl-0">
      <div className="font-display text-4xl leading-none text-white sm:text-[2.75rem]">
        {value}
      </div>
      <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
    </div>
  );
}

/**
 * The floating card cluster. Two credible course cards and a progress chip —
 * a small, honest preview of the product rather than an abstract glow.
 */
function Showcase({
  sx,
  sy,
  labels,
}: {
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  labels: HeroLabels;
}) {
  const deep = useParallax(sx, sy, 10);
  const mid = useParallax(sx, sy, 20);
  const near = useParallax(sx, sy, 32);

  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-xl">
      {/* A soft gold pool behind the cluster gives it something to sit on. */}
      <div
        aria-hidden
        className="pulse-soft absolute inset-x-10 inset-y-14 rounded-full bg-[radial-gradient(circle,#c8a951_0%,transparent_65%)] opacity-20 blur-3xl"
      />

      {/* Primary course card */}
      <motion.article
        style={{ x: mid.x, y: mid.y }}
        initial={{ opacity: 0, y: 24, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -2.5 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.18 }}
        className="panel-onDeep absolute left-0 top-4 w-[19rem] rounded-3xl p-3"
      >
        <div className="relative mb-3.5 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-navy-500 via-navy-700 to-navy-950">
          <div aria-hidden className="absolute inset-0 grid-lines opacity-50" />
          <PlayCircle className="relative size-11 text-white/90" strokeWidth={1.25} />
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur">
            Online
          </span>
        </div>
        <div className="px-1 pb-1">
          <h3 className="text-[15px] font-semibold text-white">
            {labels.previewCourse1Title}
          </h3>
          <div className="mt-2 flex items-center gap-3.5 text-[11px] text-white/50">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {labels.previewCourse1Meta}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              1.2K
            </span>
          </div>
        </div>
      </motion.article>

      {/* Secondary course card */}
      <motion.article
        style={{ x: near.x, y: near.y }}
        initial={{ opacity: 0, y: 24, rotate: 4 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.32 }}
        className="panel-onDeep absolute bottom-2 right-0 w-[17.5rem] rounded-3xl p-3"
      >
        <div className="relative mb-3.5 grid aspect-video place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700">
          <div aria-hidden className="absolute inset-0 grid-lines opacity-30" />
          <Award className="relative size-11 text-navy-950/80" strokeWidth={1.25} />
          <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            Offline
          </span>
        </div>
        <div className="flex items-start justify-between gap-2 px-1 pb-1">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-white">
              {labels.previewCourse2Title}
            </h3>
            <p className="mt-1.5 text-[11px] text-white/50">
              {labels.previewCourse2Meta}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-white">
            <Star className="size-3 fill-gold-400 text-gold-400" />
            4.9
          </span>
        </div>
      </motion.article>

      {/* Progress chip */}
      <motion.div
        style={{ x: deep.x, y: deep.y }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
        className="panel-onDeep absolute left-4 top-[62%] flex w-56 items-center gap-3 rounded-2xl px-3.5 py-3"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-500/20 text-gold-300">
          <Check className="size-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">
            {labels.previewLessonDone}
          </div>
          <div className="mt-1 truncate text-[11px] text-white/50">
            {labels.previewXp}
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/15">
            <span className="block h-full w-[72%] rounded-full bg-gold-400" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function useParallax(sx: MotionValue<number>, sy: MotionValue<number>, mag: number) {
  return {
    x: useTransform(sx, [-0.5, 0.5], [-mag, mag]),
    y: useTransform(sy, [-0.5, 0.5], [-mag, mag]),
  };
}

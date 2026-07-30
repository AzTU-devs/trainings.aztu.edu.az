"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  PlayCircle,
  GraduationCap,
  Award,
  Star,
  Sparkles,
  Code2,
  Brain,
  Rocket,
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
import { Icon3D } from "@/components/common/Icon3D";
import { Counter } from "@/components/common/Counter";

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
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
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
  const sx = useSpring(px, { stiffness: 110, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 110, damping: 18, mass: 0.4 });

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
      className="hero-cosmic relative overflow-hidden"
    >
      {/* ---- Ambient background ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob left-[-10%] top-[-15%] size-[42rem] bg-[radial-gradient(circle,oklch(0.6_0.26_295)_0%,transparent_60%)]" />
        <div
          className="aurora-blob right-[-12%] top-[8%] size-[40rem] bg-[radial-gradient(circle,oklch(0.7_0.18_200)_0%,transparent_60%)]"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="aurora-blob bottom-[-25%] left-[25%] size-[44rem] bg-[radial-gradient(circle,oklch(0.62_0.27_345)_0%,transparent_60%)]"
          style={{ animationDelay: "-12s" }}
        />
        <div className="absolute inset-0 grid-pattern-glow mask-radial-fade" />
        <Stars />
      </div>

      <div className="container-fluid relative grid gap-14 py-20 lg:grid-cols-12 lg:py-28">
        {/* ---- Copy column ---- */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-7 lg:col-span-6"
        >
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Image
                src="/aztu-logo-mark.png"
                alt=""
                width={16}
                height={16}
                className="size-4 object-contain"
              />
              {labels.university}
              <span className="ml-1 size-1.5 animate-pulse rounded-full bg-emerald-400" />
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-balance text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            <span className="text-aurora text-glow">{labels.heroTitle}</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-xl text-lg text-white/70"
          >
            {labels.heroSubtitle}
          </motion.p>

          <motion.form
            variants={item}
            action={coursesHref}
            className="group flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1.5 pl-5 backdrop-blur-xl transition-all focus-within:border-violet-400/60 focus-within:shadow-[0_0_40px_-8px_oklch(0.62_0.26_295/0.7)]"
          >
            <Search className="size-4 text-white/60" />
            <input
              name="q"
              type="search"
              placeholder={labels.searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
            />
            <Button
              type="submit"
              size="sm"
              className="shimmer-sweep rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 hover:from-violet-400 hover:to-fuchsia-400"
            >
              {labels.browseCourses}
            </Button>
          </motion.form>

          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm text-white/70"
          >
            <Trust icon={<CheckCircle2 className="size-4 text-emerald-400" />} text={labels.badgeFree} />
            <Trust icon={<CheckCircle2 className="size-4 text-emerald-400" />} text={labels.badgeModes} />
            <Trust icon={<ShieldCheck className="size-4 text-cyan-400" />} text={labels.badgeVerified} />
          </motion.div>
        </motion.div>

        {/* ---- 3D visual column ---- */}
        <div className="relative hidden lg:col-span-6 lg:block">
          <Showcase sx={sx} sy={sy} labels={labels} />
        </div>
      </div>

      {/* ---- Stat bar ---- */}
      <div className="relative border-t border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <div className="container-fluid grid grid-cols-2 gap-y-8 py-10 sm:grid-cols-4">
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
    <span className="flex items-center gap-1.5">
      {icon}
      {text}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-center sm:text-left">
      <div className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/50">{label}</div>
    </div>
  );
}

/** The floating 3D card cluster, parallaxed against pointer movement. */
function Showcase({
  sx,
  sy,
  labels,
}: {
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  labels: HeroLabels;
}) {
  // Different depths move at different magnitudes for a parallax feel.
  const deep = useParallax(sx, sy, 14);
  const mid = useParallax(sx, sy, 26);
  const near = useParallax(sx, sy, 42);

  return (
    <div className="perspective relative mx-auto aspect-square w-full max-w-lg">
      {/* halo */}
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/20 blur-2xl glow-pulse" />

      {/* main video card */}
      <motion.div
        style={{ x: mid.x, y: mid.y }}
        initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: -4 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
        className="absolute left-2 top-8 w-64 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl glow-ring"
      >
        <div className="mb-3 grid aspect-video w-full place-items-center rounded-2xl bg-gradient-to-br from-sky-500 via-violet-600 to-fuchsia-600">
          <PlayCircle className="size-12 text-white/95 drop-shadow-lg" />
        </div>
        <div className="text-sm font-semibold text-white">{labels.previewCourse1Title}</div>
        <div className="text-xs text-white/55">{labels.previewCourse1Meta}</div>
      </motion.div>

      {/* rating card */}
      <motion.div
        style={{ x: near.x, y: near.y }}
        initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
        animate={{ opacity: 1, scale: 1, rotate: 4 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
        className="absolute bottom-10 right-0 w-60 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl glow-ring"
      >
        <div className="mb-3 grid aspect-video w-full place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
          <GraduationCap className="size-12 text-white/95 drop-shadow-lg" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">{labels.previewCourse2Title}</div>
          <span className="flex items-center gap-0.5 text-xs text-white">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            4.9
          </span>
        </div>
        <div className="text-xs text-white/55">{labels.previewCourse2Meta}</div>
      </motion.div>

      {/* floating 3D icons */}
      <motion.div style={{ x: near.x, y: near.y }} className="absolute right-6 top-0">
        <Icon3D icon={Rocket} tone="fuchsia" size="lg" float />
      </motion.div>
      <motion.div style={{ x: deep.x, y: deep.y }} className="absolute left-0 top-1/2">
        <Icon3D icon={Code2} tone="cyan" size="md" float />
      </motion.div>
      <motion.div style={{ x: mid.x, y: mid.y }} className="absolute bottom-2 left-16">
        <Icon3D icon={Brain} tone="violet" size="md" float />
      </motion.div>
      <motion.div style={{ x: near.x, y: near.y }} className="absolute right-16 top-1/2">
        <Icon3D icon={Award} tone="amber" size="sm" float />
      </motion.div>

      {/* XP pill */}
      <motion.div
        style={{ x: near.x, y: near.y }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
        className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-xl glow-ring"
      >
        <span className="grid size-8 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
          <CheckCircle2 className="size-4" />
        </span>
        <div className="text-xs">
          <div className="font-semibold text-white">{labels.previewLessonDone}</div>
          <div className="text-white/55">{labels.previewXp}</div>
        </div>
        <Sparkles className="size-4 text-amber-300" />
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

/** A sprinkle of deterministic twinkling stars (no Math.random for SSR safety). */
function Stars() {
  const stars = [
    [8, 18], [22, 62], [35, 12], [48, 38], [60, 72], [72, 22],
    [84, 54], [92, 16], [16, 84], [40, 88], [66, 8], [78, 80],
    [12, 44], [55, 26], [88, 36], [30, 70],
  ];
  return (
    <>
      {stars.map(([l, t], i) => (
        <span
          key={i}
          className="twinkle absolute size-[3px] rounded-full bg-white/80"
          style={{
            left: `${l}%`,
            top: `${t}%`,
            animationDelay: `${(i % 6) * 0.6}s`,
          }}
        />
      ))}
    </>
  );
}

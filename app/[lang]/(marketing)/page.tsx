import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Star,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCardSkeleton } from "@/features/course/components/CourseCardSkeleton";
import { CourseCard } from "@/features/course/components/CourseCard";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { FAQ } from "@/components/common/FAQ";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Hero } from "@/components/marketing/Hero";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { formatCompact, formatPrice, formatRating } from "@/lib/utils/format";
import type { CourseSummary } from "@/features/course/types";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string }> };

// Illustrative tutor highlights. The backend has no "featured tutors" endpoint,
// so these are static showcase entries rather than fabricated API results.
const SHOWCASE_TUTORS = [
  { name: "Aysel Mammadova", subject: "Frontend Engineering", rating: 4.9, students: "2.1K" },
  { name: "Rashad Karimov", subject: "Backend & Databases", rating: 4.8, students: "1.7K" },
  { name: "Leyla Huseynli", subject: "UX & Product Design", rating: 4.9, students: "1.4K" },
  { name: "Elvin Aliyev", subject: "Data Science", rating: 4.7, students: "980" },
] as const;

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <>
      <Hero
        coursesHref={localeHref(locale, "/courses")}
        registerHref={localeHref(locale, "/register")}
        labels={{
          university: t("home.university"),
          heroTitle: t("home.heroTitle"),
          heroSubtitle: t("home.heroSubtitle"),
          searchPlaceholder: t("common.search"),
          browseCourses: t("home.browseCourses"),
          createAccount: t("home.createAccount"),
          badgeFree: t("home.heroBadgeFree"),
          badgeModes: t("home.heroBadgeModes"),
          badgeVerified: t("home.heroBadgeVerified"),
          previewCourse1Title: t("home.previewCourse1Title"),
          previewCourse1Meta: t("home.previewCourse1Meta"),
          previewCourse2Title: t("home.previewCourse2Title"),
          previewCourse2Meta: t("home.previewCourse2Meta"),
          previewLessonDone: t("home.previewLessonDone"),
          previewXp: t("home.previewXp"),
          statLearners: t("home.statLearners"),
          statCourses: t("home.statCourses"),
          statTutors: t("home.statTutors"),
          statRating: t("home.statRating"),
        }}
      />

      {/* ── DISCIPLINES ── an index, not a grid of tiles ── */}
      <Suspense fallback={null}>
        <DisciplinesSection
          eyebrow={t("nav.categories")}
          title={t("home.categoriesTitle")}
          description={t("home.categoriesDesc")}
        />
      </Suspense>

      {/* ── FEATURED ── one spotlight course carrying a list of runners-up ── */}
      <Band>
        <Masthead
          eyebrow={t("home.featured")}
          title={t("home.featuredTitle")}
          description={t("home.featuredDesc")}
          action={
            <Link href={localeHref(locale, "/courses")}>
              <Button variant="outline" className="group gap-2">
                {t("common.viewAll")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          }
        />
        <div className="mt-14">
          <Suspense fallback={<SpotlightSkeleton />}>
            <FeaturedCourses
              locale={locale}
              emptyTitle={t("home.noCourses")}
              browseLabel={t("home.browseCourses")}
            />
          </Suspense>
        </div>
      </Band>

      {/* ── HOW IT WORKS ── a numbered path, connected by a rule ── */}
      <Band paper>
        <Masthead eyebrow={t("home.howItWorks")} title={t("home.howItWorksTitle")} />
        <Stagger className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden
            className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-gold-500/50 via-gold-500/25 to-transparent md:block"
          />
          <Step n="01" title={t("home.step1Title")} desc={t("home.step1Desc")} />
          <Step n="02" title={t("home.step2Title")} desc={t("home.step2Desc")} />
          <Step n="03" title={t("home.step3Title")} desc={t("home.step3Desc")} />
        </Stagger>
      </Band>

      {/* ── WHY US ── sticky masthead beside stacked editorial rows ── */}
      <Band>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Masthead
              eyebrow={t("home.whyUs")}
              title={t("home.whyUsTitle")}
              description={t("home.whyUsDesc")}
            />
          </div>
          <Stagger className="divide-y divide-border border-y border-border">
            <FeatureRow n="01" title={t("home.feature1Title")} desc={t("home.feature1Desc")} />
            <FeatureRow n="02" title={t("home.feature2Title")} desc={t("home.feature2Desc")} />
            <FeatureRow n="03" title={t("home.feature3Title")} desc={t("home.feature3Desc")} />
          </Stagger>
        </div>
      </Band>

      {/* ── TUTORS ── portrait cards with real presence ── */}
      <Band paper>
        <Masthead
          eyebrow={t("home.tutorsEyebrow")}
          title={t("home.tutorsTitle")}
          description={t("home.tutorsDesc")}
        />
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SHOWCASE_TUTORS.map((tutor) => (
            <TutorCard key={tutor.name} {...tutor} />
          ))}
        </Stagger>
      </Band>

      {/* ── TESTIMONIALS ── one voice given room, two supporting ── */}
      <Band>
        <Masthead eyebrow={t("home.testimonials")} title={t("home.testimonialsTitle")} />
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <LeadQuote
            text={t("home.testimonial1Text")}
            name={t("home.testimonial1Name")}
            role={t("home.testimonial1Role")}
          />
          <div className="grid gap-6 lg:col-span-5">
            <SmallQuote
              text={t("home.testimonial2Text")}
              name={t("home.testimonial2Name")}
              role={t("home.testimonial2Role")}
            />
            <SmallQuote
              text={t("home.testimonial3Text")}
              name={t("home.testimonial3Name")}
              role={t("home.testimonial3Role")}
            />
          </div>
        </div>
      </Band>

      {/* ── FAQ ── */}
      <Band paper>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Masthead
              eyebrow={t("home.faqEyebrow")}
              title={t("home.faqTitle")}
              description={t("home.faqDesc")}
            />
          </div>
          <FAQ
            items={[1, 2, 3, 4, 5].map((i) => ({
              q: t(`home.faq${i}Q`),
              a: t(`home.faq${i}A`),
            }))}
          />
        </div>
      </Band>

      {/* ── CLOSING ── full-bleed, no card ── */}
      <section className="surface-deep">
        <div className="container-fluid grid items-center gap-12 py-24 lg:grid-cols-12 lg:py-32">
          <Reveal className="lg:col-span-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300">
              {t("home.ctaBadge")}
            </div>
            <h2 className="font-display mt-6 max-w-[14ch] text-balance text-4xl leading-[1.06] text-white sm:text-5xl lg:text-[3.5rem]">
              {t("home.ctaTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5">
            <p className="max-w-md text-pretty leading-relaxed text-white/60">
              {t("home.ctaDesc")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={localeHref(locale, "/register")}>
                <Button size="lg" variant="gold">
                  {t("home.createAccount")}
                </Button>
              </Link>
              <Link href={localeHref(locale, "/courses")}>
                <Button size="lg" variant="onDeep">
                  {t("home.browseCourses")}
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */

/** One marketing band. `paper` alternates the surface so sections separate. */
function Band({
  children,
  paper,
}: {
  children: React.ReactNode;
  paper?: boolean;
}) {
  return (
    <section className={paper ? "surface-paper section-y" : "section-y"}>
      <div className="container-fluid">
        <Reveal>{children}</Reveal>
      </div>
    </section>
  );
}

/**
 * The section masthead. Deliberately narrow measure, gold eyebrow, serif title.
 * Optional action sits on the baseline of the title on wide screens.
 */
function Masthead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
      <div className="max-w-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">
          {eyebrow}
        </div>
        <h2 className="font-display mt-5 text-balance text-3xl leading-[1.12] sm:text-4xl lg:text-[2.6rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section pieces                                                     */
/* ------------------------------------------------------------------ */

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <StaggerItem className="relative">
      <span className="relative grid size-11 place-items-center rounded-full border border-gold-500/40 bg-background font-display text-sm text-gold-700 dark:text-gold-300">
        {n}
      </span>
      <h3 className="font-display mt-7 text-xl leading-snug">{title}</h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </StaggerItem>
  );
}

function FeatureRow({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <StaggerItem className="group grid gap-4 py-9 sm:grid-cols-[4rem_1fr] sm:gap-8">
      <span className="font-display text-2xl leading-none text-border transition-colors group-hover:text-gold-500">
        {n}
      </span>
      <div>
        <h3 className="font-display text-2xl leading-snug">{title}</h3>
        <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </StaggerItem>
  );
}

function TutorCard({
  name,
  subject,
  rating,
  students,
}: {
  name: string;
  subject: string;
  rating: number;
  students: string;
}) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <StaggerItem className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-3">
      <span
        aria-hidden
        className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-900 font-display text-lg text-white ring-1 ring-inset ring-white/15"
      >
        {initials}
      </span>
      <h3 className="font-display mt-6 text-lg leading-snug">{name}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{subject}</p>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Star className="size-3.5 fill-gold-500 text-gold-500" />
          <span className="font-medium text-foreground">{rating}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" />
          {students}
        </span>
      </div>
    </StaggerItem>
  );
}

function LeadQuote({
  text,
  name,
  role,
}: {
  text: string;
  name: string;
  role: string;
}) {
  return (
    <figure className="flex flex-col justify-between rounded-2xl border border-border bg-card p-9 lg:col-span-7 lg:p-12">
      <blockquote className="font-display text-balance text-2xl leading-[1.4] sm:text-3xl">
        &ldquo;{text}&rdquo;
      </blockquote>
      <figcaption className="mt-10 flex items-center gap-4">
        <Avatar name={name} className="size-11" />
        <div className="min-w-0 text-sm">
          <div className="truncate font-medium">{name}</div>
          <div className="truncate text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

function SmallQuote({
  text,
  name,
  role,
}: {
  text: string;
  name: string;
  role: string;
}) {
  return (
    <figure className="flex flex-1 flex-col justify-between rounded-2xl border border-border bg-card p-7">
      <blockquote className="text-pretty leading-relaxed">{text}</blockquote>
      <figcaption className="mt-7 flex items-center gap-3">
        <Avatar name={name} className="size-9 text-[11px]" />
        <div className="min-w-0 text-xs">
          <div className="truncate font-medium">{name}</div>
          <div className="truncate text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-900 text-xs font-semibold text-white ${className}`}
    >
      {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Data-backed sections                                               */
/* ------------------------------------------------------------------ */

async function DisciplinesSection({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const cats = await categoryServerApi.list().catch(() => []);
  const top = cats.filter((c) => !c.parentId && c.active).slice(0, 8);
  if (!top.length) return null;

  return (
    <Band paper>
      <Masthead eyebrow={eyebrow} title={title} description={description} />
      {/* An index of disciplines rather than a wall of tiles: hairline rows in
          two columns, numbered, with the name doing the work. */}
      <ul className="mt-14 grid gap-x-16 border-t border-border sm:grid-cols-2">
        {top.map((c, i) => (
          <li key={c.id} className="border-b border-border">
            <LocaleLink
              href={`/courses?categoryId=${c.id}`}
              className="group flex items-baseline gap-5 py-6 transition-colors"
            >
              <span className="font-display text-sm tabular-nums text-muted-foreground transition-colors group-hover:text-gold-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display flex-1 text-xl leading-snug transition-colors group-hover:text-primary sm:text-2xl">
                {c.name}
              </span>
              <ArrowUpRight className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </LocaleLink>
          </li>
        ))}
      </ul>
    </Band>
  );
}

async function FeaturedCourses({
  locale,
  emptyTitle,
  browseLabel,
}: {
  locale: Locale;
  emptyTitle: string;
  browseLabel: string;
}) {
  const data = await courseServerApi.list({ size: 7 }).catch(() => null);
  const courses = data?.content ?? [];

  if (!courses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-24 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-900 text-white">
          <BookOpen className="size-6" strokeWidth={1.5} />
        </span>
        <p className="font-display mt-7 text-xl">{emptyTitle}</p>
        <Link href={localeHref(locale, "/courses")} className="mt-7 inline-block">
          <Button variant="outline" className="group gap-2">
            {browseLabel}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    );
  }

  const [lead, ...rest] = courses;
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <SpotlightCourse course={lead} />
      </div>
      <ul className="grid gap-3 lg:col-span-5">
        {rest.slice(0, 4).map((c) => (
          <li key={c.id}>
            <CourseRow course={c} />
          </li>
        ))}
      </ul>
      {/* Anything past the spotlight + list falls back to the standard card. */}
      {rest.length > 4 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
          {rest.slice(4).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The lead course, given the space to actually sell itself. */
function SpotlightCourse({ course }: { course: CourseSummary }) {
  return (
    <LocaleLink
      href={`/courses/${course.slug}`}
      prefetch
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-4"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-navy-400 via-navy-700 to-navy-950">
        <span
          aria-hidden
          className="absolute -right-10 -top-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(200,169,81,0.5)_0%,transparent_65%)] blur-2xl"
        />
        <span
          aria-hidden
          className="font-display absolute inset-0 grid place-items-center text-7xl text-white/20 transition-transform duration-500 group-hover:scale-105"
        >
          {initialsOf(course.title)}
        </span>
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
            {course.courseType === "ONLINE" ? "Online" : "Offline"}
          </span>
          {course.free ? (
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-950">
              Free
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-8">
        <h3 className="font-display text-2xl leading-snug transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        {course.subtitle ? (
          <p className="mt-3 line-clamp-2 leading-relaxed text-muted-foreground">
            {course.subtitle}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-6 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">
            {course.tutorDisplayName}
          </span>
          <span className="flex shrink-0 items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Star className="size-4 fill-gold-500 text-gold-500" />
              <span className="font-medium">{formatRating(course.ratingAvg)}</span>
            </span>
            <span className="font-display text-lg">
              {course.free ? "Free" : formatPrice(course.price, course.currency)}
            </span>
          </span>
        </div>
      </div>
    </LocaleLink>
  );
}

/** A compact course row for the spotlight's companion list. */
function CourseRow({ course }: { course: CourseSummary }) {
  return (
    <LocaleLink
      href={`/courses/${course.slug}`}
      prefetch
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:elev-2"
    >
      <span
        aria-hidden
        className="font-display grid size-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-500 to-navy-900 text-lg text-white/85"
      >
        {initialsOf(course.title)}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium leading-snug transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        <div className="mt-2 flex items-center gap-3.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3 fill-gold-500 text-gold-500" />
            {formatRating(course.ratingAvg)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {formatCompact(course.enrolledCount)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {course.courseType === "ONLINE" ? "Online" : "Offline"}
          </span>
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium">
        {course.free ? "Free" : formatPrice(course.price, course.currency)}
      </span>
    </LocaleLink>
  );
}

function initialsOf(title: string) {
  return title
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SpotlightSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <CourseCardSkeleton />
      </div>
      <div className="grid gap-3 lg:col-span-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-border bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

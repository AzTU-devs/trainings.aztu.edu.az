import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Compass,
  CreditCard,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseGrid } from "@/features/course/components/CourseGrid";
import { CourseCardSkeleton } from "@/features/course/components/CourseCardSkeleton";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { CategoryGrid } from "@/features/category/components/CategoryGrid";
import { FAQ } from "@/components/common/FAQ";
import { SectionHeading } from "@/components/common/SectionHeading";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string }> };

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-pattern mask-radial-fade" aria-hidden />
        <div
          className="absolute -top-32 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-violet-500/20 to-transparent blur-3xl"
          aria-hidden
        />

        <div className="container-fluid relative grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
          <div className="space-y-7 lg:col-span-7">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              <Image
                src="/aztu-logo-mark.png"
                alt=""
                width={16}
                height={16}
                className="size-4 object-contain"
              />
              <span className="ml-1.5">Azerbaijan Technical University</span>
            </Badge>
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {t("home.heroTitle")}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t("home.heroSubtitle")}
            </p>
            <form
              action={localeHref(locale, "/courses")}
              className="flex max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1 pl-4 shadow-sm"
            >
              <Search className="size-4 text-muted-foreground" />
              <input
                name="q"
                type="search"
                placeholder={t("common.search")}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" className="rounded-full" size="sm">
                {t("home.browseCourses")}
              </Button>
            </form>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Free starter courses
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Online & offline
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-500" />
                Verified tutors
              </span>
            </div>
          </div>

          <div className="relative hidden lg:col-span-5 lg:block">
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/15 via-violet-500/15 to-fuchsia-500/15" />
              <div className="absolute left-6 top-10 w-56 rotate-[-6deg] rounded-2xl border border-border bg-card p-4 shadow-xl">
                <div className="mb-3 aspect-video w-full rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 grid place-items-center">
                  <PlayCircle className="size-10 text-white/90" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Intro to React 19</div>
                  <div className="text-xs text-muted-foreground">12 lessons · 4h</div>
                </div>
              </div>
              <div className="absolute bottom-8 right-4 w-60 rotate-[4deg] rounded-2xl border border-border bg-card p-4 shadow-xl">
                <div className="mb-3 aspect-video w-full rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 grid place-items-center">
                  <GraduationCap className="size-10 text-white/90" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">UX Design</div>
                  <span className="flex items-center gap-0.5 text-xs">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    4.9
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Offline · Baku</div>
              </div>
              <div className="absolute right-12 top-4 grid h-16 w-16 place-items-center rounded-2xl border border-border bg-card shadow-xl">
                <Award className="size-7 text-amber-500" />
              </div>
              <div className="absolute bottom-6 left-2 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
                <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-4" />
                </span>
                <div className="text-xs">
                  <div className="font-semibold">Lesson completed</div>
                  <div className="text-muted-foreground">+25 XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="border-t border-border/60 bg-muted/20">
          <div className="container-fluid grid grid-cols-2 gap-y-6 py-8 sm:grid-cols-4">
            <Stat value="12K+" label="Learners" />
            <Stat value="320+" label="Courses" />
            <Stat value="80+" label="Expert tutors" />
            <Stat value="4.8" label="Avg. rating" />
          </div>
        </div>
      </section>

      {/* CATEGORIES GRID */}
      <Suspense fallback={null}>
        <CategoriesSection locale={locale} title={t("nav.categories")} />
      </Suspense>

      {/* FEATURED COURSES */}
      <section className="container-fluid space-y-8 py-16">
        <SectionHeading
          eyebrow={t("home.featured")}
          title="Hand-picked for you"
          description="A curated mix of free starters and deep-dives across the most popular topics."
          action={
            <Link href={localeHref(locale, "/courses")}>
              <Button variant="outline">
                {t("common.viewAll")} <ArrowRight className="size-4" />
              </Button>
            </Link>
          }
        />
        <Suspense fallback={<FeaturedSkeleton />}>
          <FeaturedCourses emptyMsg={t("home.noCourses")} />
        </Suspense>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="container-fluid space-y-10">
          <SectionHeading
            eyebrow="How it works"
            title="From sign-up to certificate in three steps"
            align="center"
          />
          <ol className="grid gap-4 md:grid-cols-3">
            <Step
              n={1}
              icon={<Compass className="size-5" />}
              title="Pick a course"
              desc="Browse the catalog by category, mode (online or offline), price and rating."
            />
            <Step
              n={2}
              icon={<CreditCard className="size-5" />}
              title="Enroll"
              desc="Free courses start instantly. Paid and offline cohorts go through a quick checkout."
            />
            <Step
              n={3}
              icon={<Rocket className="size-5" />}
              title="Learn & earn"
              desc="Progress is saved automatically. Finish the course to unlock your certificate."
            />
          </ol>
        </div>
      </section>

      {/* WHY US */}
      <section className="container-fluid space-y-8 py-16">
        <SectionHeading
          eyebrow="Why us"
          title="Built for the way you actually learn"
          description="Bite-sized lessons, real practice, and a path that adapts to your level — online or in the classroom."
          align="center"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<PlayCircle className="size-5" />}
            title="Learn at your pace"
            desc="Stream lessons online with progress that auto-saves and syncs across devices."
          />
          <Feature
            icon={<Users className="size-5" />}
            title="Offline cohorts"
            desc="Join in-person classes with limited seats, real schedules, and dedicated rooms."
          />
          <Feature
            icon={<Award className="size-5" />}
            title="Earn certificates"
            desc="Complete a course and receive a verifiable certificate of completion."
          />
        </div>
      </section>

      {/* POPULAR TUTORS */}
      <section className="border-y border-border/60 bg-muted/20 py-16">
        <div className="container-fluid space-y-8">
          <SectionHeading
            eyebrow="Tutors"
            title="Learn from people who do the work"
            description="Specialists from the Azerbaijan Technical University faculty and industry."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Aysel Mammadova", subject: "Frontend Engineering", rating: 4.9, students: "2.1K" },
              { name: "Rashad Karimov", subject: "Backend & Databases", rating: 4.8, students: "1.7K" },
              { name: "Leyla Huseynli", subject: "UX & Product Design", rating: 4.9, students: "1.4K" },
              { name: "Elvin Aliyev", subject: "Data Science", rating: 4.7, students: "980" },
            ].map((t) => (
              <TutorCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-fluid space-y-8 py-16">
        <SectionHeading
          eyebrow="Loved by learners"
          title="People learning every day"
          align="center"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Quote
            text="The mix of online videos and weekend offline classes was perfect for my schedule."
            name="Aysel M."
            role="UX Designer"
          />
          <Quote
            text="Tutors actually reply to questions. That changes everything when you're stuck."
            name="Rashad K."
            role="Backend developer"
          />
          <Quote
            text="I finished my first course in two weeks. The progress tracker kept me honest."
            name="Leyla H."
            role="Marketing analyst"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/60 bg-muted/20 py-16">
        <div className="container-fluid grid gap-8 lg:grid-cols-[1fr_2fr]">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered"
            description="Can't find the answer you need? Reach out to the AZTU team and we'll get back to you."
          />
          <FAQ
            items={[
              {
                q: "How are AZTU EduPlatform courses different from regular videos?",
                a: "Every course has structured modules and lessons, tracks your progress automatically, supports notes, and gives you a verifiable certificate when complete. Offline courses also include schedules and assigned rooms.",
              },
              {
                q: "Do I need to pay to start?",
                a: "Many starter courses are free. Paid courses go through a quick checkout. Offline cohorts may require approval from the tutor before your seat is confirmed.",
              },
              {
                q: "Can I switch between online and offline?",
                a: "Each course is set up either as online or offline by the tutor. You can enroll in any number of either kind at the same time.",
              },
              {
                q: "Will my progress be saved if I switch devices?",
                a: "Yes — progress is saved on the server. Sign in on another device and pick up exactly where you left off.",
              },
              {
                q: "Is the platform available in Azerbaijani?",
                a: "Yes. Switch between English and Azərbaycan from the language selector in the top-right corner.",
              },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="container-fluid relative overflow-hidden py-16">
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-violet-500/10 to-transparent"
            aria-hidden
          />
          <div className="mx-auto max-w-2xl space-y-5 text-center">
            <Badge variant="outline" className="rounded-full">
              <Sparkles className="size-3 text-primary" />
              <span className="ml-1.5">Ready when you are</span>
            </Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Start learning at AZTU EduPlatform today
            </h2>
            <p className="text-muted-foreground">
              Create a free account and enroll in your first course in minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={localeHref(locale, "/register")}>
                <Button size="lg">{t("home.createAccount")}</Button>
              </Link>
              <Link href={localeHref(locale, "/courses")}>
                <Button size="lg" variant="outline">
                  {t("home.browseCourses")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
      <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  desc,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="relative space-y-3 rounded-2xl border border-border bg-card p-6">
      <span className="absolute -top-3 left-6 grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </li>
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
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-sm font-semibold text-white"
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{subject}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{rating}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3" />
          {students}
        </span>
      </div>
    </div>
  );
}

function Quote({
  text,
  name,
  role,
}: {
  text: string;
  name: string;
  role: string;
}) {
  return (
    <figure className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed">&ldquo;{text}&rdquo;</blockquote>
      <figcaption className="flex items-center gap-3 pt-1">
        <span
          aria-hidden
          className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-semibold text-white"
        >
          {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </span>
        <div className="text-xs">
          <div className="font-semibold">{name}</div>
          <div className="text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </figure>
  );
}

async function CategoriesSection({
  locale,
  title,
}: {
  locale: Locale;
  title: string;
}) {
  const cats = await categoryServerApi.list().catch(() => []);
  const top = cats.filter((c) => !c.parentId && c.active).slice(0, 8);
  if (!top.length) return null;
  return (
    <section className="border-y border-border/60 bg-muted/10 py-16">
      <div className="container-fluid space-y-8">
        <SectionHeading
          eyebrow={title}
          title="Pick a topic, start exploring"
          description="A few of our most popular fields. Each one branches into hundreds of courses."
        />
        <CategoryGrid
          categories={top}
          hrefFor={(slug) => localeHref(locale, `/courses?category=${slug}`)}
        />
      </div>
    </section>
  );
}

async function FeaturedCourses({ emptyMsg }: { emptyMsg: string }) {
  const data = await courseServerApi.list({ size: 8 }).catch(() => null);
  if (!data || !data.content.length) {
    return <p className="text-sm text-muted-foreground">{emptyMsg}</p>;
  }
  return <CourseGrid courses={data.content} />;
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

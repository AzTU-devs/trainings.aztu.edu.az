import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Award,
  PlayCircle,
  Users,
  Compass,
  CreditCard,
  Rocket,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseGrid } from "@/features/course/components/CourseGrid";
import { CourseCardSkeleton } from "@/features/course/components/CourseCardSkeleton";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { CategoryGrid } from "@/features/category/components/CategoryGrid";
import { FAQ } from "@/components/common/FAQ";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Icon3D, type Icon3DTone } from "@/components/common/Icon3D";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Hero } from "@/components/marketing/Hero";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string }> };

// Illustrative tutor highlights for the marketing landing page. The backend has
// no "featured tutors" endpoint, so these are static showcase entries (clearly
// not live data) rather than fabricated API results.
const SHOWCASE_TUTORS = [
  { name: "Aysel Mammadova", subject: "Frontend Engineering", rating: 4.9, students: "2.1K", tone: "violet" },
  { name: "Rashad Karimov", subject: "Backend & Databases", rating: 4.8, students: "1.7K", tone: "cyan" },
  { name: "Leyla Huseynli", subject: "UX & Product Design", rating: 4.9, students: "1.4K", tone: "fuchsia" },
  { name: "Elvin Aliyev", subject: "Data Science", rating: 4.7, students: "980", tone: "emerald" },
] as const;

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  return (
    <div className="flex flex-col">
      {/* HERO — futuristic animated first view */}
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

      {/* CATEGORIES GRID */}
      <Suspense fallback={null}>
        <CategoriesSection
          locale={locale}
          eyebrow={t("nav.categories")}
          title={t("home.categoriesTitle")}
          description={t("home.categoriesDesc")}
          exploreLabel={t("home.exploreCategory")}
        />
      </Suspense>

      {/* FEATURED COURSES */}
      <section className="relative overflow-hidden py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 -z-10 size-[34rem] rounded-full bg-violet-500/10 blur-3xl"
        />
        <div className="container-fluid space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow={t("home.featured")}
              title={t("home.featuredTitle")}
              description={t("home.featuredDesc")}
              action={
                <Link href={localeHref(locale, "/courses")}>
                  <Button variant="outline" className="group gap-2">
                    {t("common.viewAll")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              }
            />
          </Reveal>
          <Reveal delay={0.1}>
            <Suspense fallback={<FeaturedSkeleton />}>
              <FeaturedCourses emptyMsg={t("home.noCourses")} />
            </Suspense>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-muted/30 via-background to-muted/30 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 -z-10 size-[30rem] rounded-full bg-cyan-500/10 blur-3xl"
        />
        <div className="container-fluid space-y-12">
          <Reveal>
            <SectionHeading
              eyebrow={t("home.howItWorks")}
              title={t("home.howItWorksTitle")}
              align="center"
            />
          </Reveal>
          <Stagger className="grid gap-5 md:grid-cols-3">
            <Step n={1} icon={Compass} tone="blue" title={t("home.step1Title")} desc={t("home.step1Desc")} />
            <Step n={2} icon={CreditCard} tone="fuchsia" title={t("home.step2Title")} desc={t("home.step2Desc")} />
            <Step n={3} icon={Rocket} tone="violet" title={t("home.step3Title")} desc={t("home.step3Desc")} />
          </Stagger>
        </div>
      </section>

      {/* WHY US */}
      <section className="relative overflow-hidden py-20">
        <div className="container-fluid space-y-12">
          <Reveal>
            <SectionHeading
              eyebrow={t("home.whyUs")}
              title={t("home.whyUsTitle")}
              description={t("home.whyUsDesc")}
              align="center"
            />
          </Reveal>
          <Stagger className="grid gap-5 md:grid-cols-3">
            <Feature icon={PlayCircle} tone="cyan" title={t("home.feature1Title")} desc={t("home.feature1Desc")} />
            <Feature icon={Users} tone="violet" title={t("home.feature2Title")} desc={t("home.feature2Desc")} />
            <Feature icon={Award} tone="amber" title={t("home.feature3Title")} desc={t("home.feature3Desc")} />
          </Stagger>
        </div>
      </section>

      {/* POPULAR TUTORS */}
      <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-muted/30 to-background py-20">
        <div className="container-fluid space-y-10">
          <Reveal>
            <SectionHeading
              eyebrow={t("home.tutorsEyebrow")}
              title={t("home.tutorsTitle")}
              description={t("home.tutorsDesc")}
            />
          </Reveal>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE_TUTORS.map((tutor) => (
              <TutorCard key={tutor.name} {...tutor} />
            ))}
          </Stagger>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-fluid space-y-10 py-20">
        <Reveal>
          <SectionHeading
            eyebrow={t("home.testimonials")}
            title={t("home.testimonialsTitle")}
            align="center"
          />
        </Reveal>
        <Stagger className="grid gap-5 md:grid-cols-3">
          <Quote text={t("home.testimonial1Text")} name={t("home.testimonial1Name")} role={t("home.testimonial1Role")} tone="violet" />
          <Quote text={t("home.testimonial2Text")} name={t("home.testimonial2Name")} role={t("home.testimonial2Role")} tone="cyan" />
          <Quote text={t("home.testimonial3Text")} name={t("home.testimonial3Name")} role={t("home.testimonial3Role")} tone="fuchsia" />
        </Stagger>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="container-fluid grid gap-10 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <SectionHeading
              eyebrow={t("home.faqEyebrow")}
              title={t("home.faqTitle")}
              description={t("home.faqDesc")}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <FAQ
              items={[1, 2, 3, 4, 5].map((i) => ({
                q: t(`home.faq${i}Q`),
                a: t(`home.faq${i}A`),
              }))}
            />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="container-fluid py-20">
        <Reveal from="none">
          <div className="hero-cosmic relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-16 text-center sm:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="aurora-blob left-[10%] top-[-30%] size-[28rem] bg-[radial-gradient(circle,oklch(0.62_0.26_295)_0%,transparent_60%)]" />
              <div
                className="aurora-blob right-[8%] bottom-[-30%] size-[26rem] bg-[radial-gradient(circle,oklch(0.66_0.27_345)_0%,transparent_60%)]"
                style={{ animationDelay: "-7s" }}
              />
              <div className="absolute inset-0 grid-pattern-glow mask-radial-fade" />
            </div>
            <div className="mx-auto max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                <Sparkles className="size-3.5 text-amber-300" />
                {t("home.ctaBadge")}
              </span>
              <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
                <span className="text-aurora">{t("home.ctaTitle")}</span>
              </h2>
              <p className="text-white/70">{t("home.ctaDesc")}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href={localeHref(locale, "/register")}>
                  <Button
                    size="lg"
                    className="shimmer-sweep bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 hover:from-violet-400 hover:to-fuchsia-400"
                  >
                    {t("home.createAccount")}
                  </Button>
                </Link>
                <Link href={localeHref(locale, "/courses")}>
                  <Button size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                    {t("home.browseCourses")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Feature({
  icon,
  tone,
  title,
  desc,
}: {
  icon: LucideIcon;
  tone: Icon3DTone;
  title: string;
  desc: string;
}) {
  return (
    <StaggerItem className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />
      <Icon3D icon={icon} tone={tone} size="md" />
      <div className="mt-5 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </StaggerItem>
  );
}

function Step({
  n,
  icon,
  tone,
  title,
  desc,
}: {
  n: number;
  icon: LucideIcon;
  tone: Icon3DTone;
  title: string;
  desc: string;
}) {
  return (
    <StaggerItem className="group relative h-full rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <span className="absolute right-6 top-6 bg-gradient-to-br from-primary to-violet-500 bg-clip-text text-5xl font-black leading-none text-transparent opacity-20">
        {n}
      </span>
      <Icon3D icon={icon} tone={tone} size="md" />
      <div className="mt-5 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </StaggerItem>
  );
}

function TutorCard({
  name,
  subject,
  rating,
  students,
  tone,
}: {
  name: string;
  subject: string;
  rating: number;
  students: string;
  tone: Icon3DTone;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const ring: Record<Icon3DTone, string> = {
    violet: "from-violet-500 to-indigo-600",
    blue: "from-sky-500 to-indigo-600",
    cyan: "from-cyan-400 to-sky-600",
    fuchsia: "from-fuchsia-500 to-rose-600",
    emerald: "from-emerald-400 to-teal-600",
    amber: "from-amber-400 to-rose-500",
    rose: "from-rose-400 to-fuchsia-600",
  };
  return (
    <StaggerItem className="group rounded-3xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${ring[tone]} text-sm font-semibold text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{subject}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{rating}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3" />
          {students}
        </span>
      </div>
    </StaggerItem>
  );
}

function Quote({
  text,
  name,
  role,
  tone,
}: {
  text: string;
  name: string;
  role: string;
  tone: Icon3DTone;
}) {
  const ring: Record<Icon3DTone, string> = {
    violet: "from-violet-500 to-indigo-600",
    blue: "from-sky-500 to-indigo-600",
    cyan: "from-cyan-400 to-sky-600",
    fuchsia: "from-fuchsia-500 to-rose-600",
    emerald: "from-emerald-400 to-teal-600",
    amber: "from-amber-400 to-rose-500",
    rose: "from-rose-400 to-fuchsia-600",
  };
  return (
    <StaggerItem className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote className="flex-1 text-sm leading-relaxed">&ldquo;{text}&rdquo;</blockquote>
      <figcaption className="flex items-center gap-3 pt-1">
        <span
          aria-hidden
          className={`grid size-9 place-items-center rounded-full bg-gradient-to-br ${ring[tone]} text-xs font-semibold text-white`}
        >
          {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </span>
        <div className="text-xs">
          <div className="font-semibold">{name}</div>
          <div className="text-muted-foreground">{role}</div>
        </div>
      </figcaption>
    </StaggerItem>
  );
}

async function CategoriesSection({
  locale,
  eyebrow,
  title,
  description,
  exploreLabel,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  exploreLabel: string;
}) {
  const cats = await categoryServerApi.list().catch(() => []);
  const top = cats.filter((c) => !c.parentId && c.active).slice(0, 8);
  if (!top.length) return null;
  return (
    <section className="relative overflow-hidden border-b border-border/60 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-0 -z-10 size-[30rem] rounded-full bg-fuchsia-500/10 blur-3xl"
      />
      <div className="container-fluid space-y-10">
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        </Reveal>
        <Reveal delay={0.1}>
          <CategoryGrid
            categories={top}
            exploreLabel={exploreLabel}
            hrefFor={(c) => localeHref(locale, `/courses?categoryId=${c.id}`)}
          />
        </Reveal>
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

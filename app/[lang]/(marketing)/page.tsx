import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  PlayCircle,
  Users,
  Compass,
  CreditCard,
  Rocket,
  Star,
  Quote as QuoteIcon,
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

      {/* FEATURED COURSES — the catalogue is the product, so it leads. */}
      <Section>
        <SectionHeading
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
        <div className="mt-12">
          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedCourses
              emptyTitle={t("home.noCourses")}
              browseLabel={t("home.browseCourses")}
              browseHref={localeHref(locale, "/courses")}
            />
          </Suspense>
        </div>
      </Section>

      {/* CATEGORIES */}
      <Suspense fallback={null}>
        <CategoriesSection
          locale={locale}
          eyebrow={t("nav.categories")}
          title={t("home.categoriesTitle")}
          description={t("home.categoriesDesc")}
          exploreLabel={t("home.exploreCategory")}
        />
      </Suspense>

      {/* HOW IT WORKS */}
      <Section>
        <SectionHeading
          eyebrow={t("home.howItWorks")}
          title={t("home.howItWorksTitle")}
        />
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          <Step n="01" icon={Compass} tone="navy" title={t("home.step1Title")} desc={t("home.step1Desc")} />
          <Step n="02" icon={CreditCard} tone="gold" title={t("home.step2Title")} desc={t("home.step2Desc")} />
          <Step n="03" icon={Rocket} tone="navy" title={t("home.step3Title")} desc={t("home.step3Desc")} />
        </Stagger>
      </Section>

      {/* WHY US */}
      <Section tinted>
        <SectionHeading
          eyebrow={t("home.whyUs")}
          title={t("home.whyUsTitle")}
          description={t("home.whyUsDesc")}
        />
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          <Feature icon={PlayCircle} tone="navy" title={t("home.feature1Title")} desc={t("home.feature1Desc")} />
          <Feature icon={Users} tone="navy" title={t("home.feature2Title")} desc={t("home.feature2Desc")} />
          <Feature icon={Award} tone="gold" title={t("home.feature3Title")} desc={t("home.feature3Desc")} />
        </Stagger>
      </Section>

      {/* TUTORS */}
      <Section>
        <SectionHeading
          eyebrow={t("home.tutorsEyebrow")}
          title={t("home.tutorsTitle")}
          description={t("home.tutorsDesc")}
        />
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SHOWCASE_TUTORS.map((tutor) => (
            <TutorCard key={tutor.name} {...tutor} />
          ))}
        </Stagger>
      </Section>

      {/* TESTIMONIALS */}
      <Section tinted>
        <SectionHeading
          eyebrow={t("home.testimonials")}
          title={t("home.testimonialsTitle")}
        />
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          <Quote text={t("home.testimonial1Text")} name={t("home.testimonial1Name")} role={t("home.testimonial1Role")} />
          <Quote text={t("home.testimonial2Text")} name={t("home.testimonial2Name")} role={t("home.testimonial2Role")} />
          <Quote text={t("home.testimonial3Text")} name={t("home.testimonial3Name")} role={t("home.testimonial3Role")} />
        </Stagger>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <SectionHeading
            eyebrow={t("home.faqEyebrow")}
            title={t("home.faqTitle")}
            description={t("home.faqDesc")}
          />
          <FAQ
            items={[1, 2, 3, 4, 5].map((i) => ({
              q: t(`home.faq${i}Q`),
              a: t(`home.faq${i}A`),
            }))}
          />
        </div>
      </Section>

      {/* CLOSING CTA */}
      <section className="container-fluid pb-24 pt-4">
        <Reveal from="none">
          <div className="surface-deep relative overflow-hidden rounded-[1.75rem] px-6 py-20 text-center sm:px-12 sm:py-24">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="aurora left-[8%] top-[-40%] size-[30rem] bg-[radial-gradient(circle,#1a5ba5_0%,transparent_62%)]" />
              <div
                className="aurora bottom-[-45%] right-[6%] size-[26rem] bg-[radial-gradient(circle,#c8a951_0%,transparent_62%)] opacity-20"
                style={{ animationDelay: "-11s" }}
              />
              <div className="absolute inset-0 grid-lines fade-edges" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <div className="mb-6 flex items-center justify-center gap-3">
                <span aria-hidden className="h-px w-8 bg-gradient-to-r from-gold-400/0 to-gold-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-300">
                  {t("home.ctaBadge")}
                </span>
                <span aria-hidden className="h-px w-8 bg-gradient-to-l from-gold-400/0 to-gold-400" />
              </div>
              <h2 className="font-display text-balance text-4xl leading-[1.1] text-white sm:text-5xl">
                {t("home.ctaTitle")}
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-pretty leading-relaxed text-white/65">
                {t("home.ctaDesc")}
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/**
 * Every marketing section shares this wrapper, so vertical rhythm, container
 * width and the alternating surface treatment stay consistent down the page.
 */
function Section({
  children,
  tinted,
}: {
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <section
      className={
        tinted
          ? "surface-tint section-y border-y border-border"
          : "section-y"
      }
    >
      <div className="container-fluid">
        <Reveal>{children}</Reveal>
      </div>
    </section>
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
    <StaggerItem className="group h-full rounded-2xl border border-border bg-card p-8 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-3">
      <Icon3D icon={icon} tone={tone} size="md" />
      <h3 className="mt-6 font-display text-xl leading-snug">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
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
  n: string;
  icon: LucideIcon;
  tone: Icon3DTone;
  title: string;
  desc: string;
}) {
  return (
    <StaggerItem className="group relative h-full rounded-2xl border border-border bg-card p-8 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-3">
      <div className="flex items-start justify-between">
        <Icon3D icon={icon} tone={tone} size="md" />
        <span className="font-display text-3xl leading-none text-border transition-colors group-hover:text-gold-500/50">
          {n}
        </span>
      </div>
      <h3 className="mt-6 font-display text-xl leading-snug">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
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
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <StaggerItem className="group h-full rounded-2xl border border-border bg-card p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-3">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-800 text-sm font-semibold text-white ring-1 ring-inset ring-white/15"
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium leading-tight">{name}</div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{subject}</div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
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
    <StaggerItem className="flex h-full flex-col rounded-2xl border border-border bg-card p-8">
      <QuoteIcon
        aria-hidden
        className="size-7 shrink-0 fill-gold-500/20 text-gold-500/40"
      />
      <blockquote className="mt-5 flex-1 text-pretty leading-relaxed">
        {text}
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-3 border-t border-border pt-5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-800 text-[11px] font-semibold text-white"
        >
          {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </span>
        <div className="min-w-0 text-xs">
          <div className="truncate font-medium text-foreground">{name}</div>
          <div className="truncate text-muted-foreground">{role}</div>
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
    <Section tinted>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-12">
        <CategoryGrid
          categories={top}
          exploreLabel={exploreLabel}
          hrefFor={(c) => localeHref(locale, `/courses?categoryId=${c.id}`)}
        />
      </div>
    </Section>
  );
}

async function FeaturedCourses({
  emptyTitle,
  browseLabel,
  browseHref,
}: {
  emptyTitle: string;
  browseLabel: string;
  browseHref: string;
}) {
  const data = await courseServerApi.list({ size: 8 }).catch(() => null);
  if (!data || !data.content.length) {
    // The catalogue can legitimately be empty, and the API can be down. Either
    // way this is a first impression, so it gets a designed state rather than a
    // bare sentence.
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-20 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-navy-500 to-navy-800 text-white">
          <BookOpen className="size-6" strokeWidth={1.5} />
        </span>
        <p className="mt-6 font-display text-xl">{emptyTitle}</p>
        <Link href={browseHref} className="mt-6 inline-block">
          <Button variant="outline" className="group gap-2">
            {browseLabel}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    );
  }
  return <CourseGrid courses={data.content} />;
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

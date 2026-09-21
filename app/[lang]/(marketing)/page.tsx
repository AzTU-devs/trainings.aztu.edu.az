import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Atom,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Calculator,
  Camera,
  Clock,
  Code2,
  Cog,
  Compass,
  GraduationCap,
  HeartPulse,
  Languages,
  LayoutGrid,
  Mail,
  Megaphone,
  MonitorPlay,
  Music,
  Palette,
  PlayCircle,
  Search,
  Star,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CourseCardSkeleton } from "@/features/course/components/CourseCardSkeleton";
import { CourseCard } from "@/features/course/components/CourseCard";
import { courseServerApi } from "@/features/course/api.server";
import { mediaSrc } from "@/features/course/media";
import { categoryServerApi } from "@/features/category/api.server";
import { FAQ } from "@/components/common/FAQ";
import { Eyebrow, SectionHeading } from "@/components/common/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import {
  Hero,
  HeroCourseCard,
  HeroCourseSkeleton,
  HeroDecor,
} from "@/components/marketing/Hero";
import { AztuMark } from "@/components/layout/AztuMark";
import { listExperts } from "@/features/expert/directory.server";
import { ExpertCard } from "@/features/expert/components/ExpertCard";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/features/category/types";
import type { CourseLevel } from "@/features/course/types";

// One minute, not five. The landing page shows the category tiles and featured
// courses, and five minutes of staleness made adding either look broken.
export const revalidate = 60;

/**
 * The hero preview and the featured grid read the same page of the catalogue.
 * Asking for it with identical parameters lets Next dedupe the two into a
 * single request per render.
 */
const FEATURED_QUERY = { size: 7 } as const;

/** The same inbox the footer's "Əlaqə" link writes to. */
const SUPPORT_EMAIL = "support@aztu.edu.az";

/**
 * An icon squircle or pill resting on a tinted surface (a muted step card, a
 * pale-navy tile). White in light mode; in dark mode `bg-card` would read as a
 * hole in the tint, so it becomes a raised navy chip with a hairline edge.
 */
const RAISED =
  "bg-card elev-1 dark:bg-navy-800/60 dark:ring-1 dark:ring-inset dark:ring-white/10";

type Props = { params: Promise<{ lang: string }> };

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
          valueFree: t("home.valueFree"),
          valueProgress: t("home.valueProgress"),
          valueModes: t("home.valueModes"),
          valueExperts: t("home.valueExperts"),
        }}
        preview={
          <Suspense fallback={<HeroCourseSkeleton />}>
            <HeroPreview locale={locale} t={t} />
          </Suspense>
        }
      />

      {/* Sections sit straight on the page canvas as white rounded objects, so
          the rhythm comes from spacing rather than alternating bands. */}
      <div className="space-y-24 py-20 sm:space-y-32 sm:py-28">
        {/* ── CATEGORIES ── */}
        <Suspense fallback={null}>
          <CategoriesSection
            eyebrow={t("nav.categories")}
            title={t("home.categoriesTitle")}
            description={t("home.categoriesDesc")}
            allLabel={t("home.allCategories")}
            exploreLabel={t("categoriesPage.explore")}
            viewAllLabel={t("common.viewAll")}
          />
        </Suspense>

        {/* ── FEATURED ── */}
        <Section>
          <SectionHeading
            eyebrow={t("home.featured")}
            title={t("home.featuredTitle")}
            description={t("home.featuredDesc")}
            action={
              <Link
                href={localeHref(locale, "/courses")}
                className={cn(buttonVariants({ variant: "outline" }), "group")}
              >
                {t("common.viewAll")}
                <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />
          <div className="mt-10 sm:mt-12">
            <Suspense fallback={<FeaturedSkeleton />}>
              <FeaturedCourses
                locale={locale}
                emptyTitle={t("home.noCourses")}
                browseLabel={t("home.browseCourses")}
                catalogTitle={t("home.catalogTitle")}
                catalogDesc={t("home.catalogDesc")}
                filterLabels={[
                  t("filters.category"),
                  t("filters.mode"),
                  t("filters.rating"),
                  t("filters.duration"),
                ]}
              />
            </Suspense>
          </div>
        </Section>

        {/* ── HOW IT WORKS ── one white panel holding three numbered steps ── */}
        <Section>
          <div className="rounded-4xl border border-border/80 bg-card px-5 py-10 elev-1 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <SectionHeading
              align="center"
              eyebrow={t("home.howItWorks")}
              title={t("home.howItWorksTitle")}
            />
            <Stagger className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-5">
              <Step n={1} icon={Search} title={t("home.step1Title")} desc={t("home.step1Desc")} />
              <Step n={2} icon={UserPlus} title={t("home.step2Title")} desc={t("home.step2Desc")} />
              <Step n={3} icon={PlayCircle} title={t("home.step3Title")} desc={t("home.step3Desc")} />
            </Stagger>
          </div>
        </Section>

        {/* ── WHY US ── the heading takes the first cell of a 2×2 grid ── */}
        <Section>
          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            <div className="flex flex-col justify-center pb-4 md:py-6 md:pr-10">
              <SectionHeading
                eyebrow={t("home.whyUs")}
                title={t("home.whyUsTitle")}
                description={t("home.whyUsDesc")}
              />
            </div>
            <FeatureCard
              icon={MonitorPlay}
              title={t("home.feature1Title")}
              desc={t("home.feature1Desc")}
            />
            <FeatureCard
              icon={Users}
              title={t("home.feature2Title")}
              desc={t("home.feature2Desc")}
            />
            <FeatureCard
              icon={TrendingUp}
              title={t("home.feature3Title")}
              desc={t("home.feature3Desc")}
            />
          </div>
        </Section>

        {/* ── EXPERTS ── real directory entries, not a static showcase ── */}
        <Suspense fallback={null}>
          <ExpertsSection
            locale={locale}
            eyebrow={t("home.tutorsEyebrow")}
            title={t("home.tutorsTitle")}
            description={t("home.tutorsDesc")}
            viewAll={t("common.viewAll")}
            join={{
              title: t("home.becomeExpertTitle"),
              desc: t("home.becomeExpertDesc"),
              cta: t("home.becomeExpertCta"),
            }}
            labelFor={(courseCount, enrolled) => ({
              courses: t("experts.courses", { count: courseCount }),
              students: t("experts.students", { count: enrolled }),
              online: t("common.online"),
              offline: t("common.offline"),
              // The directory passes the same label, so the card ends in the
              // same "Profilə bax" pill on both pages.
              view: t("experts.viewProfile"),
            })}
          />
        </Suspense>

        {/* ── FAQ ── */}
        <Section>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
              <SectionHeading
                eyebrow={t("home.faqEyebrow")}
                title={t("home.faqTitle")}
                description={t("home.faqDesc")}
              />
              {/* The description invites a message, so the way to send one
                  sits right under it rather than only in the footer. */}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={cn(buttonVariants({ variant: "soft", size: "sm" }), "mt-6 h-10 sm:h-9")}
              >
                <Mail aria-hidden />
                {t("home.faqContact")}
              </a>
            </div>
            <div className="lg:col-span-7">
              <FAQ
                items={[1, 2, 3, 4, 5].map((i) => ({
                  q: t(`home.faq${i}Q`),
                  a: t(`home.faq${i}A`),
                }))}
              />
            </div>
          </div>
        </Section>
      </div>

      {/* ── CLOSING ── a contained deep panel with the page's one gold button.
          The bottom gap matches the other pages' last section, so this panel
          and the footer's (same navy, same radius) read as two objects. ── */}
      <section className="container-fluid pb-16 sm:pb-20">
        <Reveal>
          <div className="surface-deep relative isolate overflow-hidden rounded-4xl px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            {/* The university shield as a watermark, kept clear of the copy by
                only showing it where the layout has a free right-hand side. */}
            <AztuMark
              tone="onDeep"
              className="pointer-events-none absolute -bottom-24 -right-12 -z-10 hidden size-[26rem] -rotate-12 opacity-[0.05] lg:block"
            />
            <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <Eyebrow tone="deep">{t("home.ctaBadge")}</Eyebrow>
                <h2 className="font-display mt-5 max-w-[16ch] text-balance text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
                  {t("home.ctaTitle")}
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="max-w-md text-pretty text-base leading-relaxed text-white/72 sm:text-lg">
                  {t("home.ctaDesc")}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={localeHref(locale, "/register")}
                    className={buttonVariants({ size: "lg", variant: "gold" })}
                  >
                    {t("home.createAccount")}
                  </Link>
                  <Link
                    href={localeHref(locale, "/courses")}
                    className={buttonVariants({ size: "lg", variant: "onDeep" })}
                  >
                    {t("home.browseCourses")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */

/** One marketing section on the page canvas, revealed as it scrolls in. */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="container-fluid">
      <Reveal>{children}</Reveal>
    </section>
  );
}

/** The tinted squircle every icon on the page sits in. */
function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={1.9} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Section pieces                                                     */
/* ------------------------------------------------------------------ */

function Step({
  n,
  icon,
  title,
  desc,
}: {
  n: number;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <StaggerItem className="relative h-full rounded-3xl bg-muted/60 p-6 sm:p-7 dark:bg-muted">
      <div className="flex items-start justify-between">
        <IconTile icon={icon} className={RAISED} />
        <span
          aria-hidden
          className="font-display text-5xl font-extrabold leading-none text-navy-100 dark:text-navy-600/60"
        >
          {String(n).padStart(2, "0")}
        </span>
      </div>
      <h3 className="font-display mt-8 text-lg leading-snug sm:text-xl">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{desc}</p>
    </StaggerItem>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-7 elev-1 transition duration-200 hover:-translate-y-0.5 hover:elev-3 sm:p-8">
      <IconTile icon={icon} />
      {/* A fixed gap under the icon rather than pinning the text to the
          floor: titles in one row then start on the same line however many
          lines each description wraps to. */}
      <div className="mt-6 sm:mt-10">
        <h3 className="font-display text-xl leading-snug">{title}</h3>
        <p className="mt-2.5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {desc}
        </p>
      </div>
    </div>
  );
}

/**
 * Categories carry no icon of their own (`iconUrl` is empty in practice), so
 * a tile picks one from the words in the slug and name, with a stable hash
 * over a neutral set for anything unrecognised.
 *
 * This is a copy of `pickIcon` in CategoryGrid, kept identical so a subject
 * wears the same icon here as on /categories. That file does not export it
 * yet; once it does, import it and delete this copy.
 */
const KEYWORD_ICONS: readonly [RegExp, LucideIcon][] = [
  [/\b(data|ai|artificial|intelligence|machine)\b/, BrainCircuit],
  [/(information|software|programming|computer|web|\bit\b|techn)/, Code2],
  [/(business|management|finance|econom|entrepreneur|account)/, Briefcase],
  [/(research|academic|science|scholar|education|teach)/, GraduationCap],
  [/(construction|architect|civil|building|urban)/, Building2],
  [/(transport|logistic|automotive|vehicle|aviation|maritime)/, Truck],
  [/(engineer|mechanic|electr|energy|industr)/, Cog],
  [/(design|\bart\b|creative)/, Palette],
  [/(language|linguist)/, Languages],
  [/(math|statist)/, Calculator],
  [/(market|media|communicat)/, Megaphone],
  [/(health|medic|bio)/, HeartPulse],
  [/(music|sound)/, Music],
  [/(photo|video|film)/, Camera],
  [/(physic|chemi)/, Atom],
];

const FALLBACK_ICONS: LucideIcon[] = [Code2, GraduationCap, Cog, Briefcase, Atom];

function categoryIcon(category: Category): LucideIcon {
  const words = `${category.slug} ${category.name}`.toLowerCase().replace(/[-_&]/g, " ");
  const match = KEYWORD_ICONS.find(([re]) => re.test(words));
  if (match) return match[1];
  let h = 0;
  for (let i = 0; i < category.slug.length; i++) h = (h * 31 + category.slug.charCodeAt(i)) | 0;
  return FALLBACK_ICONS[Math.abs(h) % FALLBACK_ICONS.length];
}

/** A description that only repeats the name adds nothing to the tile. */
function usefulDescription(category: Category) {
  const d = category.description?.trim();
  if (!d || d.toLowerCase() === category.name.trim().toLowerCase()) return null;
  return d;
}

/* ------------------------------------------------------------------ */
/*  Data-backed sections                                               */
/* ------------------------------------------------------------------ */

const LEVEL_KEY: Record<CourseLevel, string> = {
  BEGINNER: "common.beginner",
  INTERMEDIATE: "common.intermediate",
  ADVANCED: "common.advanced",
  ALL: "common.allLevels",
};

/** "Azərbaycan dili" / "Azerbaijani" from an ISO code, as the course page shows it. */
function languageText(code: string | null | undefined, locale: Locale, t: TFunction) {
  if (!code) return null;
  let name = code.toUpperCase();
  try {
    const shown = new Intl.DisplayNames([locale], { type: "language" }).of(code);
    if (shown && shown.toLowerCase() !== code.toLowerCase()) {
      name = shown.charAt(0).toLocaleUpperCase(locale) + shown.slice(1);
    }
  } catch {
    // An unknown or malformed code keeps its upper-cased form.
  }
  return t("courseDetail.languageName", { name });
}

/** The course's price in the page's locale, the way CourseCard prints it. */
function priceText(amount: string | number, currency: string, locale: Locale) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

/** The hero's right column: the newest published course, or a quiet decoration. */
async function HeroPreview({ locale, t }: { locale: Locale; t: TFunction }) {
  const data = await courseServerApi.list(FEATURED_QUERY).catch(() => null);
  // The catalogue's default order is newest-published first.
  const lead = data?.content[0];
  if (!lead) return <HeroDecor />;

  const online = lead.courseType === "ONLINE";
  const format = t(online ? "common.online" : "common.offline");
  const language = languageText(lead.language, locale, t);

  return (
    <HeroCourseCard
      course={{
        slug: lead.slug,
        title: lead.title,
        thumbnail: mediaSrc(lead.thumbnailUrl),
        online,
        free: lead.free,
        tutorName: lead.tutorDisplayName,
      }}
      labels={{
        eyebrow: t("home.heroCardEyebrow"),
        cta: t("home.heroCardCta"),
        tutor: t("home.heroCardTutor"),
        formatValue: format,
        price: lead.free ? t("common.free") : priceText(lead.price, lead.currency, locale),
        level: t("home.heroCardLevel"),
        levelValue: t(LEVEL_KEY[lead.level] ?? "common.allLevels"),
        // The format is already on the cover, so the second fact is the
        // teaching language when there is one.
        extra: language
          ? { kind: "language", label: t("courseDetail.factLanguage"), value: language }
          : { kind: "format", label: t("home.heroCardFormat"), value: format },
      }}
    />
  );
}

async function CategoriesSection({
  eyebrow,
  title,
  description,
  allLabel,
  exploreLabel,
  viewAllLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  allLabel: string;
  exploreLabel: string;
  viewAllLabel: string;
}) {
  const cats = await categoryServerApi.list().catch(() => []);
  // Seven subjects plus the "all categories" tile fill two rows of four.
  const top = cats.filter((c) => !c.parentId && c.active).slice(0, 7);
  if (!top.length) return null;

  // The same anatomy as the /categories grid — icon squircle, title, optional
  // description, a "Kursları kəşf et →" footer — so a subject looks the same
  // on both pages.
  const tile =
    "group flex h-full flex-col rounded-3xl p-4 transition duration-200 hover:-translate-y-0.5 hover:elev-3 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6";
  const squircle =
    "grid size-11 shrink-0 place-items-center rounded-2xl transition-colors duration-200 sm:size-12";
  const footer =
    "mt-auto flex items-center gap-1.5 pt-4 text-[13px] font-semibold transition-colors duration-200 sm:pt-5 sm:text-sm";
  const arrow =
    "size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none";

  return (
    <Section>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <Stagger
        stagger={0.05}
        className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4"
      >
        {top.map((c) => {
          const Icon = categoryIcon(c);
          const about = usefulDescription(c);
          return (
            <StaggerItem key={c.id} className="h-full min-w-0">
              <LocaleLink
                href={`/courses?categoryId=${c.id}`}
                className={cn(
                  tile,
                  "border border-border/80 bg-card elev-1 hover:border-primary/20",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    squircle,
                    "bg-navy-50 text-navy-700 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-navy-900/60 dark:text-navy-100",
                  )}
                >
                  <Icon className="size-5 sm:size-[22px]" strokeWidth={1.75} />
                </span>
                <h3 className="font-display mt-5 text-pretty break-words text-base leading-snug text-foreground sm:mt-6 sm:text-lg">
                  {c.name}
                </h3>
                {about ? (
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                    {about}
                  </p>
                ) : null}
                <span className={cn(footer, "text-muted-foreground group-hover:text-primary")}>
                  {exploreLabel}
                  <ArrowRight aria-hidden className={arrow} />
                </span>
              </LocaleLink>
            </StaggerItem>
          );
        })}
        {/* The way on to the full list, in the same anatomy on a pale-navy
            tint so it reads as the section's exit rather than a subject. */}
        <StaggerItem className="h-full min-w-0">
          <LocaleLink
            href="/categories"
            className={cn(
              tile,
              "bg-navy-50 text-navy-800 ring-1 ring-inset ring-navy-100 dark:bg-navy-900/40 dark:text-navy-50 dark:ring-navy-800",
            )}
          >
            <span aria-hidden className={cn(squircle, RAISED, "text-navy-700 dark:text-navy-100")}>
              <LayoutGrid className="size-5 sm:size-[22px]" strokeWidth={1.75} />
            </span>
            <h3 className="font-display mt-5 text-pretty break-words text-base leading-snug sm:mt-6 sm:text-lg">
              {allLabel}
            </h3>
            <span className={cn(footer, "text-navy-700 dark:text-navy-100")}>
              {viewAllLabel}
              <ArrowRight aria-hidden className={arrow} />
            </span>
          </LocaleLink>
        </StaggerItem>
      </Stagger>
    </Section>
  );
}

/** Static class names, so Tailwind can see every span the join tile uses. */
const LG_SPAN: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
};

async function ExpertsSection({
  locale,
  eyebrow,
  title,
  description,
  viewAll,
  join,
  labelFor,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  viewAll: string;
  join: { title: string; desc: string; cta: string };
  labelFor: (
    courseCount: number,
    enrolled: number,
  ) => { courses: string; students: string; online: string; offline: string };
}) {
  const experts = (await listExperts()).slice(0, 4);
  if (!experts.length) return null;

  return (
    <Section>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <Link
            href={localeHref(locale, "/experts")}
            className={cn(buttonVariants({ variant: "outline" }), "group")}
          >
            {viewAll}
            <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <Stagger className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {experts.map((e) => (
          <StaggerItem key={e.id} className="h-full">
            <ExpertCard
              expert={e}
              locale={locale}
              labels={labelFor(e.courseCount, e.enrolledCount)}
            />
          </StaggerItem>
        ))}
        {/* A short row gets an open invitation in its free cell rather than a
            gap — real experts first, then the way to become one. */}
        {experts.length < 4 ? (
          <StaggerItem
            className={cn(
              "h-full",
              experts.length % 2 ? "sm:col-span-1" : "sm:col-span-2",
              LG_SPAN[4 - experts.length],
            )}
          >
            <LocaleLink
              href="/register/tutor"
              className="group relative isolate flex h-full min-h-64 flex-col overflow-hidden rounded-3xl bg-navy-50 p-7 ring-1 ring-inset ring-navy-100 transition duration-200 hover:-translate-y-0.5 hover:elev-3 sm:p-8 dark:bg-navy-900/40 dark:ring-navy-800"
            >
              {/* Concentric rings echo the hero; decoration only. */}
              <span
                aria-hidden
                className="absolute -bottom-28 -right-28 -z-10 hidden size-80 rounded-full border border-navy-200/70 sm:block dark:border-navy-800"
              />
              <span
                aria-hidden
                className="absolute -bottom-14 -right-14 -z-10 hidden size-52 rounded-full border border-navy-200/70 sm:block dark:border-navy-800"
              />
              <IconTile icon={GraduationCap} className={RAISED} />
              <h3 className="font-display mt-6 text-xl leading-snug">{join.title}</h3>
              <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                {join.desc}
              </p>
              <div className="mt-auto pt-8">
                <span
                  className={cn(
                    RAISED,
                    "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-navy-700 transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:text-navy-100 dark:group-hover:text-primary-foreground",
                  )}
                >
                  {join.cta}
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </LocaleLink>
          </StaggerItem>
        ) : null}
      </Stagger>
    </Section>
  );
}

async function FeaturedCourses({
  locale,
  emptyTitle,
  browseLabel,
  catalogTitle,
  catalogDesc,
  filterLabels,
}: {
  locale: Locale;
  emptyTitle: string;
  browseLabel: string;
  catalogTitle: string;
  catalogDesc: string;
  /** Category, format, rating, duration — filters the catalogue really has. */
  filterLabels: [string, string, string, string];
}) {
  const data = await courseServerApi.list(FEATURED_QUERY).catch(() => null);
  const courses = (data?.content ?? []).slice(0, 6);

  if (!courses.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
        <IconTile icon={BookOpen} className="mx-auto size-14" />
        <p className="font-display mt-6 text-xl">{emptyTitle}</p>
        <Link
          href={localeHref(locale, "/courses")}
          className={cn(buttonVariants({ variant: "soft" }), "group mt-7")}
        >
          {browseLabel}
          <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    );
  }

  // The catalogue tile fills whatever is left of the last row, so a short
  // list never ends in an empty gap; a full row needs no filler. A phone
  // shows one column, where there is never a gap to fill and the tile would
  // only repeat the "Hamısına bax" button above the grid, so it starts at sm.
  const n = courses.length;
  const lgRest = n % 3;
  const smRest = n % 2;
  const showTile = lgRest !== 0;
  // With a single course the tile is two columns wide on desktop, which leaves
  // room to preview the filters the catalogue really offers.
  const wide = lgRest === 1;
  const filterIcons = [LayoutGrid, MonitorPlay, Star, Clock];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
      {showTile ? (
        <LocaleLink
          href="/courses"
          className={cn(
            "group relative isolate hidden gap-8 overflow-hidden rounded-3xl border border-border/80 bg-card p-7 elev-1 transition duration-200 hover:-translate-y-0.5 hover:elev-3 sm:grid sm:p-9",
            smRest ? "sm:col-span-1" : "sm:col-span-2",
            wide ? "lg:col-span-2 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10" : "lg:col-span-1",
          )}
        >
          <div className="flex h-full flex-col justify-between gap-10">
            <IconTile icon={Compass} />
            <div>
              <h3 className="font-display text-2xl leading-tight sm:text-[1.75rem]">
                {catalogTitle}
              </h3>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                {catalogDesc}
              </p>
              <span className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-navy-600 dark:group-hover:bg-white">
                {browseLabel}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </div>
          {wide ? (
            // Decorative: the link text already says where it goes.
            <ul
              aria-hidden
              className="hidden w-60 flex-col gap-2.5 rounded-3xl bg-muted/70 p-3 lg:flex dark:bg-muted/60"
            >
              {filterLabels.map((label, i) => {
                const Icon = filterIcons[i];
                return (
                  <li
                    key={label}
                    style={{ transitionDelay: `${i * 40}ms` }}
                    className={cn(
                      RAISED,
                      "flex items-center gap-3 rounded-2xl p-2.5 pr-4 text-sm font-semibold transition-transform duration-300 group-hover:-translate-x-1",
                    )}
                  >
                    <IconTile icon={Icon} className="size-9 rounded-xl [&_svg]:size-4" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <span className="size-2 rounded-full bg-navy-100 dark:bg-navy-500/60" />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </LocaleLink>
      ) : null}
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

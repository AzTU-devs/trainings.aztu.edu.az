import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock, Hash, Hourglass, Layers, Mail, MapPin, MonitorPlay, PenLine, Plus, Search, Sparkles, UserRound, Users } from "lucide-react";
import { listCourses, listExpertsSource } from "@/features/showcase/source.server";
import { SHOWCASE } from "@/features/showcase/flag";
import { CertificateStage } from "@/features/certificate/CertificateStage";
import { courseCertificate } from "@/features/certificate/course";
import { bakuDateISO } from "@/features/certificate/date";
import { categoryOf, categoryOfExpert, getCatalogIndex, type CatalogIndex } from "@/features/course/catalog-index.server";
import { courseLabels } from "@/features/course/labels";
import { CourseCard, CourseCover, WideCourseCard } from "@/features/course/components/CourseCard";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { CategoryBento, TopicChip, type CategoryItem } from "@/features/category/components/CategoryTiles";
import { ExpertArch } from "@/features/expert/components/ExpertArch";
import { initialsOf, type ExpertSummary } from "@/features/expert/types";
import { SUPPORT_EMAIL } from "@/components/layout/Footer";
import { HeroSearch } from "@/components/bright/HeroSearch";
import { Mosaic, MosaicBand } from "@/components/bright/Mosaic";
import { RailControls } from "@/components/bright/RailControls";
import { Svg } from "@/components/bright/Svg";
import { StarIcon } from "@/components/bright/bits";
import { protractorSvg } from "@/lib/art";
import { formatCompact, formatRating } from "@/lib/utils/format";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { isLocale, type Locale } from "@/i18n/config";
import type { CourseSummary } from "@/features/course/types";

// One minute: new courses and categories should appear promptly, and every
// figure on this page is a real count read from the catalogue.
export const revalidate = 60;

type Props = { params: Promise<{ lang: string }> };

/** The categories as the page shows them: localised, coloured, counted. */
function categoryItems(index: CatalogIndex, t: TFunction, locale: Locale): CategoryItem[] {
  return index.categories.map((c) => {
    const count = index.countByCategory[c.id] ?? 0;
    const descKey = `categoryDesc.${c.slug}`;
    const desc = t(descKey);
    return {
      id: c.id,
      name: categoryLabel(c, t, locale),
      description: desc !== descKey ? desc : null,
      count,
      countLabel: t("ui.courseCount", { count }),
      style: categoryStyle(c),
      href: `/courses?categoryId=${c.id}`,
    };
  });
}

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const [index, newest, experts] = await Promise.all([
    getCatalogIndex(),
    // The API lists newest first when no sort is given.
    listCourses({ page: 0, size: 8 }).catch(() => null),
    listExpertsSource().catch(() => [] as ExpertSummary[]),
  ]);

  const labels = courseLabels(t, locale);
  const items = categoryItems(index, t, locale);
  const HERO_SLUGS = ["data-ai", "information-technology", "engineering", "business-and-management"];
  const bySlug = new Map(index.categories.map((c, i) => [c.slug, items[i]]));
  const heroTopics = [
    ...HERO_SLUGS.map((s) => bySlug.get(s)).filter((i): i is CategoryItem => !!i),
    ...[...items].sort((a, b) => b.count - a.count).filter((i) => !HERO_SLUGS.includes(index.categories.find((c) => c.id === i.id)?.slug ?? "")),
  ].slice(0, 4);
  const courses = newest?.content ?? [];
  const catFor = (c: CourseSummary) => {
    const cat = categoryOf(index, c.id);
    return cat ? { name: categoryLabel(cat, t, locale), style: categoryStyle(cat) } : null;
  };
  const lead = courses[0];

  // The certificate section fills the template in with one sample course and
  // renders only while the site shows sample content (SHOWCASE), which is where
  // that course exists. The platform does not issue certificates yet, so the
  // copy says they are coming soon and the sheet is stamped "Sample".
  const certCourse = SHOWCASE ? (courses.find((c) => c.slug === CERT_SAMPLE_SLUG) ?? lead) : undefined;
  const certificate = certCourse
    ? courseCertificate({
        t,
        locale,
        today: bakuDateISO(),
        courseId: certCourse.id,
        title: certCourse.title,
        categoryName: catFor(certCourse)?.name,
        expertName: certCourse.tutorDisplayName,
        seconds: certCourse.totalDurationSec,
      })
    : null;

  return (
    <>
      {/* ============ 1. HERO: search-led, a "periodic table" of disciplines ============ */}
      <section className="relative isolate" aria-labelledby="hero-title">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 bottom-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 right-[-12%] size-[980px] rounded-full bg-[radial-gradient(closest-side,var(--gold-tint),transparent)]" />
          <div className="absolute -left-72 top-[30%] size-[720px] rounded-full bg-[radial-gradient(closest-side,var(--navy-tint),transparent)]" />
        </div>

        <div className="lg:hidden">
          <MosaicBand />
        </div>

        <div className="wrap grid grid-cols-1 items-center gap-x-8 gap-y-10 pb-20 lg:grid-cols-12 lg:pb-32 lg:pt-12">
          <div className="relative z-10 min-w-0 lg:col-span-6">
            <p className="kicker">
              <span className="rule" />
              {t("landing.kicker")}
            </p>
            <h1 id="hero-title" className="d-xl isolate mt-5 lg:mt-7">
              {t("landing.heroLead")}{" "}
              <span className="mark">
                {t("landing.heroMark")}
                <svg viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden>
                  <path d="M5 16 C 60 5, 140 5, 195 13" />
                </svg>
              </span>
              {t("landing.heroEnd")}
            </h1>
            <p className="lead mt-6 max-w-[33rem] lg:mt-7">{t("landing.heroSub")}</p>

            <HeroSearch
              labels={{
                all: t("landing.formatAll"),
                online: labels.format.ONLINE,
                inPerson: labels.format.OFFLINE,
                format: t("landing.formatLabel"),
                placeholder: t("landing.searchPlaceholder"),
                field: t("ui.searchCourses"),
                submit: t("landing.searchSubmit"),
              }}
            />

            {/* The four subjects the hero offers as quick entries: these four
                when they exist (the design's own choice), topped up by the
                busiest other categories. */}
            {heroTopics.length ? (
              <div className="-mx-5 mt-6 flex items-center gap-2.5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
                <span className="mr-1 shrink-0 text-[14px] text-ink-3">{t("landing.topics")}</span>
                {heroTopics.map((i) => (
                  <TopicChip key={i.id} item={i} />
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative min-w-0 lg:col-span-6">
            <div className="hidden lg:block">
              <Mosaic />
            </div>
            {lead ? (
              <div className="relative z-10 lg:absolute lg:bottom-[-44px] lg:right-[-18px] lg:w-[400px]">
                <LocaleLink
                  href={`/courses/${lead.slug}`}
                  className={`float-card group flex items-center gap-4 pr-5 ${catFor(lead)?.style.k ?? "k-navy"}`}
                >
                  <CourseCover
                    course={lead}
                    category={catFor(lead)}
                    labels={labels}
                    pills={false}
                    className="aspect-[16/11] w-[128px] shrink-0 !rounded-[18px]"
                  />
                  <div className="min-w-0 py-1">
                    <span className="pill pill-gold !h-6 !text-[11.5px]">{labels.newest}</span>
                    <div className="clamp-2 mt-2 font-display text-[16.5px] font-bold leading-snug tracking-tight">
                      {lead.title}
                    </div>
                    <div className="meta mt-1.5 !text-[13px]">
                      <span>
                        {lead.courseType === "ONLINE" ? <MonitorPlay className="i" aria-hidden /> : <MapPin className="i" aria-hidden />}
                        {labels.format[lead.courseType]}
                      </span>
                      {labels.duration(lead.totalDurationSec) ? (
                        <span>
                          <Clock className="i" aria-hidden />
                          {labels.duration(lead.totalDurationSec)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </LocaleLink>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============ 2. CATEGORIES: a bento of colour fields ============ */}
      {items.length ? (
        <section className="section !pt-4 lg:!pt-10" id="categories" aria-labelledby="cat-title">
          <div className="wrap">
            <div className="mb-10 grid items-end gap-x-8 gap-y-5 lg:mb-14 lg:grid-cols-12">
              <h2 id="cat-title" className="d-lg lg:col-span-7">
                {t("landing.categoriesTitle")}
              </h2>
              <p className="lead lg:col-span-5 lg:pb-1.5">{t("landing.categoriesSub")}</p>
            </div>
            <CategoryBento items={items} />
            {items.length > 8 ? (
              <LocaleLink href="/categories" className="link mt-8">
                {t("landing.allCategories")} <ArrowRight className="i" aria-hidden />
              </LocaleLink>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ============ 3. NEW COURSES: rail when there are several, spotlight when few ============ */}
      <section className="section overflow-x-clip !pt-0" id="new" aria-labelledby="new-title">
        <div className="wrap">
          <div className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
            <h2 id="new-title" className="d-lg max-w-[40rem]">
              {t("landing.newTitle")}
            </h2>
            {courses.length >= 3 ? (
              <div className="flex shrink-0 items-center gap-2">
                <LocaleLink href="/courses" className="link mr-3 hidden sm:inline-flex">
                  {t("ui.allCourses")} <ArrowRight className="i" aria-hidden />
                </LocaleLink>
                <RailControls target="rail-new" prev={t("ui.prev")} next={t("ui.next")} />
              </div>
            ) : null}
          </div>

          {courses.length >= 3 ? (
            <>
              <div className="scroller bleed pad-y" id="rail-new" tabIndex={0} aria-label={t("landing.newTitle")}>
                {courses.map((c) => (
                  <div key={c.id} className="w-[80%] max-w-[330px] sm:w-[44%] lg:w-[calc((1360px-80px-72px)/4)] lg:max-w-none">
                    <CourseCard course={c} category={catFor(c)} labels={labels} />
                  </div>
                ))}
              </div>
              <LocaleLink href="/courses" className="link mt-8 sm:hidden">
                {t("ui.allCourses")} <ArrowRight className="i" aria-hidden />
              </LocaleLink>
            </>
          ) : lead ? (
            <>
              <WideCourseCard
                course={lead}
                category={catFor(lead)}
                labels={labels}
                initials={initialsOf(lead.tutorDisplayName || "")}
                cta
              />
              <p className="mt-10 flex items-center gap-3 text-[15px] text-ink-3">
                <Sparkles className="i text-gold-ink" aria-hidden />
                {t("landing.justOpened")}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-3 text-[15px] text-ink-3">
              <Sparkles className="i text-gold-ink" aria-hidden />
              {t("landing.noCoursesYet")}
            </p>
          )}
        </div>
      </section>

      {/* ============ 4. TWO FORMATS: giant words on colour fields ============ */}
      <section className="section !pt-0" aria-labelledby="fmt-title">
        <h2 id="fmt-title" className="sr-only">
          {t("landing.formatsTitle")}
        </h2>
        <div className="wrap grid gap-4 lg:grid-cols-2">
          <FormatField
            k="k-navy"
            word={labels.format.ONLINE}
            text={t("landing.onlineText")}
            points={[t("landing.onlinePoint1"), t("landing.onlinePoint2"), t("landing.onlinePoint3")]}
            count={index.online}
            countLabel={t("ui.courseCount", { count: index.online })}
            cta={t("landing.onlineCta")}
            href="/courses?type=ONLINE"
            none={t("landing.noOnline")}
            primary
            art={<OnlineArt />}
          />
          <FormatField
            k="k-gold"
            word={labels.format.OFFLINE}
            text={t("landing.inPersonText")}
            points={[t("landing.inPersonPoint1"), t("landing.inPersonPoint2"), t("landing.inPersonPoint3")]}
            count={index.offline}
            countLabel={t("ui.courseCount", { count: index.offline })}
            cta={t("landing.inPersonCta")}
            href="/courses?type=OFFLINE"
            none={t("landing.noInPerson")}
            art={<InPersonArt />}
          />
        </div>
      </section>

      {/* ============ 5. HOW IT WORKS: three steps on a dimension line ============ */}
      <section className="section relative overflow-hidden bg-paper-2" aria-labelledby="how-title">
        <div className="wrap">
          <div className="grid items-end gap-x-8 gap-y-5 lg:grid-cols-12">
            <h2 id="how-title" className="d-lg lg:col-span-7">
              {t("landing.howTitle")}
            </h2>
            <p className="lead lg:col-span-5 lg:pb-1.5">{t("landing.howSub")}</p>
          </div>
          <div className="relative mt-12 lg:mt-20">
            <svg
              className="absolute -top-8 left-0 right-0 hidden h-6 w-full text-ink-3 lg:block"
              viewBox="0 0 1000 24"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M1 12H999M1 4V20M333.5 6V18M666.5 6V18M999 4V20"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
                vectorEffect="non-scaling-stroke"
                opacity=".55"
              />
            </svg>
            <ol className="grid gap-10 lg:grid-cols-3 lg:gap-8">
              <Step n="01" title={t("landing.step1Title")} text={t("landing.step1Text")}>
                <div className="vignette k-data flex h-[220px] flex-col justify-center gap-4">
                  <div className="flex h-12 items-center gap-3 rounded-full bg-paper px-4 shadow-[inset_0_0_0_1px_var(--line)]">
                    <Search className="i !size-[18px] text-ink-3" aria-hidden />
                    <span className="text-[15px] font-medium">{t("landing.step1Query")}</span>
                    <span className="h-5 w-[2px] animate-pulse bg-navy" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill pill-k">{labels.format.ONLINE}</span>
                    <span className="pill pill-line">{labels.level.BEGINNER}</span>
                    <span className="pill pill-line">{labels.free}</span>
                  </div>
                </div>
              </Step>
              <Step n="02" title={t("landing.step2Title")} text={t("landing.step2Text")}>
                <div className="vignette k-it relative flex h-[220px] flex-col justify-center">
                  <p className="font-display text-[34px] font-extrabold tracking-tight">{labels.free}</p>
                  <span className="btn btn-primary btn-block pointer-events-none mt-4">{t("landing.enrolFree")}</span>
                  <svg className="absolute bottom-6 right-[24%] w-7" viewBox="0 0 24 24" aria-hidden>
                    <path d="M5 3l14 8-6 1.5L10 19z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </div>
              </Step>
              <Step n="03" title={t("landing.step3Title")} text={t("landing.step3Text")}>
                <div className="vignette k-build flex h-[220px] flex-col justify-center gap-2.5">
                  {[t("landing.step3Done1"), t("landing.step3Done2")].map((l) => (
                    <div key={l} className="flex items-center gap-3 text-[14px]">
                      <span className="ck !size-6">
                        <CheckCircle2 className="i !size-3.5" aria-hidden />
                      </span>
                      <span className="text-ink-3 line-through decoration-line-2">{l}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-[14px] font-semibold">
                    <span className="grid size-6 place-items-center rounded-full shadow-[inset_0_0_0_2px_var(--k-500)]">
                      <span className="size-2 rounded-full bg-[var(--k-500)]" />
                    </span>
                    {t("landing.step3Now")}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="seats !h-2 flex-1">
                      <i style={{ width: "40%" }} />
                    </div>
                    <span className="mono text-[12px] text-ink-3">2 / 5</span>
                  </div>
                </div>
              </Step>
            </ol>
          </div>
        </div>
      </section>

      {/* ============ 5b. CERTIFICATE: what finishing a course leaves you with ============ */}
      {certificate ? (
        // No bottom padding: the experts section below opens with its own, on
        // the same canvas.
        <section className="section overflow-x-clip !pb-0" id="certificate" aria-labelledby="cert-title">
          <div className="wrap grid items-center gap-x-8 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="cert-title" className="d-lg">
                {t("certificate.homeTitle")}
              </h2>
              <p className="lead mt-5 max-w-[30rem]">{t("certificate.homeLead")}</p>
              <ul className="mt-8 grid gap-3.5">
                {(
                  [
                    [UserRound, t("certificate.homePoint1")],
                    [BookOpenCheck, t("certificate.homePoint2")],
                    [Hash, t("certificate.homePoint3")],
                    [PenLine, t("certificate.homePoint4")],
                  ] as const
                ).map(([Icon, text]) => (
                  <li key={text} className="flex items-center gap-4 text-[16px] font-medium">
                    <span className="k-gold grid size-11 shrink-0 place-items-center rounded-[14px] bg-[var(--k-100)] text-[var(--k-700)]">
                      <Icon className="i" aria-hidden />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <LocaleLink href="/courses" className="link mt-9">
                {t("certificate.homeCta")} <ArrowRight className="i" aria-hidden />
              </LocaleLink>
            </div>
            <div className="min-w-0 lg:col-span-7">
              <CertificateStage tilt {...certificate} />
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ 6. EXPERTS: sticky intro + arch portraits ============ */}
      {experts.length ? (
        <ExpertsSection experts={experts} index={index} t={t} locale={locale} />
      ) : null}

      {/* ============ 7. FAQ ============ */}
      <section className="section !pt-0" aria-labelledby="faq-title">
        <div className="wrap grid gap-x-8 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="faq-title" className="d-lg">
              {t("landing.faqTitle")}
            </h2>
            <p className="lead mt-5 max-w-md">{t("landing.faqSub")}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-ghost mt-7">
              <Mail className="i" aria-hidden />
              {t("landing.writeUs")}
            </a>
          </div>
          <div className="border-t border-line lg:col-span-7">
            {[1, 2, 3, 4, 5].map((n) => (
              <details key={n} className="acc faq-item" open={n === 1}>
                <summary>
                  {t(`landing.faq${n}Q`)}
                  <span className="pm">
                    <Plus className="i" aria-hidden />
                  </span>
                </summary>
                <p className="a">{t(`landing.faq${n}A`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 8. CLOSING: a drafting protractor around the shield ============ */}
      <section className="pb-20 lg:pb-28" aria-labelledby="cta-title">
        <div className="wrap">
          <div className="fmt k-gold grid items-end overflow-hidden !rounded-[44px] lg:grid-cols-12">
            <div className="relative z-10 p-8 sm:p-12 lg:col-span-7 lg:p-16">
              <h2 id="cta-title" className="d-lg">
                {t("landing.ctaTitle")}
              </h2>
              <p className="mt-5 max-w-lg text-[18px] leading-relaxed opacity-90">{t("landing.ctaSub")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LocaleLink className="btn btn-primary btn-lg" href="/register">
                  {t("landing.ctaRegister")} <ArrowRight className="i i-arrow" aria-hidden />
                </LocaleLink>
                <LocaleLink className="btn btn-ghost btn-lg" href="/courses">
                  {t("landing.ctaBrowse")}
                </LocaleLink>
              </div>
            </div>
            <div className="relative h-[230px] sm:h-[300px] lg:col-span-5 lg:h-[400px]" aria-hidden>
              <div className="absolute inset-x-0 bottom-0 flex h-full justify-center lg:justify-end lg:pr-6">
                <div className="relative aspect-[480/300] h-full">
                  <Svg markup={protractorSvg()} className="[&>svg]:absolute [&>svg]:inset-0 [&>svg]:size-full" />
                  <Image
                    src="/brand/aztu-mark-white.png"
                    alt=""
                    width={60}
                    height={114}
                    className="absolute bottom-[3%] left-1/2 h-[14%] w-auto -translate-x-1/2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** The sample course the home page's certificate is filled in with. */
const CERT_SAMPLE_SLUG = "python-ile-melumat-analizi";

function Step({ n, title, text, children }: { n: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <li>
      {children}
      <div className="mt-7 flex items-start gap-5">
        <span className="step-n" aria-hidden>
          {n}
        </span>
        <div>
          <h3 className="t-lg">{title}</h3>
          <p className="mt-2 text-ink-2">{text}</p>
        </div>
      </div>
    </li>
  );
}

function FormatField({
  k,
  word,
  text,
  points,
  count,
  countLabel,
  cta,
  href,
  none,
  primary,
  art,
}: {
  k: string;
  word: string;
  text: string;
  points: string[];
  count: number;
  countLabel: string;
  cta: string;
  href: string;
  none: string;
  primary?: boolean;
  art: React.ReactNode;
}) {
  return (
    <article className={`fmt ${k} flex flex-col p-7 sm:p-10 lg:p-12`}>
      <span className="absolute -right-24 -top-28 -z-10 size-[380px] rounded-full bg-[var(--k-200)]" aria-hidden />
      {art}
      <div className="relative mt-6">
        <h3 className="big">{word}</h3>
        <p className="mt-6 max-w-[27rem] text-[17.5px] leading-relaxed opacity-90">{text}</p>
        <ul className="mt-6 grid gap-3 text-[15.5px]">
          {points.map((p) => (
            <li key={p}>
              <CheckCircle2 className="i" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
        {count > 0 ? (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LocaleLink className={`btn ${primary ? "btn-primary" : "btn-ghost"}`} href={href}>
              {cta} <ArrowRight className="i i-arrow" aria-hidden />
            </LocaleLink>
            <span className="text-[15px] font-medium opacity-75">{countLabel}</span>
          </div>
        ) : (
          <p className="mt-8 inline-flex items-center gap-2.5 text-[15px] font-medium opacity-80">
            <Hourglass className="i" aria-hidden />
            {none}
          </p>
        )}
      </div>
    </article>
  );
}

function OnlineArt() {
  return (
    <svg className="-mr-2 w-[84%] max-w-[330px] self-end sm:w-[60%] lg:-mr-4" viewBox="20 20 270 220" aria-hidden>
      <g transform="translate(40 40)">
        <rect width="228" height="148" rx="22" className="f0" />
        <rect x="14" y="14" width="200" height="96" rx="14" className="f100" />
        <circle cx="114" cy="62" r="26" className="fn" />
        <path d="M106 49 L128 62 L106 75Z" fill="#fff" />
        <rect x="14" y="126" width="200" height="6" rx="3" className="f200" />
        <rect x="14" y="126" width="124" height="6" rx="3" className="f700" />
        <circle cx="138" cy="129" r="8" className="fg" />
      </g>
      <g transform="translate(40 204)">
        <rect width="84" height="26" rx="13" className="f0" />
        <rect x="92" width="104" height="26" rx="13" className="f0" />
        <circle cx="14" cy="13" r="5" className="f500" />
        <circle cx="106" cy="13" r="5" className="f300" />
        <rect x="26" y="10" width="44" height="6" rx="3" className="f200" />
        <rect x="118" y="10" width="62" height="6" rx="3" className="f200" />
      </g>
    </svg>
  );
}

function InPersonArt() {
  const seats: [number, number][] = [];
  for (const y of [54, 80, 106, 132]) for (const x of [16, 42, 68, 94, 120, 146]) seats.push([x, y]);
  const taken = new Set(["68,80", "120,106"]);
  const gaps = new Set(["68,54", "146,106", "94,132", "120,132", "146,132"]);
  return (
    <svg className="-mr-2 w-[84%] max-w-[330px] self-end sm:w-[60%] lg:-mr-4" viewBox="20 20 270 220" aria-hidden>
      <g transform="translate(40 36)">
        <rect width="190" height="164" rx="22" className="f0" />
        <path d="M0 22A22 22 0 0 1 22 0H168A22 22 0 0 1 190 22V40H0Z" className="f300" />
        <circle cx="40" cy="20" r="5" className="f0" />
        <circle cx="150" cy="20" r="5" className="f0" />
        {seats
          .filter(([x, y]) => !gaps.has(`${x},${y}`))
          .map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="20" height="18" rx="5" className={taken.has(`${x},${y}`) ? "fn" : "f100"} />
          ))}
      </g>
      <g transform="translate(236 150)">
        <circle r="32" className="f0" />
        <circle r="32" className="s300 fnone" strokeWidth="4" />
        <path d="M0 14 C-11 1 -16 -6 -16 -14 A16 16 0 0 1 16 -14 C16 -6 11 1 0 14Z" className="fn" />
        <circle cy="-14" r="5.5" fill="#fff" />
      </g>
    </svg>
  );
}

function ExpertsSection({
  experts,
  index,
  t,
  locale,
}: {
  experts: ExpertSummary[];
  index: CatalogIndex;
  t: TFunction;
  locale: Locale;
}) {
  const kOf = (id: string) => categoryStyle(categoryOfExpert(index, id)).k;
  const shown = experts.slice(0, 6);
  const invite = (
    <div className="k-gold relative isolate overflow-hidden rounded-[30px] bg-[var(--k-100)] p-7 text-[var(--k-900)]">
      <svg className="absolute -right-10 -top-10 -z-10 w-40" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="40" className="s300 fnone" strokeWidth="8" />
        <circle cx="50" cy="50" r="16" className="f300" />
      </svg>
      <p className="font-display text-[22px] font-bold tracking-tight">{t("landing.shareTitle")}</p>
      <p className="mt-2 max-w-[17rem] text-[15px] opacity-85">{t("landing.shareText")}</p>
      <LocaleLink href="/register/tutor" className="btn btn-primary btn-sm mt-5">
        {t("landing.shareCta")} <ArrowRight className="i i-arrow" aria-hidden />
      </LocaleLink>
    </div>
  );
  const byline = (e: ExpertSummary) => [e.academicTitle, e.headline ?? e.department].filter(Boolean).join(" · ");

  return (
    <section className="section overflow-x-clip" id="experts" aria-labelledby="ex-title">
      <div className="wrap grid gap-x-8 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 id="ex-title" className="d-lg">
              {t("landing.expertsTitle")}
            </h2>
            <p className="lead mt-5">{t("landing.expertsSub")}</p>
            <LocaleLink href="/experts" className="link mt-6">
              {t("landing.allExperts")} <ArrowRight className="i" aria-hidden />
            </LocaleLink>
            <div className="mt-10 hidden lg:block">{invite}</div>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-8">
          {shown.length >= 3 ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
              {shown.map((e) => (
                <article key={e.id} className="xcard group relative">
                  <ExpertArch id={e.id} name={e.displayName} avatarUrl={e.avatarUrl} k={kOf(e.id)} />
                  <div className="px-1 pt-4">
                    <h3 className="t-md">
                      <LocaleLink href={`/experts/${e.id}`} className="stretched">
                        {e.displayName}
                      </LocaleLink>
                    </h3>
                    {byline(e) ? <p className="clamp-2 mt-1 text-[14px] text-ink-2">{byline(e)}</p> : null}
                    <div className="meta mt-2.5">
                      {e.ratingCount > 0 ? (
                        <span className="rate">
                          <StarIcon />
                          {formatRating(e.ratingAvg, locale)}
                        </span>
                      ) : null}
                      <span>
                        <Layers className="i" aria-hidden />
                        {t("ui.courseCount", { count: e.courseCount })}
                      </span>
                      <span>
                        <Users className="i" aria-hidden />
                        {formatCompact(e.enrolledCount, locale)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-6">
              {shown.map((e) => (
                <article
                  key={e.id}
                  className="xcard group relative grid items-end gap-6 rounded-[40px] bg-paper-2 p-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-10 sm:p-10"
                >
                  <ExpertArch id={e.id} name={e.displayName} avatarUrl={e.avatarUrl} k={kOf(e.id)} className="max-w-[15rem]" />
                  <div className="pb-2">
                    <h3 className="d-md">
                      <LocaleLink href={`/experts/${e.id}`} className="stretched">
                        {e.displayName}
                      </LocaleLink>
                    </h3>
                    {byline(e) ? <p className="mt-2 text-[16px] text-ink-2">{byline(e)}</p> : null}
                    <div className="meta mt-5 text-[14px]">
                      <span>
                        <Layers className="i" aria-hidden />
                        {t("ui.courseCount", { count: e.courseCount })}
                      </span>
                      <span>
                        <Users className="i" aria-hidden />
                        {t("landing.participants", { count: e.enrolledCount })}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="mt-10 lg:hidden">{invite}</div>
        </div>
      </div>
    </section>
  );
}

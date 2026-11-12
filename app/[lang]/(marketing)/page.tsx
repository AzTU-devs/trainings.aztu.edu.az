import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Award, Mail, Plus, Search } from "lucide-react";
import { listCourses, listExpertsSource } from "@/features/showcase/source.server";
import { SHOWCASE_EXPERTS } from "@/features/showcase/flag";
import { categoryOf, categoryOfExpert, getCatalogIndex, indexFor, type CatalogIndex } from "@/features/course/catalog-index.server";
import { courseLabels } from "@/features/course/labels";
import { CourseCard } from "@/features/course/components/CourseCard";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { CategoryGrid, TopicChip, type CategoryItem } from "@/features/category/components/CategoryTiles";
import { ExpertCard } from "@/features/expert/components/ExpertCard";
import type { ExpertSummary } from "@/features/expert/types";
import { SUPPORT_EMAIL } from "@/components/layout/Footer";
import { LocaleLink } from "@/i18n/LocaleLink";
import { localeHref } from "@/i18n/href";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { isLocale, type Locale } from "@/i18n/config";
import type { CourseSummary } from "@/features/course/types";

// One minute: new courses and categories should appear promptly, and every
// figure on this page is a real count read from the catalogue.
export const revalidate = 60;

type Props = { params: Promise<{ lang: string }> };

/** The categories as the page shows them: localised, tinted, counted. */
function categoryItems(index: CatalogIndex, t: TFunction, locale: Locale): CategoryItem[] {
  return index.categories.map((c) => {
    const count = index.countByCategory[c.id] ?? 0;
    return {
      id: c.id,
      name: categoryLabel(c, t, locale),
      count,
      countLabel: t("ui.courseCount", { count }),
      style: categoryStyle(c),
      href: `/courses?categoryId=${c.id}`,
    };
  });
}

/** The subjects the hero offers as quick entries: these four when they exist, topped up by the busiest others. */
const HERO_SLUGS = ["data-ai", "information-technology", "engineering", "business-and-management"];

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const [index, newest, experts, expertIndex] = await Promise.all([
    getCatalogIndex(),
    // The API lists newest first when no sort is given.
    listCourses({ page: 0, size: 8 }).catch(() => null),
    listExpertsSource().catch(() => [] as ExpertSummary[]),
    // Experts are tinted by their own (real) categories, which the sample
    // catalogue's index does not have. The same index when both are real.
    indexFor(SHOWCASE_EXPERTS),
  ]);

  const labels = courseLabels(t, locale);
  const items = categoryItems(index, t, locale);
  const slugOf = new Map(index.categories.map((c) => [c.id, c.slug]));
  const heroTopics = [
    ...HERO_SLUGS.map((s) => items.find((i) => slugOf.get(i.id) === s)).filter((i): i is CategoryItem => !!i && i.count > 0),
    ...[...items].sort((a, b) => b.count - a.count).filter((i) => i.count > 0 && !HERO_SLUGS.includes(slugOf.get(i.id) ?? "")),
  ].slice(0, 4);
  const courses = newest?.content ?? [];
  const catFor = (c: CourseSummary) => {
    const cat = categoryOf(index, c.id);
    return cat ? { name: categoryLabel(cat, t, locale), style: categoryStyle(cat) } : null;
  };

  const facts: [string, string][] = [];
  if (index.total > 0) facts.push([String(index.total), t("home.statCourses")]);
  if (experts.length > 0) facts.push([String(experts.length), t("home.statTutors")]);
  facts.push([t("ui.free"), t("ui.allCourses")]);

  return (
    <>
      {/* ============ 1. HERO ============ */}
      <section className="pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-20" aria-labelledby="hero-title">
        <div className="wrap grid items-center gap-x-16 gap-y-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <h1 id="hero-title" className="d-xl max-w-[40rem]">
              {t("landing.heroLead")} {t("landing.heroMark")}
              {t("landing.heroEnd")}
            </h1>
            <p className="lead mt-5 max-w-[34rem]">{t("landing.heroSub")}</p>

            {/* A plain GET form to the catalogue, so it works before
                JavaScript loads. */}
            <form className="mt-8 max-w-[36rem]" role="search" action={localeHref(locale, "/courses")}>
              <label className="sr-only" htmlFor="hero-q">
                {t("ui.searchCourses")}
              </label>
              <div className="sfield lg">
                <Search className="i" aria-hidden />
                <input id="hero-q" name="q" type="search" placeholder={t("landing.searchPlaceholder")} autoComplete="off" />
                <button className="btn btn-primary" type="submit" aria-label={t("landing.searchSubmit")}>
                  <span className="t">{t("landing.searchSubmit")}</span>
                  <ArrowRight className="i i-arrow" aria-hidden />
                </button>
              </div>
            </form>

            {heroTopics.length ? (
              <div className="chip-row scroll mt-4" role="group" aria-label={t("landing.topics")}>
                {heroTopics.map((i) => (
                  <TopicChip key={i.id} item={i} small />
                ))}
              </div>
            ) : null}

            <dl className="facts-row mt-10 max-w-[36rem] border-t border-line pt-6 lg:mt-12">
              {facts.map(([value, label]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hidden lg:col-span-5 lg:block" aria-hidden>
            <div className="hero-mark aspect-square w-full">
              <Image src="/brand/aztu-mark-white.png" alt="" width={120} height={228} fetchPriority="high" />
              <p className="cap">
                <b>AzTU EduPlatform</b>
                {t("landing.kicker")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. CATEGORIES ============ */}
      {items.length ? (
        <section className="section !pt-0" id="categories" aria-labelledby="cat-title">
          <div className="wrap">
            <div className="s-head">
              <div>
                <h2 id="cat-title" className="d-lg">
                  {t("landing.categoriesTitle")}
                </h2>
                <p className="lead mt-3">{t("landing.categoriesSub")}</p>
              </div>
              <LocaleLink href="/categories" className="link">
                {t("landing.allCategories")} <ArrowRight className="i" aria-hidden />
              </LocaleLink>
            </div>
            <CategoryGrid items={items} max={8} emptyLabel={t("ui.noCoursesYet")} />
          </div>
        </section>
      ) : null}

      {/* ============ 3. NEW COURSES ============ */}
      <section className="section !pt-0" id="new" aria-labelledby="new-title">
        <div className="wrap">
          <div className="s-head">
            <h2 id="new-title" className="d-lg">
              {t("landing.newTitle")}
            </h2>
            {courses.length ? (
              <LocaleLink href="/courses" className="link">
                {t("ui.allCourses")} <ArrowRight className="i" aria-hidden />
              </LocaleLink>
            ) : null}
          </div>
          {courses.length ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} category={catFor(c)} labels={labels} resp />
              ))}
            </div>
          ) : (
            <p className="soft-empty text-ink-2">{t("landing.noCoursesYet")}</p>
          )}
        </div>
      </section>

      {/* ============ 4. HOW IT WORKS ============ */}
      <section className="section band" aria-labelledby="how-title">
        <div className="wrap">
          <div className="s-head">
            <div>
              <h2 id="how-title" className="d-lg">
                {t("landing.howTitle")}
              </h2>
              <p className="lead mt-3">{t("landing.howSub")}</p>
            </div>
          </div>
          <ol className="steps">
            {[1, 2, 3].map((n) => (
              <li key={n}>
                <span className="n" aria-hidden>
                  {String(n).padStart(2, "0")}
                </span>
                <h3>{t(`landing.step${n}Title`)}</h3>
                <p>{t(`landing.step${n}Text`)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 flex items-center gap-3 text-[15px] text-ink-2">
            <Award className="i shrink-0 text-ink-3" aria-hidden />
            {t("landing.certNote")}
          </p>
        </div>
      </section>

      {/* ============ 5. EXPERTS ============ */}
      {experts.length ? (
        <ExpertsSection experts={experts} index={expertIndex} t={t} locale={locale} />
      ) : null}

      {/* ============ 6. FAQ ============ */}
      <section className="section" aria-labelledby="faq-title">
        <div className="wrap grid gap-x-16 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="faq-title" className="d-lg">
              {t("landing.faqTitle")}
            </h2>
            <p className="lead mt-3">{t("landing.faqSub")}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="link mt-5">
              <Mail className="i" aria-hidden />
              {t("landing.writeUs")}
            </a>
          </div>
          <div className="border-t border-line lg:col-span-8">
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

      {/* ============ 7. CLOSING CALL TO ACTION ============ */}
      <section className="band-navy" aria-labelledby="cta-title">
        <div className="wrap grid items-center gap-8 py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-8">
            <h2 id="cta-title" className="d-lg">
              {t("landing.ctaTitle")}
            </h2>
            <p className="lead mt-3">{t("landing.ctaSub")}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
            <LocaleLink className="btn btn-primary btn-lg" href="/register">
              {t("landing.ctaRegister")} <ArrowRight className="i i-arrow" aria-hidden />
            </LocaleLink>
            <LocaleLink className="btn btn-ghost btn-lg" href="/courses">
              {t("landing.ctaBrowse")}
            </LocaleLink>
          </div>
        </div>
      </section>
    </>
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
  return (
    <section className="section" id="experts" aria-labelledby="ex-title">
      <div className="wrap">
        <div className="s-head">
          <div>
            <h2 id="ex-title" className="d-lg">
              {t("landing.expertsTitle")}
            </h2>
            <p className="lead mt-3">{t("landing.expertsSub")}</p>
          </div>
          <LocaleLink href="/experts" className="link">
            {t("landing.allExperts")} <ArrowRight className="i" aria-hidden />
          </LocaleLink>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {experts.slice(0, 4).map((e) => (
            <ExpertCard key={e.id} expert={e} k={categoryStyle(categoryOfExpert(index, e)).k} t={t} locale={locale} />
          ))}
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink-2">
          <span>
            <b className="font-semibold text-ink">{t("landing.shareTitle")}.</b> {t("landing.shareText")}
          </span>
          <LocaleLink href="/register/tutor" className="link">
            {t("landing.shareCta")} <ArrowRight className="i" aria-hidden />
          </LocaleLink>
        </p>
      </div>
    </section>
  );
}

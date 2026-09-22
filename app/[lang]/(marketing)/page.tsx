import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { categoryDescription } from "@/features/category/label";
import { toCategoryRef } from "@/features/category/style";
import { CategoryIndexList } from "@/features/category/components/CategoryIndex";
import { finderMatrix } from "@/features/course/catalog";
import { PAYMENTS_ENABLED } from "@/features/course/payments";
import { FeatureCourse } from "@/features/course/components/FeatureCourse";
import { IndexList, IndexRow } from "@/features/course/components/IndexRow";
import { ExpertSpread, expertCategory } from "@/features/expert/components/ExpertSpread";
import type { ExpertSummary } from "@/features/expert/types";
import { Shield } from "@/components/layout/AztuMark";
import { Dept } from "@/components/editorial/Dept";
import { Highlight } from "@/components/editorial/Highlight";
import { Kicker } from "@/components/editorial/Kicker";
import { FAQ } from "@/components/common/FAQ";
import { LinkGo } from "@/components/ui/link-go";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/motion";
import { Hero, HeroQuickChips, HeroUpdated } from "@/components/marketing/Hero";
import { Ticker } from "@/components/marketing/Ticker";
import { CourseFinder } from "@/components/marketing/CourseFinder";
import { FormatDiptych } from "@/components/marketing/FormatDiptych";
import { ContributorsWall } from "@/components/marketing/ContributorsWall";
import { Steps } from "@/components/marketing/Steps";
import { Shelf } from "@/components/marketing/Shelf";
import { SignedOutSwap } from "@/components/marketing/SignedOutSwap";
import {
  courseCategory,
  loadHome,
  loadProfile,
  loadStats,
  renderTime,
  sectionNumber,
  topCourseOf,
} from "@/components/marketing/HomeData";

// One minute, not five. The landing page shows the category tiles and featured
// courses, and five minutes of staleness made adding either look broken.
export const revalidate = 60;

/** The same inbox the footer's "Əlaqə" link writes to. */
const SUPPORT_EMAIL = "support@aztu.edu.az";

type Props = { params: Promise<{ lang: string }> };

/**
 * The landing page, "Campus Editorial": masthead, 01 new courses (cover story
 * + numbered index), the ticker, 02 the navy finder spread with the format
 * diptych, 03 the fields index, 04 the experts, 05 how it works, 06 FAQ and
 * the closing shelf.
 *
 * The masthead renders at once; every section below is an async component
 * under <Suspense> that awaits only its own slice of `loadHome()`, so the
 * page streams top to bottom as the API answers. Department numbers are
 * computed from the sections that actually render (HomeData.sectionNumber).
 */
export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  // Start every read now, in parallel; the sections pick up the promises.
  loadHome();

  return (
    <>
      <Hero
        locale={locale}
        updated={
          <Suspense fallback={null}>
            <HeroUpdated locale={locale} />
          </Suspense>
        }
        quick={
          <Suspense fallback={null}>
            <HeroQuickChips locale={locale} />
          </Suspense>
        }
      />
      <Suspense fallback={<Hold className="h-[1400px] lg:h-[1100px]" />}>
        <NewCourses locale={locale} />
      </Suspense>
      <Suspense fallback={<Hold className="h-[52px]" />}>
        <TickerBand locale={locale} />
      </Suspense>
      <Suspense fallback={<Hold className="h-[1700px] bg-spread" />}>
        <FinderSpread locale={locale} />
      </Suspense>
      <Suspense fallback={<Hold className="h-[1000px]" />}>
        <FieldsSection locale={locale} />
      </Suspense>
      <Suspense fallback={<Hold className="h-[900px] bg-paper-2" />}>
        <ExpertsSection locale={locale} />
      </Suspense>
      <Suspense fallback={<Hold className="h-[800px]" />}>
        <HowSection locale={locale} />
      </Suspense>
      <Suspense fallback={<Hold className="h-[800px]" />}>
        <FaqSection locale={locale} />
      </Suspense>
      <Suspense fallback={<Hold className="h-[560px]" />}>
        <Closing locale={locale} />
      </Suspense>
    </>
  );
}

/** A section's reserved space while it streams: empty on purpose, no shimmer. */
function Hold({ className }: { className?: string }) {
  return <div aria-hidden="true" className={className} />;
}

/* ------------------------------------------------------------------ */
/*  01 · New courses: the cover story and the latest additions         */
/* ------------------------------------------------------------------ */

async function NewCourses({ locale }: { locale: Locale }) {
  const home = loadHome();
  const [latest, index, all, number] = await Promise.all([
    home.latest,
    home.index,
    home.all,
    sectionNumber("new"),
  ]);
  const courses = latest?.content ?? [];
  if (!number || !courses.length) return null;

  const t = await getT(locale);
  const now = renderTime();
  const [lead, ...rest] = courses;
  // The byline's title and photo; a failed profile leaves the name alone.
  const profile = lead.tutorId ? await loadProfile(lead.tutorId) : null;
  const expert = {
    name: lead.tutorDisplayName,
    title: profile?.academicTitle ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
  };
  const total = all?.total ?? latest?.totalElements ?? courses.length;
  const catalogue = localeHref(locale, "/courses");
  const solo = courses.length === 1;

  return (
    <section className="wrap pt-14 pb-(--section-y)" aria-labelledby="home-new">
      <Dept
        number={number}
        label={t("home.newCourses")}
        id="home-new"
        aside={
          solo ? null : (
            <LinkGo href={catalogue} className="t-small">
              {t("home.allCoursesN", { n: formatNumber(total, locale) })}
            </LinkGo>
          )
        }
      />
      {solo ? (
        // One course: the cover story as a spread, then a line that says the
        // catalogue has just opened and an invitation to experts.
        <div className="mt-6 lg:mt-8">
          <FeatureCourse
            course={lead}
            category={courseCategory(index, lead.id, t, locale)}
            expert={expert}
            locale={locale}
            now={now}
            layout="spread"
            cta={{ href: localeHref(locale, `/courses/${lead.slug}`), label: t("ui.viewCourse") }}
            priority
          />
          <Reveal className="g12 mt-12 items-baseline gap-y-4 border-t border-line pt-8">
            <p className="t-title-l col-span-4 md:col-span-5 lg:col-span-7">{t("home.soloNote")}</p>
            <p className="t-body col-span-4 md:col-span-3 lg:col-span-4 lg:col-start-9">
              {t("home.soloInvite")}{" "}
              <LinkGo href={localeHref(locale, "/register/tutor")}>{t("home.applyAsExpert")}</LinkGo>
            </p>
          </Reveal>
        </div>
      ) : (
        <div className="g12 mt-6 gap-y-12 lg:mt-8">
          {/* 1024–1279 gives the index five columns, where four would squeeze
              the titles; from 1280 it is the prototype's 1–7 + 9–12. */}
          <div className="col-span-4 md:col-span-8 lg:col-span-7">
            <FeatureCourse
              course={lead}
              category={courseCategory(index, lead.id, t, locale)}
              expert={expert}
              locale={locale}
              now={now}
              layout="stack"
              priority
            />
          </div>
          <Reveal className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8 xl:col-span-4 xl:col-start-9">
            <Kicker className="mb-3">{t("home.latestAdditions")}</Kicker>
            <IndexList locale={locale} compact>
              {rest.slice(0, 6).map((c, i) => (
                <IndexRow
                  key={c.id}
                  course={c}
                  category={courseCategory(index, c.id, t, locale)}
                  locale={locale}
                  number={i + 2}
                  compact
                  // Phones and tablets list four; the desktop column has room for six.
                  className={i > 3 ? "hidden lg:block" : undefined}
                />
              ))}
            </IndexList>
            <Link href={catalogue} className={cn(buttonVariants({ variant: "outline" }), "mt-8 w-full")}>
              {t("ui.goToCatalogue")}
              <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
            </Link>
          </Reveal>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  The ticker: short statements, each included only while it is true  */
/* ------------------------------------------------------------------ */

async function TickerBand({ locale }: { locale: Locale }) {
  const [stats, experts] = await Promise.all([loadStats(), loadHome().experts]);
  const t = await getT(locale);
  const items = [
    stats?.allFree && !PAYMENTS_ENABLED ? t("home.tickerFree") : null,
    stats && stats.byType.ONLINE > 0 ? t("home.tickerOnline") : null,
    stats && stats.byType.OFFLINE > 0 ? t("home.tickerOffline") : null,
    experts.length ? t("home.tickerExperts") : null,
    t("home.tickerProgress"),
    // The interface itself is bilingual, so this one always holds.
    t("home.tickerLanguages"),
  ].filter((item): item is string => Boolean(item));

  return <Ticker items={items} label={t("home.tickerLabel")} pauseLabel={t("home.tickerPause")} />;
}

/* ------------------------------------------------------------------ */
/*  02 · The navy spread: the finder sentence and the format diptych   */
/* ------------------------------------------------------------------ */

async function FinderSpread({ locale }: { locale: Locale }) {
  const home = loadHome();
  const [index, all, stats, number] = await Promise.all([home.index, home.all, loadStats(), sectionNumber("find")]);
  if (!number) return null;
  const t = await getT(locale);

  // Only fields that have courses, phrased for the sentence. Azerbaijani
  // lower-cases the name here on the server ("İnformasiya" → "informasiya"),
  // where the az case rules are available; the browser may not have them.
  const categories = (index?.entries ?? [])
    .filter((e) => (e.count ?? 0) > 0)
    .map((e) => {
      const name = toCategoryRef(e.category, t, locale).name;
      return {
        value: e.category.id,
        label: t("home.finderCategory", { name: locale === "az" ? name.toLocaleLowerCase("az") : name }),
      };
    });
  // A capped walk would give partial counts, so then the button shows none.
  const matrix = all?.complete ? finderMatrix(all.courses, index?.courseCats ?? new Map()) : null;

  return (
    <section
      className="relative isolate overflow-hidden bg-spread text-spread-ink [&_:focus-visible]:outline-gold"
      aria-labelledby="home-find"
    >
      {/* On desktop the shield is taller than the spread and only its right side
          is cropped. Below lg the spread grows past 1800px and at 118% the shield
          would outgrow the viewport, leaving only its straight edges as bands
          across the text, so there it is sized to the screen and shown whole. */}
      <Shield className="pointer-events-none absolute -top-[6%] -right-[4%] -z-10 h-[118%] w-auto text-spread-ink opacity-[0.035] max-lg:top-12 max-lg:-right-10 max-lg:h-[min(560px,120vw)]" />
      <div className="wrap section">
        <Dept
          tone="spread"
          number={number}
          label={t("home.findLabel")}
          id="home-find"
          aside={
            <Kicker as="span" className="hidden text-spread-2 md:inline">
              {t("home.findAxes")}
            </Kicker>
          }
        />
        <CourseFinder action={localeHref(locale, "/courses")} categories={categories} matrix={matrix} />
        <hr className="mt-16 border-0 border-t border-spread-line lg:mt-24" />
        <FormatDiptych
          locale={locale}
          online={stats ? stats.byType.ONLINE : null}
          offline={stats ? stats.byType.OFFLINE : null}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  03 · Fields: the numbered category index with real counts          */
/* ------------------------------------------------------------------ */

async function FieldsSection({ locale }: { locale: Locale }) {
  const home = loadHome();
  const [categories, index, all, number] = await Promise.all([
    home.categories,
    home.index,
    home.all,
    sectionNumber("fields"),
  ]);
  if (!number) return null;
  const t = await getT(locale);

  // With the index, every row knows its count (0 → a muted tag, never a
  // link, D6). Without it the counts are unknown and every field stays a link.
  const entries = index
    ? index.entries.map((e) => ({
        ref: toCategoryRef(e.category, t, locale),
        count: e.count,
        description: categoryDescription(e.category, locale),
        latestTitle: e.latest?.title ?? null,
      }))
    : categories
        .filter((c) => c.active !== false)
        .map((c) => ({ ref: toCategoryRef(c, t, locale), count: null, description: categoryDescription(c, locale) }));
  const populated = entries.filter((e) => (e.count ?? 0) > 0).length;
  const total = all?.total ?? null;

  return (
    <section id="categories" className="wrap section" aria-labelledby="home-fields">
      <Dept
        as="span"
        number={number}
        label={t("ui.fields")}
        aside={
          populated && total ? (
            <Kicker as="span">
              {t("home.fieldsCount", {
                fields: formatNumber(populated, locale),
                courses: formatNumber(total, locale),
                f: populated,
                c: total,
              })}
            </Kicker>
          ) : null
        }
      />
      <Reveal className="g12 mt-8 items-end gap-y-5 lg:mt-10">
        <h2 id="home-fields" className="t-display-l col-span-4 md:col-span-8 lg:col-span-7">
          {t("home.fieldsTitle")}
        </h2>
        <p className="t-body col-span-4 md:col-span-6 lg:col-span-4 lg:col-start-9">{t("home.fieldsDek")}</p>
      </Reveal>
      <CategoryIndexList
        className="mt-10 lg:mt-14"
        entries={entries}
        locale={locale}
        hrefFor={(ref) => localeHref(locale, `/courses?categoryId=${ref.id}`)}
        numbered
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  04 · Experts: the one-expert spread, or the contributors wall      */
/* ------------------------------------------------------------------ */

async function ExpertsSection({ locale }: { locale: Locale }) {
  const home = loadHome();
  const [experts, index, all, number] = await Promise.all([
    home.experts,
    home.index,
    home.all,
    sectionNumber("experts"),
  ]);
  if (!number || !experts.length) return null;
  const t = await getT(locale);
  const courses = all?.courses ?? [];
  const colourOf = (e: ExpertSummary) => expertCategory(e, index, topCourseOf(e.id, courses), t, locale);
  const solo = experts.length === 1;
  // The bio lives only on the profile; the spread needs it for its one expert.
  const bio = solo ? (await loadProfile(experts[0].id))?.bio : null;

  return (
    <section id="experts" className="section bg-paper-2" aria-labelledby="home-experts">
      <div className="wrap">
        <Dept
          as="span"
          number={number}
          label={t("nav.experts")}
          aside={
            solo ? null : (
              <LinkGo href={localeHref(locale, "/experts")} className="t-small">
                {t("home.allExpertsN", { n: formatNumber(experts.length, locale) })}
              </LinkGo>
            )
          }
        />
        {solo ? (
          <ExpertSpread
            className="mt-10 lg:mt-14"
            expert={experts[0]}
            bio={bio}
            category={colourOf(experts[0])}
            locale={locale}
            kicker={t("home.whoTeaches")}
            headingId="home-experts"
            invite
          />
        ) : (
          <ContributorsWall locale={locale} experts={experts} colourOf={colourOf} headingId="home-experts" />
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  05 · How it works · 06 · FAQ                                       */
/* ------------------------------------------------------------------ */

async function HowSection({ locale }: { locale: Locale }) {
  const number = await sectionNumber("how");
  return number ? <Steps locale={locale} number={number} /> : null;
}

async function FaqSection({ locale }: { locale: Locale }) {
  const [number, stats] = await Promise.all([sectionNumber("faq"), loadStats()]);
  if (!number) return null;
  const t = await getT(locale);
  // "Every course is free" only while that is so: payments off and nothing
  // paid in the catalogue (an unknown catalogue counts as free, because with
  // payments off the API serves free courses only).
  const free = !PAYMENTS_ENABLED && (stats?.allFree ?? true);
  const items = [1, 2, 3, 4, 5].map((i) => ({
    q: t(`home.faq${i}Q`),
    a: t(i === 2 && !free ? "home.faq2APaid" : `home.faq${i}A`),
  }));

  return (
    <section className="wrap pb-(--section-y)" aria-labelledby="home-faq">
      <Dept as="span" number={number} label={t("home.faqLabel")} />
      <div className="g12 mt-8 gap-y-8 lg:mt-10">
        <div className="col-span-4 md:col-span-8 lg:col-span-4">
          <Reveal className="lg:sticky lg:top-[calc(var(--hdr)+40px)]">
            <h2 id="home-faq" className="t-display-m">
              {t("home.faqTitle")}
            </h2>
            <p className="t-body mt-4 max-w-[34ch]">{t("home.faqDesc")}</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="link-go mt-4">
              <Mail aria-hidden="true" strokeWidth={1.75} />
              {SUPPORT_EMAIL}
            </a>
          </Reveal>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-6">
          <FAQ items={items} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Closing: the call to action and the shelf of fields                */
/* ------------------------------------------------------------------ */

async function Closing({ locale }: { locale: Locale }) {
  const index = await loadHome().index;
  const t = await getT(locale);
  const spines = (index?.entries ?? [])
    .filter((e) => (e.count ?? 0) > 0)
    .map((e) => ({ ref: toCategoryRef(e.category, t, locale), count: e.count ?? 0 }));
  const browse = (
    <Link href={localeHref(locale, "/courses")} className={buttonVariants({ variant: "outline", size: "lg" })}>
      {t("ui.browseCatalogue")}
    </Link>
  );

  return (
    <section className="border-t border-line-strong" aria-labelledby="home-end">
      <div className="wrap py-20 lg:py-28">
        <div className="g12 items-center gap-y-12">
          {/* Without a shelf the words take the width it would have used. */}
          <Reveal className={cn("col-span-4 md:col-span-8", spines.length ? "lg:col-span-6" : "lg:col-span-8")}>
            <h2 id="home-end" className="t-display-xl">
              {t("home.ctaTitleA")} <Highlight>{t("home.ctaTitleEmph")}</Highlight>
            </h2>
            {/* Signed in, the invitation to create an account becomes the way back to the courses. */}
            <SignedOutSwap
              signedIn={
                <>
                  <p className="t-lead mt-6 max-w-[40ch]">{t("home.ctaDescSignedIn")}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link href={localeHref(locale, "/my-courses")} className={buttonVariants({ size: "lg" })}>
                      {t("home.goMyCourses")}
                      <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
                    </Link>
                    {browse}
                  </div>
                </>
              }
            >
              <p className="t-lead mt-6 max-w-[40ch]">{t("home.ctaDesc")}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={localeHref(locale, "/register")} className={buttonVariants({ size: "lg" })}>
                  {t("common.signUp")}
                  <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
                </Link>
                {browse}
              </div>
            </SignedOutSwap>
          </Reveal>
          {spines.length ? (
            <Reveal className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8">
              <Shelf locale={locale} items={spines} />
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

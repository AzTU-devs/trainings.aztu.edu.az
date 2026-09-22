import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tag } from "@/components/ui/badge";
import { CategoryChip } from "@/components/ui/chip";
import { LinkGo } from "@/components/ui/link-go";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { BlankPlate } from "@/components/editorial/BlankPlate";
import { Dept } from "@/components/editorial/Dept";
import { Kicker } from "@/components/editorial/Kicker";
import { SecHead } from "@/components/editorial/SecHead";
import type { Category } from "@/features/category/types";
import { catAttrs, toCategoryRef } from "@/features/category/style";
import { getCategoryIndex, type CategoryIndex } from "@/features/course/catalog.server";
import { isLong } from "@/features/course/catalog";
import { PosterGrid } from "@/features/course/components/PosterCard";
import { splitDescription } from "@/features/course/components/detail/CourseSections";
import { CourseToc } from "@/features/course/components/detail/CourseToc";
import { expertServerApi } from "@/features/expert/api.server";
import { coursesByExpert } from "@/features/expert/directory.server";
import { ExpertPortrait } from "@/features/expert/components/ExpertAvatar";
import { expertBadges, expertCategory } from "@/features/expert/components/ExpertSpread";
import { externalHref, orcidHref } from "@/features/expert/links";
import { fullExpertName, type ExpertProfile } from "@/features/expert/types";
import { getT } from "@/i18n/server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils/cn";
import { formatNumber, formatRating } from "@/lib/utils/format";
import type { ApiError } from "@/types/api";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; id: string }> };

/**
 * Category names for the expertise chips and the poster colours, cached for
 * this page's own 300s.
 * Read here rather than through `categoryServerApi.list()`, which is
 * deliberately uncached (a new category must appear in the catalogue at
 * once): an uncached fetch would turn this ISR page into a render per request
 * just to label a few chips. A category that shows up here a few minutes late
 * costs nothing. A failure only hides the chips and leaves the posters navy.
 */
function categoriesForExpertise(): Promise<Category[]> {
  return serverFetch<Category[]>(endpoints.public.categories, {
    revalidate: 300,
    tags: ["categories:list"],
  }).catch((): Category[] => []);
}

/**
 * The category index at this page's 300s, for the posters' colours (the same
 * art as everywhere else) and to tell an empty expertise category from a
 * populated one. A failure only costs the colours.
 */
async function loadIndex(categories: Category[]): Promise<CategoryIndex | null> {
  if (!categories.length) return null;
  return getCategoryIndex(categories, { revalidate: 300 }).catch(() => null);
}

/** Education and certifications are stored one entry per line; list markers people type are dropped. */
function itemsOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•–·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

/**
 * Languages are free text ("Azərbaycan dili, İngilis dili"), split on the
 * separators people actually type to show one badge per language.
 */
function listOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return [
    ...new Set(
      text
        .split(/[,;\n/]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * The server render time for the posters' "Yeni" badge (D17), taken once per
 * render and passed down, never read in a client component. A function so the
 * page body stays pure in the linter's eyes: an ISR page is rendered once per
 * revalidation, which is exactly the instant "new" should be measured from.
 */
function renderTime(): number {
  return Date.now();
}

/**
 * "Institution — degree (year)": the part before the first dash is set as
 * the entry's title. Free text, so an entry without a dash stays one line.
 */
function EntryText({ text }: { text: string }) {
  const m = /^(.+?)\s+[—–-]\s+(.+)$/.exec(text);
  if (!m) return <span>{text}</span>;
  return (
    <span>
      <span className="block font-semibold text-ink">{m[1]}</span>
      <span className="mt-0.5 block text-[0.9375rem] text-ink-2">{m[2]}</span>
    </span>
  );
}

/**
 * The profile, or why there is none. The public endpoint answers 404 for an
 * unknown id and for an expert who is not approved, and 400 for an id that is
 * not a UUID: all three are "missing". Anything else means the API could not
 * answer, which is not the same as "no such expert", so the page says so
 * differently. Both get an in-page notice with a normal 200 response, as they
 * always have: the status of a public route is part of its contract (and ISR
 * would cache a 404 for the whole revalidate period).
 */
async function loadProfile(id: string): Promise<ExpertProfile | "missing" | "unavailable"> {
  try {
    const profile = await expertServerApi.byId(id);
    return profile.approvalStatus === "APPROVED" ? profile : "missing";
  } catch (err) {
    const status = (err as ApiError | null)?.status;
    return status === 404 || status === 400 ? "missing" : "unavailable";
  }
}

/**
 * Profile text (the department) is written in Azerbaijani whatever the UI
 * language, and a kicker uppercases it in CSS, which follows the element's
 * `lang`: on /en "təhlükəsizliyi" would come out "TƏHLÜKƏSIZLIYI", with a
 * dotless I. Text carrying an Azerbaijani letter is marked `lang="az"` so the
 * browser applies the i → İ mapping; anything else keeps the page language.
 */
function textLang(text: string): "az" | undefined {
  return /[əƏıİğĞşŞçÇöÖüÜ]/.test(text) ? "az" : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  // The same verdict as the page body (the fetch is deduplicated). Without a
  // profile the tab reads the generic "Expert", as it always has.
  const expert = await loadProfile(id);
  if (typeof expert === "string") {
    const t = await getT(isLocale(lang) ? lang : defaultLocale);
    return { title: t("experts.metaFallback") };
  }
  const affiliation = [expert.academicTitle, expert.department]
    .filter(Boolean)
    .join(", ");
  return {
    title: fullExpertName(expert),
    description:
      expert.headline ||
      affiliation ||
      expert.bio?.slice(0, 160) ||
      undefined,
  };
}

export default async function PublicExpertPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // Profile and catalogue are independent: neither waits for the other.
  // The category index (poster colours) follows the category list without
  // waiting for the profile.
  const [expert, courses, { categories, index }] = await Promise.all([
    loadProfile(id),
    coursesByExpert(id),
    categoriesForExpertise().then(async (categories) => ({ categories, index: await loadIndex(categories) })),
  ]);

  if (typeof expert === "string") {
    const missing = expert === "missing";
    return (
      <section className="wrap pb-(--section-y) pt-6 lg:pt-8">
        <div className="-my-1.5">
          <Breadcrumbs
            items={[
              { label: t("common.home"), href: localeHref(locale, "/") },
              { label: t("nav.experts"), href: localeHref(locale, "/experts") },
              { label: t("experts.profileEyebrow") },
            ]}
          />
        </div>
        {/* The empty-state layout, with the title as the page's h1. The
            response is a 200 either way, so the plate never says "404". */}
        <div className="g12 mt-8 gap-y-8 border-t border-line-strong pt-8 lg:mt-10">
          <BlankPlate
            label={missing ? t("experts.notFoundTitle") : t("errors.errorKicker")}
            className="col-span-4 max-md:aspect-[5/2] md:col-span-3 lg:col-span-4"
          />
          <div className="col-span-4 self-center md:col-span-5 lg:col-span-7 lg:col-start-6">
            <Kicker>{t("experts.profileEyebrow")}</Kicker>
            <h1 className="t-display-m mt-3">
              {missing ? t("experts.notFoundTitle") : t("experts.unavailableTitle")}
            </h1>
            <p className="t-body mt-3 max-w-[52ch]">
              {missing ? t("experts.notFoundHint") : t("experts.unavailableHint")}
            </p>
            <div className="mt-6">
              <Link href={localeHref(locale, "/experts")} className={buttonVariants({ variant: "outline" })}>
                <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
                {t("experts.backToExperts")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const name = fullExpertName(expert);
  // coursesByExpert sorts by enrolment, so the first is the expert's top course.
  const category = expertCategory(expert, index, courses[0]?.id, t, locale);

  // Figures from the published catalogue, which the profile does not carry,
  // aggregated the way the directory does it: participants are enrolments
  // summed over the expert's courses, and the rating is weighted by how many
  // people rated each course.
  const participants = courses.reduce((n, c) => n + (c.enrolledCount ?? 0), 0);
  let ratingSum = 0;
  let ratingCount = 0;
  for (const c of courses) {
    const avg = Number(c.ratingAvg);
    if (Number.isFinite(avg) && c.ratingCount > 0) {
      ratingSum += avg * c.ratingCount;
      ratingCount += c.ratingCount;
    }
  }

  const department = expert.department?.trim() || "";
  const headline = expert.headline?.trim() || "";
  const badges = [...expertBadges(expert, t), ...listOf(expert.languages)];
  const links = [
    { href: externalHref(expert.googleScholarUrl), label: t("experts.googleScholar") },
    { href: externalHref(expert.researchGateUrl), label: t("experts.researchGate") },
    { href: orcidHref(expert.orcid), label: t("experts.orcid") },
    { href: externalHref(expert.githubUrl), label: t("experts.github") },
    { href: externalHref(expert.linkedinUrl), label: t("experts.linkedin") },
    { href: externalHref(expert.websiteUrl), label: t("experts.website") },
  ].filter((l): l is { href: string; label: string } => l.href !== null);

  const stats: { label: string; value: string; sub?: string; words?: boolean }[] = [
    { label: t("experts.statCourses"), value: formatNumber(courses.length, locale) },
    participants > 0
      ? { label: t("experts.statParticipants"), value: formatNumber(participants, locale) }
      : { label: t("experts.statParticipants"), value: t("ui.noParticipants"), words: true },
  ];
  if (ratingCount > 0) {
    stats.push({
      label: t("experts.statRating"),
      value: formatRating(ratingSum / ratingCount, locale),
      sub: t("experts.ratingCount", { n: formatNumber(ratingCount, locale), count: ratingCount }),
    });
  }

  // ---- Article sections: an empty field drops its section, and the numbers
  // are counted from what renders, so a missing one never leaves a gap.
  // The bio takes the course description's standfirst rule (one shared
  // helper, so the two pages cannot drift apart): a 60–220 character opening
  // sentence is set in the display face and the rest continues as body text.
  // A bio that only repeats the headline (as a quick sign-up leaves it) would
  // print the same line twice.
  const bio = expert.bio?.trim() ?? "";
  const about = bio.toLowerCase() === headline.toLowerCase() ? splitDescription(null) : splitDescription(bio);
  const education = itemsOf(expert.education);
  const certifications = itemsOf(expert.certifications);
  const countOf = new Map(index?.entries.map((e) => [e.category.id, e.count]) ?? []);
  const areas = expert.expertiseCategoryIds.flatMap((cid) => {
    const c = categories.find((x) => x.id === cid && x.active !== false);
    return c ? [{ ref: toCategoryRef(c, t, locale), count: countOf.get(c.id) }] : [];
  });

  const sections: { id: string; title: string; body: ReactNode }[] = [];
  if (about.standfirst || about.paras.length) {
    sections.push({
      id: "about",
      title: t("experts.about"),
      body: (
        <div className="prose">
          {about.standfirst ? <p className="standfirst">{about.standfirst}</p> : null}
          {about.paras.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      ),
    });
  }
  if (education.length) {
    sections.push({
      id: "education",
      title: t("experts.education"),
      body: (
        <ol className="olist">
          {education.map((line, i) => (
            <li key={i}>
              <EntryText text={line} />
            </li>
          ))}
        </ol>
      ),
    });
  }
  if (certifications.length) {
    sections.push({
      id: "certifications",
      title: t("experts.certifications"),
      body: (
        <ol className="olist">
          {certifications.map((line, i) => (
            <li key={i}>
              <EntryText text={line} />
            </li>
          ))}
        </ol>
      ),
    });
  }
  if (areas.length) {
    sections.push({
      id: "expertise",
      title: t("experts.expertise"),
      body: (
        <ul className="flex flex-wrap gap-2.5">
          {areas.map(({ ref, count }) => (
            <li key={ref.id} className="min-w-0 max-w-full">
              {/* A category with no published course is not a link (D6):
                  it would open an empty catalogue. */}
              <CategoryChip
                href={localeHref(locale, `/courses?categoryId=${ref.id}`)}
                category={ref}
                label={ref.name}
                disabled={count === 0}
              />
            </li>
          ))}
        </ul>
      ),
    });
  }
  const num = (i: number) => String(i + 1).padStart(2, "0");
  const now = renderTime();
  const posters = courses.map((course) => {
    const primary = index?.primaryOf(course.id) ?? null;
    return { course, category: primary ? toCategoryRef(primary, t, locale) : null };
  });

  return (
    <div {...catAttrs(category)}>
      {/* ---- Title page: portrait 1–4, name and facts 6–12 --------------- */}
      <section className="wrap pt-6 lg:pt-8">
        {/* -my-1.5 cancels the crumbs' tap padding, and the grid starts at
            the catalogue head's mt-8/10, so crumbs, kicker and h1 sit at the
            same heights as on /courses and /experts. */}
        <div className="-my-1.5">
          <Breadcrumbs
            items={[
              { label: t("common.home"), href: localeHref(locale, "/") },
              { label: t("nav.experts"), href: localeHref(locale, "/experts") },
              { label: name },
            ]}
          />
        </div>
        <div className="g12 mt-8 gap-y-8 lg:mt-10">
          {/* Below lg this column dissolves (`contents`) so its parts can sit
              around the portrait: name first, then the portrait beside the
              figures, then the links. At lg it is one column whose figures
              drop to the portrait's baseline. */}
          <div className="contents lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:flex lg:flex-col">
            <div className="col-span-4 row-start-1 min-w-0 md:col-span-8">
              {/* `flex`, not the swatch's inline-flex: an inline kicker sits in a
                  17px line box and pushes the h1 7px below the catalogue's. */}
              <Kicker tone={category ? "cat" : "ink-3"} className="flex">
                {department ? (
                  <span lang={textLang(department)} className="min-w-0 [overflow-wrap:anywhere]">
                    {department}
                  </span>
                ) : (
                  t("experts.profileEyebrow")
                )}
              </Kicker>
              <h1 className={cn("t-display-xl mt-4", isLong(name) && "is-long")}>{name}</h1>
              {headline ? <p className="t-lead mt-5 max-w-[46ch]">{headline}</p> : null}
              {badges.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <Tag key={b} variant="case">
                      {b}
                    </Tag>
                  ))}
                </div>
              ) : null}
            </div>
            <dl className="col-span-2 col-start-3 row-start-2 grid content-center gap-y-5 md:col-span-5 md:col-start-4 md:flex md:flex-wrap md:content-start md:gap-x-12 md:self-end md:border-t md:border-line md:pt-5 lg:mt-auto lg:self-auto lg:pt-6">
              {stats.map((s) => (
                <div key={s.label} className="min-w-0">
                  <dt className="t-kicker text-ink-3">{s.label}</dt>
                  <dd
                    className={cn(
                      "mt-1 font-semibold text-ink",
                      s.words ? "text-base leading-snug text-ink-2" : "text-2xl leading-tight lg:text-[1.75rem]",
                    )}
                  >
                    {s.value}
                    {s.sub ? <span className="ml-1.5 text-sm font-normal text-ink-3">{s.sub}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            {links.length ? (
              <div className="col-span-4 row-start-3 md:col-span-8 lg:mt-8">
                <Kicker>{t("experts.links")}</Kicker>
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  {links.map((l) => (
                    <li key={l.label}>
                      <LinkGo href={l.href} external className="t-small">
                        {l.label}
                      </LinkGo>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="col-span-2 col-start-1 row-start-2 md:col-span-3 lg:col-span-4 lg:row-start-1">
            <ExpertPortrait
              name={name}
              avatarUrl={expert.avatarUrl}
              category={category}
              alt
              priority
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 38vw, 440px"
            />
          </div>
        </div>
      </section>

      {/* ---- Article: numbered sections 1–7, the course rail 9–12 -------- */}
      {sections.length ? (
        <div className="wrap section g12 gap-y-16">
          <div className="col-span-4 min-w-0 space-y-16 md:col-span-8 lg:col-span-7 lg:space-y-20">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                aria-labelledby={`${s.id}-h`}
                className="scroll-mt-[calc(var(--hdr)+24px)]"
              >
                <SecHead number={num(i)} title={s.title} id={`${s.id}-h`} />
                <div className="mt-8">{s.body}</div>
              </section>
            ))}
          </div>
          {/* The rail is a shortcut past a long article; beside a single
              short section the courses already follow on screen. It holds
              the course count (the posters themselves come next, so no
              titles here) and the same "on this page" list as a course. */}
          {sections.length > 1 ? (
            <aside
              aria-label={courses.length ? t("experts.coursesDept") : t("experts.onThisPage")}
              className="hidden lg:col-span-4 lg:col-start-9 lg:block"
            >
              <div className="sticky top-[calc(var(--hdr)+2rem)]">
                {courses.length ? (
                  <div className="rounded-card border border-line bg-card p-6">
                    <Kicker>{t("experts.coursesDept")}</Kicker>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <p className="t-display-l t-num">{formatNumber(courses.length, locale)}</p>
                      <LinkGo href="#courses" className="t-small mb-1.5">
                        {t("experts.toCourses")}
                      </LinkGo>
                    </div>
                  </div>
                ) : null}
                <CourseToc
                  items={sections.map((s, i) => ({ id: s.id, title: s.title, number: num(i) }))}
                  label={t("experts.onThisPage")}
                  className={courses.length ? "mt-8" : undefined}
                />
              </div>
            </aside>
          ) : null}
        </div>
      ) : null}

      {/* ---- Courses ----------------------------------------------------- */}
      <section
        id="courses"
        aria-labelledby="courses-h"
        className={cn("wrap pb-(--section-y)", sections.length ? "pt-0" : "pt-(--section-y)")}
      >
        <Dept
          number={num(sections.length)}
          id="courses-h"
          label={t("experts.coursesDept")}
          aside={
            courses.length ? (
              <Kicker as="span" className="text-ink-2">
                {t("ui.courseCount", { n: formatNumber(courses.length, locale), count: courses.length })}
              </Kicker>
            ) : null
          }
        />
        {courses.length ? (
          <PosterGrid className="mt-10 lg:mt-14" items={posters} locale={locale} now={now} cols={courses.length === 2 ? 2 : 3} />
        ) : (
          <EmptyState
            compact
            plate={t("ui.courseCount", { n: formatNumber(0, locale), count: 0 })}
            className="mt-8 border-t-0 pt-0"
            title={t("experts.noCourses")}
            description={t("experts.noCoursesHint")}
            action={<LinkGo href={localeHref(locale, "/courses")}>{t("ui.browseCatalogue")}</LinkGo>}
          />
        )}
      </section>
    </div>
  );
}

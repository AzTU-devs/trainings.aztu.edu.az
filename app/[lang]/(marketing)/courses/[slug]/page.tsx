import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CurriculumAccordion } from "@/features/course/components/CurriculumAccordion";
import type { EnrollTarget } from "@/features/course/components/EnrollCta";
import { ReviewsSection } from "@/features/review/components/ReviewsSection";
import { CourseTitlePage, type CourseTutor } from "@/features/course/components/detail/CourseTitlePage";
import type { SpecFact } from "@/features/course/components/detail/SpecStrip";
import {
  AboutCourse,
  CourseArticle,
  OutcomesList,
  RequirementsList,
  sectionNumber,
  type AboutFact,
  type CourseSection,
} from "@/features/course/components/detail/CourseSections";
import { CourseExperts } from "@/features/course/components/detail/CourseExperts";
import { EnrolCard, type EnrolCardData } from "@/features/course/components/detail/EnrolCard";
import { EnrolBar } from "@/features/course/components/detail/EnrolBar";
import { CourseToc } from "@/features/course/components/detail/CourseToc";
import { CourseRunningHead } from "@/features/course/components/detail/CourseRunningHead";
import { RelatedCourses } from "@/features/course/components/detail/RelatedCourses";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseServerApi } from "@/features/course/api.server";
import { expertServerApi } from "@/features/expert/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { getCategoryIndex } from "@/features/course/catalog.server";
import { FORMAT_KEY, LEVEL_KEY, formatDuration, lessonKindCounts } from "@/features/course/format";
import { primaryCategoryId, toCategoryRef, type CategoryRef } from "@/features/category/style";
import { mediaSrc } from "@/features/course/media";
import { formatDateRange, formatNumber, formatPrice } from "@/lib/utils/format";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import type { ApiError } from "@/types/api";
import type { Course } from "@/features/course/types";
import type { Category } from "@/features/category/types";
import type { ExpertProfile } from "@/features/expert/types";

type Props = { params: Promise<{ slug: string; lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  try {
    const c = await courseServerApi.bySlug(slug);
    return {
      title: c.title,
      description: c.subtitle ?? c.description?.slice(0, 160) ?? undefined,
      openGraph: {
        title: c.title,
        description: c.subtitle ?? undefined,
        type: "website",
      },
    };
  } catch (err) {
    const t = await getT(isLocale(lang) ? lang : defaultLocale);
    // A missing course renders the 404 body, so the tab says so too (the same
    // words as the not-found page's kicker) and search engines skip the URL.
    // Any other failure keeps the generic course title.
    if ((err as ApiError).status === 404) {
      return { title: t("errors.notFoundKicker"), robots: { index: false } };
    }
    return { title: t("courseDetail.fallbackTitle") };
  }
}

/** One person on the teaching roster. */
type RosterEntry = { tutorId: string; displayName: string; authorized?: boolean };

/**
 * The API sends the full teaching roster as `tutors`, which the shared
 * `Course` type does not declare yet. Read it defensively and fall back to the
 * single owning tutor, so an older API response still renders one expert.
 * The tutor who owns the course leads the list; the rest keep the API's order.
 */
function rosterOf(course: Course): RosterEntry[] {
  const raw = (course as Course & { tutors?: unknown }).tutors;
  const listed = Array.isArray(raw)
    ? (raw as Partial<RosterEntry>[]).filter(
        (e): e is RosterEntry =>
          typeof e?.tutorId === "string" &&
          typeof e.displayName === "string" &&
          e.displayName.trim() !== "",
      )
    : [];
  if (!listed.length) {
    return course.tutorId && course.tutorDisplayName
      ? [{ tutorId: course.tutorId, displayName: course.tutorDisplayName }]
      : [];
  }
  return [...listed].sort(
    (a, b) => Number(b.tutorId === course.tutorId) - Number(a.tutorId === course.tutorId),
  );
}

/**
 * "Azərbaycan dili" / "Azerbaijani" from an ISO code such as "az": the
 * dictionary's `languages.<code>` first, so both locales read the same on
 * every server; Intl only for a code the dictionary does not know.
 */
function languageText(code: string | null | undefined, locale: Locale, t: TFunction) {
  if (!code) return null;
  const key = `languages.${code.toLowerCase()}`;
  const known = t(key);
  if (known && known !== key) return t("courseDetail.languageName", { name: known });
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

/**
 * Outcomes and requirements are free text that authors usually write one item
 * per line, often with their own bullets or numbers. Split them into items so
 * they can be shown as a list; a single paragraph becomes a single item.
 */
function itemsOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•–·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

/**
 * The server's clock, read once per render (never in a client component): the
 * related cards' "Yeni" badges compare against it.
 */
function renderTime() {
  return Date.now();
}

/** A decimal from the API ("6", "1.5", 6) as a number; 0 when missing or malformed. */
function num(v: string | number | null | undefined) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  let course;
  try {
    course = await courseServerApi.bySlug(slug);
  } catch (err) {
    if ((err as ApiError).status === 404) notFound();
    throw err;
  }

  const totalSeconds =
    course.onlineDetails?.totalVideoSeconds ??
    course.modules.reduce(
      (s, m) => s + m.lessons.reduce((x, l) => x + (l.durationSeconds ?? 0), 0),
      0,
    );
  const lessonCount = course.modules.reduce(
    (s, m) => s + m.lessons.length,
    0,
  );

  // The public profile adds the portrait and title to each expert card. It is
  // an enhancement only: an expert who is not (or no longer) approved answers
  // 404, and the card then falls back to the name the course already carries.
  // The categories (cached like the course, 300 s, so this page stays static
  // for as long as it did) colour the poster and the category trail; failing
  // to load them only costs the colour, never the page.
  const roster = rosterOf(course);
  const [profiles, categories] = await Promise.all([
    Promise.allSettled(roster.map((entry) => expertServerApi.byId(entry.tutorId))),
    categoryServerApi.listCached(300).catch((): Category[] => []),
  ]);

  // D11: the primary category is the member category with the lowest
  // sortOrder, the same rule every list uses, so the poster matches everywhere.
  const byId = new Map(categories.map((c) => [c.id, c] as const));
  const refOf = (c: Category | null | undefined): CategoryRef | null =>
    c ? toCategoryRef(c, t, locale) : null;
  const primaryId = primaryCategoryId(course.categoryIds ?? [], byId);
  const category = refOf(primaryId ? byId.get(primaryId) : null);

  const tutors: CourseTutor[] = roster.map((entry, i) => {
    const settled = profiles[i];
    const profile: ExpertProfile | null =
      settled.status === "fulfilled" ? settled.value : null;
    // An expert's initials take the colour of their own field, as on their
    // profile; the course's field when they have none on record.
    const own = primaryCategoryId(profile?.expertiseCategoryIds ?? [], byId);
    return { ...entry, profile, category: own ? refOf(byId.get(own)) : category };
  });
  const expertise = Object.fromEntries(
    tutors.map((tutor) => [
      tutor.tutorId,
      (tutor.profile?.expertiseCategoryIds ?? [])
        .map((id) => byId.get(id))
        .filter((c): c is Category => Boolean(c && c.active !== false))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => toCategoryRef(c, t, locale)),
    ]),
  );

  // Related courses come from the same category index the lists use (at this
  // page's 300 s), so each related poster has its own primary category's colours.
  // Members coloured as this field come first (a stable sort, so each group
  // keeps the API's newest-first order): the section is headed by the field,
  // and a poster in another field's colours only fills a place left over.
  const index = category ? await getCategoryIndex(categories, { revalidate: 300 }) : null;
  const related = (index?.entries.find((e) => e.category.id === category?.id)?.courses ?? [])
    .filter((c) => c.id !== course.id)
    .map((c) => ({ course: c, primary: index?.primaryOf(c.id) ?? null }))
    .sort((a, b) => Number(b.primary?.id === category?.id) - Number(a.primary?.id === category?.id))
    .slice(0, 3)
    .map(({ course: c, primary }) => ({ course: c, category: refOf(primary) }));
  const now = renderTime();

  // The detail response carries the thumbnail's media id only (the catalogue
  // entry carries the path), so build the same anonymous media path here.
  const cover = mediaSrc(
    course.thumbnailMediaId
      ? `/api/public/media/${course.thumbnailMediaId}/content`
      : null,
  );

  const online = course.courseType === "ONLINE";
  const offline = course.offlineDetails;
  const priceLabel = course.free
    ? t("common.free")
    : formatPrice(course.price, course.currency, locale);
  const formatLabel = t(online ? "ui.onlineCourse" : "ui.offlineCourse");
  const lessonsText = t("courseDetail.lessons", { count: lessonCount });
  const modulesText = t("courseDetail.modules", { count: course.modules.length });
  const kinds = lessonKindCounts(course.modules);

  // What every call to action needs, and nothing more (see EnrollTarget).
  const target: EnrollTarget = {
    id: course.id,
    slug: course.slug,
    free: course.free,
    price: course.price,
    currency: course.currency,
    hasLessons: course.modules.some((m) => m.lessons.length > 0),
  };

  // In-person facts. Zero or missing values mean "not set yet", not "none", so
  // they are left out rather than shown as 0. Date-only strings are read in
  // UTC by formatDateRange, so the day cannot shift with the server's zone.
  const weekly = num(offline?.weeklyHours);
  const totalHours = num(offline?.totalHours);
  const hoursText = (h: number) => formatNumber(h, locale, 1);
  // The spec strip prints the range without years and names the year in its
  // sub-line; a course that runs into the next year names both ("2026–2027"),
  // so "16 noy – 22 yan" cannot read as ending in the January before it starts.
  const startYear = offline?.startDate ? offline.startDate.slice(0, 4) : "";
  const endYear = offline?.endDate ? offline.endDate.slice(0, 4) : "";
  const spansYears = startYear !== "" && endYear !== "" && startYear !== endYear;
  const yearText = spansYears ? `${startYear}–${endYear}` : startYear;
  const place = [offline?.addressLine, offline?.city]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
  const seatLimit = offline?.studentLimit ?? 0;
  const seatsTaken = offline?.enrolledCount ?? 0;
  const seatsLeft = Math.max(0, seatLimit - seatsTaken);
  const seatsStatus =
    seatLimit > 0
      ? seatsLeft > 0
        ? t("courseDetail.seatsLeft", { n: formatNumber(seatsLeft, locale), count: seatsLeft })
        : t("courseDetail.seatsFull")
      : null;

  // The spec strip: only the facts this course has.
  const language = languageText(course.language, locale, t);
  const facts: SpecFact[] = [
    {
      id: "format",
      label: t("courseDetail.factFormat"),
      value: t(FORMAT_KEY[course.courseType]),
      sub: online ? t("courseDetail.specSelfPaced") : offline?.city?.trim() || null,
    },
    { id: "level", label: t("courseDetail.factLevel"), value: t(LEVEL_KEY[course.level] ?? "common.allLevels") },
  ];
  if (lessonCount > 0) {
    facts.push({ id: "lessons", label: t("courseDetail.factLessons"), value: lessonsText, sub: modulesText });
  }
  if (online && totalSeconds > 0) {
    facts.push({
      id: "length",
      label: t("courseDetail.factDuration"),
      value: formatDuration(totalSeconds, t, "long"),
      sub: t("courseDetail.specVideoMaterials"),
    });
  } else if (!online && offline?.startDate) {
    facts.push({
      id: "dates",
      label: t("courseDetail.factDates"),
      value: formatDateRange(offline.startDate, offline.endDate, locale, { month: "short", year: false }),
      sub: weekly > 0
        ? t("courseDetail.specYearWeekly", { year: yearText, hours: hoursText(weekly) })
        : yearText,
    });
  } else if (!online && totalHours > 0) {
    facts.push({
      id: "length",
      label: t("courseDetail.factDuration"),
      value: formatDuration(totalHours * 3600, t, "long"),
      sub: weekly > 0 ? t("courseDetail.weeklyHours", { hours: hoursText(weekly) }) : null,
    });
  }
  if (language) facts.push({ id: "language", label: t("courseDetail.factLanguage"), value: language });
  facts.push({
    id: "price",
    label: t("courseDetail.factPrice"),
    value: priceLabel,
    sub: course.free ? t("courseDetail.specNoPayment") : null,
  });

  // The enrol card: price, seats, the call to action and what is included.
  // No preview lessons (visitors cannot open them) and no certificate (none
  // is issued yet) — only facts that hold for this course.
  const includes: EnrolCardData["includes"] = [
    lessonCount > 0
      ? {
          icon: "layers",
          text:
            `${modulesText}, ${lessonsText}` +
            (online && totalSeconds > 0 ? ` · ${formatDuration(totalSeconds, t, "long")}` : ""),
        }
      : { icon: "layers", text: t("courseDetail.inclNoLessons") },
  ];
  if (offline) {
    // Where and when, one hairline row each (the prototype's card): the long
    // date range, the street address with the city, and the weekly load. The
    // card is what a visitor reads before committing to an in-person course,
    // so it carries the practical facts itself. A row shows only when its
    // value is set; on a short screen the table of contents under the card
    // gives way first, so the extra rows cost the rail nothing.
    const range = formatDateRange(offline.startDate, offline.endDate, locale);
    if (range) includes.push({ icon: "calendar", text: range });
    if (place) includes.push({ icon: "pin", text: place, clamp: true });
    if (weekly > 0) {
      includes.push({ icon: "clock", text: t("courseDetail.weeklyHours", { hours: hoursText(weekly) }) });
    }
  } else {
    includes.push({ icon: "sync", text: t("courseDetail.inclProgress") });
    includes.push({ icon: "device", text: t("courseDetail.inclAnyDevice") });
  }
  const enrolCard: EnrolCardData = {
    target,
    priceLabel,
    formatLabel,
    note: course.free ? t("courseDetail.freeNote") : null,
    seats:
      seatLimit > 0 && seatsStatus
        ? {
            label: t("courseDetail.factSeats"),
            taken: t("courseDetail.seatsTaken", {
              enrolled: formatNumber(seatsTaken, locale),
              limit: formatNumber(seatLimit, locale),
            }),
            meterLabel: t("courseDetail.seatsMeter", {
              enrolled: formatNumber(seatsTaken, locale),
              limit: formatNumber(seatLimit, locale),
            }),
            pct: Math.min(100, Math.round((seatsTaken / seatLimit) * 100)),
            status: seatsStatus,
          }
        : null,
    kinds,
    includes,
  };

  // The article's sections, in reading order. An empty one is dropped, so the
  // numbers (and the table of contents) stay consecutive.
  const outcomes = itemsOf(course.learningOutcomes);
  const requirements = itemsOf(course.requirements);
  const aboutFacts: AboutFact[] = [];
  if (offline) {
    const range = formatDateRange(offline.startDate, offline.endDate, locale);
    if (range) aboutFacts.push({ icon: "calendar", label: t("courseDetail.factDates"), value: range });
    if (weekly > 0) {
      aboutFacts.push({
        icon: "clock",
        label: t("courseDetail.factWeekly"),
        value: totalHours > 0
          ? t("courseDetail.weeklyTotal", { w: hoursText(weekly), total: hoursText(totalHours) })
          : t("courseDetail.weeklyHours", { hours: hoursText(weekly) }),
      });
    }
    if (place) aboutFacts.push({ icon: "pin", label: t("courseDetail.factLocation"), value: place });
  }

  const sections: CourseSection[] = [];
  if (outcomes.length) {
    sections.push({ id: "learn", title: t("courseDetail.whatYouLearn"), body: <OutcomesList items={outcomes} /> });
  }
  if (course.description?.trim() || aboutFacts.length) {
    sections.push({
      id: "about",
      title: t("courseDetail.aboutCourse"),
      body: <AboutCourse description={course.description} category={category} facts={aboutFacts} />,
    });
  }
  sections.push({
    id: "curriculum",
    title: t("courseDetail.curriculum"),
    body: (
      <div className="mt-8">
        <CurriculumAccordion
          modules={course.modules}
          kinds={kinds}
          totalSeconds={online ? totalSeconds : 0}
          emptyMessage={t("courseDetail.curriculumEmpty")}
          emptyHint={t("courseDetail.curriculumEmptyHint")}
        />
      </div>
    ),
  });
  if (requirements.length) {
    sections.push({ id: "req", title: t("courseDetail.requirements"), body: <RequirementsList items={requirements} /> });
  }
  if (tutors.length) {
    sections.push({
      id: "expert",
      title: tutors.length > 1 ? t("courseDetail.createdByMany") : t("courseDetail.createdBy"),
      body: <CourseExperts tutors={tutors} locale={locale} expertise={expertise} />,
    });
  }
  sections.push({
    id: "reviews",
    title: t("review.title"),
    body: (
      <ReviewsSection courseId={course.id} ratingAvg={course.ratingAvg} ratingCount={course.ratingCount} />
    ),
  });
  const toc = sections.map((s, i) => ({ id: s.id, title: s.title, number: sectionNumber(i) }));

  // The quiet second button under the title: the curriculum when it has
  // lessons, otherwise the description (when there is one).
  const hasAbout = sections.some((s) => s.id === "about");
  const secondary =
    lessonCount > 0 || !hasAbout
      ? { href: "#curriculum", label: t("courseDetail.seeCurriculum") }
      : { href: "#about", label: t("courseDetail.aboutCourse") };

  const barMeta =
    seatsStatus ??
    (lessonCount > 0
      ? [lessonsText, formatDuration(online ? totalSeconds : totalHours * 3600, t, "short")]
          .filter(Boolean)
          .join(" · ")
      : formatLabel);
  const runMeta = [priceLabel, lessonCount > 0 ? lessonsText : null].filter(Boolean).join(" · ");

  return (
    <>
      <CourseTitlePage
        course={course}
        category={category}
        tutors={tutors}
        locale={locale}
        photoUrl={cover}
        facts={facts}
        target={target}
        secondary={secondary}
      />

      {/* Below 1024px the card follows the title page; from 1024px it sits in the rail. */}
      <div className="wrap mt-10 lg:hidden">
        <EnrolCard data={enrolCard} className="mx-auto max-w-xl" />
      </div>

      <div className="wrap">
        <div className="g12">
          <div className="col-span-4 min-w-0 md:col-span-8 lg:col-span-7">
            <CourseArticle sections={sections} />
          </div>
          <aside
            aria-label={t("courseDetail.enrolAside")}
            className="hidden pt-20 lg:col-span-4 lg:col-start-9 lg:block"
          >
            {/* Sticks at every height: on a short screen the table of contents
                gives way first, then the rail scrolls within itself. The
                padding keeps the card's shadow from being clipped. */}
            <div className="sticky top-[calc(var(--hdr)+28px)] -mx-8 -mt-2 flex max-h-[calc(100dvh-var(--hdr)-40px)] flex-col overflow-y-auto overscroll-contain px-8 pt-2 pb-8 [scrollbar-width:thin]">
              <EnrolCard data={enrolCard} className="shrink-0" />
              <CourseToc
                items={toc}
                label={t("courseDetail.onThisPage")}
                className="mt-8 min-h-24 shrink overflow-y-auto"
              />
            </div>
          </aside>
        </div>
      </div>

      <RelatedCourses category={category} items={related} locale={locale} now={now} />

      <CourseRunningHead
        cat={category ? { key: category.key, hue: category.hue } : null}
        categoryName={category?.name ?? null}
        title={course.title}
        meta={runMeta}
        target={target}
      />
      <EnrolBar target={target} priceLabel={priceLabel} meta={barMeta} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.subtitle ?? course.description ?? course.title,
          inLanguage: course.language,
          provider: { "@type": "Organization", name: "EduPlatform" },
          aggregateRating:
            course.ratingCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: course.ratingAvg,
                  ratingCount: course.ratingCount,
                }
              : undefined,
          offers: {
            "@type": "Offer",
            price: course.free ? "0" : course.price,
            priceCurrency: course.currency,
            availability: "https://schema.org/InStock",
          },
        }}
      />
    </>
  );
}

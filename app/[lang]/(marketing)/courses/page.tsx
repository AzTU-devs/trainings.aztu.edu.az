import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { courseServerApi } from "@/features/course/api.server";
import { categoryServerApi } from "@/features/category/api.server";
import { expertServerApi } from "@/features/expert/api.server";
import { categoryDescription } from "@/features/category/label";
import { toCategoryRef, type CategoryRef } from "@/features/category/style";
import type { Category } from "@/features/category/types";
import { allPublishedCourses, getCategoryIndex } from "@/features/course/catalog.server";
import {
  FACET_OPTIONS,
  catalogueStats,
  facetCounts,
  filtersFrom,
  matches,
  type CatalogueFilters,
} from "@/features/course/catalog";
import { FORMAT_KEY, LEVEL_KEY } from "@/features/course/format";
import { PAYMENTS_ENABLED } from "@/features/course/payments";
import { parseFiltersFromSearchParams } from "@/features/course/filters";
import type { DurationBucket } from "@/features/course/types";
import { ActiveFilters, type ActiveFilter } from "@/features/course/components/catalogue/ActiveFilters";
import { CatalogueHead } from "@/features/course/components/catalogue/CatalogueHead";
import { CatalogueResults } from "@/features/course/components/catalogue/CatalogueResults";
import { CategoryBanner } from "@/features/course/components/catalogue/CategoryBanner";
import { CategoryChips, type CategoryChipItem } from "@/features/course/components/catalogue/CategoryChips";
import { FilterBar, type CatalogueFacets } from "@/features/course/components/catalogue/FilterBar";
import type { FacetOption } from "@/features/course/components/catalogue/FilterDropdown";
import { SuggestTopic } from "@/features/course/components/catalogue/SuggestTopic";
import { Breadcrumbs, type Crumb } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { bakuDate, formatNumber, formatRating } from "@/lib/utils/format";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type SP = Promise<Record<string, string | undefined>>;
type Props = { params: Promise<{ lang: string }>; searchParams: SP };

/**
 * Below this many published courses a lone result gets the "N courses right
 * now" note under it. The filter toolbar (and the lead that offers it) stays
 * regardless: every filter the catalogue has always offered stays reachable,
 * however few courses there are.
 */
const SPARSE_BELOW = 7;

const DURATION_KEY: Record<DurationBucket, string> = {
  lt2: "filters.durationLt2",
  "2to6": "filters.duration2to6",
  "6to17": "filters.duration6to17",
  gt17: "filters.durationGt17",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("courses.metaTitle"), description: t("courses.metaDescription") };
}

/** The server's clock, read once per render: the "Yeni" badges all compare against it. */
function renderTime() {
  return Date.now();
}

export default async function CoursesPage({ params, searchParams }: Props) {
  const [{ lang }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // The catalogue is one request: `GET /api/public/courses` applies the free
  // text and every filter together, so a filtered page 2 is as correct as page 1
  // and searching no longer costs the visitor their filters.
  const query = parseFiltersFromSearchParams(raw);
  const q = query.q;
  // Presentation only (plan D2): the API request above never sees it.
  const view = raw.view === "list" ? "list" : "grid";

  // Added, read-only: the whole published list (60 s, shared with the expert
  // directory) for the catalogue's size, date and facet counts, and the
  // category index (60 s) that colours every card by its primary category.
  const categoriesP = categoryServerApi.list().catch((): Category[] => []);
  const [categories, data, all, index] = await Promise.all([
    categoriesP,
    courseServerApi.list(query).catch(() => null),
    allPublishedCourses().catch(() => null),
    categoriesP.then((c) => getCategoryIndex(c)).catch(() => null),
  ]);

  const active = categories.filter((c) => c.active);
  const refs = new Map<string, CategoryRef>(active.map((c) => [c.id, toCategoryRef(c, t, locale)]));
  const currentCat = query.categoryId ? (refs.get(query.categoryId) ?? null) : null;

  const home = localeHref(locale, "/");
  const coursesHref = localeHref(locale, "/courses");
  const crumbs: Crumb[] = [
    { label: t("common.home"), href: home },
    currentCat ? { label: t("common.courses"), href: coursesHref } : { label: t("common.courses") },
    ...(currentCat ? [{ label: currentCat.name }] : []),
  ];

  // A GET form replaces the query string wholesale, so the active filters
  // ride along as hidden fields — searching narrows the current selection
  // instead of silently clearing it. `page` is left out on purpose: a new
  // search starts at the first page.
  const hidden: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value && key !== "q" && key !== "page") hidden[key] = String(value);
  }
  const search = (
    <SearchField
      id="catalogue-q"
      action={coursesHref}
      defaultValue={q ?? ""}
      placeholder={t("courses.searchPlaceholder")}
      label={t("ui.searchLabel")}
      submitLabel={t("ui.searchSubmit")}
      hidden={hidden}
    />
  );

  // The catalogue can fail to load; when it does the page still keeps its
  // header and its search field, so the visitor has somewhere to go rather than
  // an unbranded error card floating on an empty page.
  if (!data) {
    return (
      <>
        <section className="wrap pt-6 pb-20 lg:pt-8">
          <div className="-my-1.5">
            <Breadcrumbs items={crumbs} />
          </div>
          <CatalogueHead
            kicker={t("courses.eyebrow")}
            title={t("courses.title")}
            lead={t("courses.loadErrorHint")}
            search={search}
          />
          <EmptyState
            plate={t("courses.loadPlate")}
            title={t("courses.loadError")}
            className="mt-14 lg:mt-20"
            headingLevel="h2"
            action={
              <Link href={coursesHref} className={buttonVariants({ variant: "outline" })}>
                {t("common.retry")}
              </Link>
            }
          />
        </section>
        <SuggestTopic locale={locale} />
      </>
    );
  }

  const now = renderTime();
  const stats = all ? catalogueStats(all.courses) : null;
  const catalogueTotal = all ? all.total : null;
  const sparse = catalogueTotal !== null && catalogueTotal < SPARSE_BELOW;
  const allFree = !PAYMENTS_ENABLED && Boolean(stats?.allFree);

  // Facet counts (plan D12): computed from the full list with the API's own
  // bucket rules. Not while searching — local counts cannot mirror full-text
  // search — and not when the walk was capped; the options stay usable.
  const filters = filtersFrom(query);
  const fc = !q && all?.complete && index ? facetCounts(all.courses, index.courseCats, filters) : null;
  const anyCount = (skip: keyof CatalogueFilters) =>
    fc && all && index
      ? formatNumber(all.courses.filter((c) => matches(c, index.courseCats.get(c.id) ?? [], filters, skip)).length, locale)
      : undefined;
  const option = (value: string, label: string, n: number | undefined): FacetOption =>
    fc ? { value, label, count: formatNumber(n ?? 0, locale), empty: !n } : { value, label };
  const ratingLabel = (r: number | string) => t("filters.ratingFloor", { rating: formatRating(r, locale) });

  // Every category with courses, in sortOrder (D6); unknown counts still show.
  const populated = index
    ? index.entries.filter((e) => e.count === null || e.count > 0)
    : active.map((category) => ({ category, count: null as number | null, courses: [] }));
  const chipCats = populated.flatMap((e) => {
    const ref = refs.get(e.category.id);
    return ref ? [{ ref, count: e.count }] : [];
  });
  // A chosen category with no courses (an old link) still shows as chosen.
  if (currentCat && !chipCats.some((c) => c.ref.id === currentCat.id)) chipCats.push({ ref: currentCat, count: 0 });

  const hrefWith = (key: string, value: string | null) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) {
      if (k === "page" || k === key || !v) continue;
      u.set(k, String(v));
    }
    if (value) u.set(key, value);
    const qs = u.toString();
    return qs ? `${coursesHref}?${qs}` : coursesHref;
  };

  const chips: CategoryChipItem[] = [
    {
      href: hrefWith("categoryId", null),
      category: null,
      label: t("common.all"),
      count: fc ? formatNumber(fc.all, locale) : undefined,
      current: !query.categoryId,
      disabled: false,
    },
    ...chipCats.map(({ ref, count }) => {
      const current = ref.id === query.categoryId;
      const n = fc && count !== null ? (fc.categoryId[ref.id] ?? 0) : null;
      return {
        // Like the former sidebar's toggle: the chosen chip clears the category.
        href: hrefWith("categoryId", current ? null : ref.id),
        category: ref,
        label: ref.name,
        count: n === null ? undefined : formatNumber(n, locale),
        current,
        disabled: n === 0 && !current,
      };
    }),
  ];

  const facets: CatalogueFacets = {
    type: {
      param: "type",
      label: t("filters.format"),
      anyLabel: t("common.all"),
      anyCount: anyCount("type"),
      value: query.type ?? "",
      options: FACET_OPTIONS.type.map((v) => option(v, t(FORMAT_KEY[v]), fc?.type[v])),
    },
    level: {
      param: "level",
      label: t("filters.level"),
      anyLabel: t("filters.anyLevel"),
      anyCount: anyCount("level"),
      value: query.level ?? "",
      options: FACET_OPTIONS.level.map((v) => option(v, t(LEVEL_KEY[v]), fc?.level[v])),
    },
    duration: {
      param: "duration",
      label: t("filters.duration"),
      anyLabel: t("filters.anyDuration"),
      anyCount: anyCount("duration"),
      value: query.durationBucket ?? "",
      options: FACET_OPTIONS.duration.map((v) => option(v, t(DURATION_KEY[v]), fc?.duration[v])),
    },
    rating: {
      param: "rating",
      label: t("filters.rating"),
      anyLabel: t("filters.anyRating"),
      anyCount: anyCount("ratingMin"),
      value: query.ratingMin !== undefined ? String(query.ratingMin) : "",
      valueLabel: query.ratingMin !== undefined ? ratingLabel(query.ratingMin) : undefined,
      options: FACET_OPTIONS.rating.map((v) => option(v, ratingLabel(v), fc?.rating[v])),
    },
    category: {
      param: "categoryId",
      label: t("filters.field"),
      anyLabel: t("filters.anyField"),
      anyCount: fc ? formatNumber(fc.all, locale) : undefined,
      value: query.categoryId ?? "",
      options: chipCats.map(({ ref, count }) => {
        const n = fc && count !== null ? (fc.categoryId[ref.id] ?? 0) : undefined;
        return n === undefined ? { value: ref.id, label: ref.name } : option(ref.id, ref.name, n);
      }),
    },
  };

  // "Seçilib": what the API actually received, in the words of its control.
  const activeFilters: ActiveFilter[] = [];
  if (q) activeFilters.push({ param: "q", label: `“${q}”` });
  if (query.categoryId) activeFilters.push({ param: "categoryId", label: currentCat?.name ?? t("filters.field") });
  if (query.type) activeFilters.push({ param: "type", label: t(FORMAT_KEY[query.type]) });
  if (query.level) activeFilters.push({ param: "level", label: t(LEVEL_KEY[query.level]) });
  if (query.durationBucket) activeFilters.push({ param: "duration", label: t(DURATION_KEY[query.durationBucket]) });
  if (query.ratingMin !== undefined) activeFilters.push({ param: "rating", label: ratingLabel(query.ratingMin) });
  if (query.language) {
    const key = `languages.${query.language.toLowerCase()}`;
    const name = t(key);
    activeFilters.push({ param: "language", label: t("courses.language", { language: name === key ? query.language : name }) });
  }
  if (PAYMENTS_ENABLED) {
    if (query.free) activeFilters.push({ param: "free", label: t("filters.freeOnly") });
    if (query.priceMin !== undefined) activeFilters.push({ param: "priceMin", label: `${t("filters.min")} ${query.priceMin}` });
    if (query.priceMax !== undefined) activeFilters.push({ param: "priceMax", label: `${t("filters.max")} ${query.priceMax}` });
  }

  // Each card's colour and kicker: the course's primary category (D11).
  const items = data.content.map((course) => {
    const primary = index?.primaryOf(course.id);
    return { course, category: primary ? (refs.get(primary.id) ?? null) : null };
  });

  // A single result is a cover story, so it gets its expert's byline too.
  const single = data.totalElements === 1 && data.content.length === 1 ? data.content[0] : null;
  const profile = single ? await expertServerApi.byId(single.tutorId).catch(() => null) : null;
  const expert = single
    ? {
        name: single.tutorDisplayName,
        title: profile?.academicTitle || profile?.headline || null,
        avatarUrl: profile?.avatarUrl ?? null,
      }
    : null;

  const otherFields = populated.flatMap((e) => {
    const ref = refs.get(e.category.id);
    return ref && e.count ? [{ category: ref, count: formatNumber(e.count, locale) }] : [];
  });

  let head;
  if (currentCat) {
    const entry = index?.entries.find((e) => e.category.id === currentCat.id);
    const courses = entry?.courses ?? [];
    const total = entry?.count ?? 0;
    const experts = new Set(courses.map((c) => c.tutorId)).size;
    const online = courses.filter((c) => c.courseType === "ONLINE").length;
    const offline = courses.length - online;
    const no = populated.findIndex((e) => e.category.id === currentCat.id);
    const source = active.find((c) => c.id === currentCat.id);
    head = (
      <CategoryBanner
        category={currentCat}
        kicker={
          no >= 0 ? t("courses.categoryKicker", { no: String(no + 1).padStart(2, "0") }) : t("courses.categoryKickerPlain")
        }
        lead={(source && categoryDescription(source, locale)) || t("courses.categoryLead")}
        stats={[
          total > 0 ? t("ui.courseCount", { n: formatNumber(total, locale), count: total }) : "",
          experts > 0 ? t("courses.statExperts", { n: formatNumber(experts, locale), count: experts }) : "",
          online > 0 ? t("courses.statOnline", { n: formatNumber(online, locale) }) : "",
          offline > 0 ? t("courses.statOffline", { n: formatNumber(offline, locale) }) : "",
        ].filter(Boolean)}
        search={search}
      />
    );
  } else {
    const lead = q
      ? t("courses.searchSubtitle")
      : `${t("courses.lead")}${allFree ? ` ${t("courses.leadFree")}` : ""}`;
    head = (
      <CatalogueHead
        kicker={
          q
            ? t("courses.searchKicker")
            : stats?.updatedAt
              ? t("courses.updated", { date: bakuDate(stats.updatedAt, locale) })
              : t("courses.eyebrow")
        }
        title={q ? `“${q}”` : t("courses.title")}
        count={!q && catalogueTotal !== null ? formatNumber(catalogueTotal, locale) : undefined}
        lead={lead}
        search={search}
      />
    );
  }

  return (
    <>
      <section className="wrap pt-6 lg:pt-8">
        {/* The negative margin takes back the crumbs' own tap padding, so the
            rhythm matches the page grid. */}
        <div className="-my-1.5">
          <Breadcrumbs items={crumbs} />
        </div>
        {head}
        {/* Always there, even as a lone "Hamısı" on an empty catalogue (plan
            §4.7): the rail is where the fields appear as courses are published. */}
        <CategoryChips items={chips} label={t("ui.fields")} className="mt-10 lg:mt-12" />
      </section>

      <FilterBar facets={facets} total={data.totalElements} allFree={allFree} view={view} className="mt-8" />

      {/* scroll-mt: html's scroll-padding already clears the header; this
          clears the sticky toolbar when the filter sheet scrolls here. */}
      <section
        id="catalogue-results"
        aria-labelledby="catalogue-results-h"
        className="wrap scroll-mt-8 pt-8 pb-20 transition-opacity duration-(--dur-2) aria-busy:opacity-55 lg:pb-28"
      >
        <ActiveFilters items={activeFilters} />
        <CatalogueResults
          locale={locale}
          data={data}
          items={items}
          view={view}
          now={now}
          q={q}
          hasFilters={activeFilters.some((f) => f.param !== "q")}
          sparse={sparse}
          catalogueTotal={catalogueTotal}
          expert={expert}
          otherFields={otherFields}
          params={raw}
        />
      </section>

      <SuggestTopic locale={locale} />
    </>
  );
}

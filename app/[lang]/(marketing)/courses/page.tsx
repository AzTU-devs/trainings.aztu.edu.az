import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, CloudOff, LayoutGrid, Mail, Search, Sparkles, X } from "lucide-react";
import { listCourses } from "@/features/showcase/source.server";
import { categoryOf, getCatalogIndex } from "@/features/course/catalog-index.server";
import { courseLabels } from "@/features/course/labels";
import { parseFiltersFromSearchParams } from "@/features/course/filters";
import { CourseCard, WideCourseCard } from "@/features/course/components/CourseCard";
import { FilterPanel, FilterSheet } from "@/features/course/components/CatalogFilters";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { Svg } from "@/components/bright/Svg";
import { SUPPORT_EMAIL } from "@/components/layout/Footer";
import { initialsOf } from "@/features/expert/types";
import { swatchSvg } from "@/lib/art";
import { cn } from "@/lib/utils/cn";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type SP = Promise<Record<string, string | undefined>>;
type Props = { params: Promise<{ lang: string }>; searchParams: SP };

/** Below this many courses the catalogue is too small to be worth filtering. */
const SPARSE_BELOW = 7;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("courses.metaTitle"), description: t("courses.metaDescription") };
}

/** The catalogue URL with one parameter changed; `page` always resets. */
function withParam(raw: Record<string, string | undefined>, key: string, value: string | null) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) if (v && k !== "page" && k !== key) u.set(k, v);
  if (value) u.set(key, value);
  const qs = u.toString();
  return `/courses${qs ? `?${qs}` : ""}`;
}

export default async function CoursesPage({ params, searchParams }: Props) {
  const [{ lang }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // One request for the results: `GET /api/public/courses` applies the search
  // text and every filter together, so a filtered page 2 is as correct as
  // page 1. The index adds the categories' colours and counts.
  const query = parseFiltersFromSearchParams(raw);
  const [index, data] = await Promise.all([getCatalogIndex(), listCourses(query).catch(() => null)]);

  const labels = courseLabels(t, locale);
  const sparse = index.total < SPARSE_BELOW;
  const categories = index.categories.map((c) => ({
    id: c.id,
    name: categoryLabel(c, t, locale),
    k: categoryStyle(c).k,
    art: categoryStyle(c).art,
    count: index.countByCategory[c.id] ?? 0,
    short: (() => {
      const key = `categoryShort.${c.slug}`;
      const v = t(key);
      return v !== key ? v : categoryLabel(c, t, locale);
    })(),
  }));
  const catFor = (id: string) => {
    const c = categoryOf(index, id);
    return c ? { name: categoryLabel(c, t, locale), style: categoryStyle(c) } : null;
  };
  const activeCategory = categories.find((c) => c.id === query.categoryId);

  // Chips for the active filters, each a link that removes just that one.
  const chips: { label: string; href: string }[] = [];
  if (query.type) chips.push({ label: labels.format[query.type], href: withParam(raw, "type", null) });
  if (activeCategory) chips.push({ label: activeCategory.name, href: withParam(raw, "categoryId", null) });
  if (query.level) chips.push({ label: labels.level[query.level], href: withParam(raw, "level", null) });
  if (query.durationBucket)
    chips.push({ label: t(`catalog.duration_${query.durationBucket}`), href: withParam(raw, "duration", null) });
  if (query.ratingMin !== undefined)
    chips.push({
      label: t("catalog.ratingAtLeast", { value: query.ratingMin.toFixed(1).replace(".", ",") }),
      href: withParam(raw, "rating", null),
    });

  const count = data?.totalElements ?? 0;

  return (
    <>
      {/* ============ 1. HEAD: title + search, content first ============ */}
      <section className="relative isolate overflow-x-clip" aria-labelledby="cat-h1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
          <div className="absolute -top-72 right-[-8%] size-[760px] rounded-full bg-[radial-gradient(closest-side,var(--gold-tint),transparent)]" />
        </div>
        <div className="wrap pt-8 lg:pt-14">
          <nav aria-label={t("ui.breadcrumb")} className="flex items-center gap-2 text-[13.5px] text-ink-3">
            <LocaleLink href="/" className="hover:text-ink">
              {t("ui.home")}
            </LocaleLink>
            <span aria-hidden>/</span>
            <span className="text-ink-2" aria-current="page">
              {t("ui.navCourses")}
            </span>
          </nav>
          <div className="mt-4 grid items-end gap-x-8 gap-y-7 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h1 id="cat-h1" className="d-lg">
                {query.q ? `“${query.q}”` : t("catalog.title")}
              </h1>
              <p className="lead mt-4 max-w-[30rem]">{query.q ? t("catalog.searchSub") : t("catalog.sub")}</p>
            </div>
            <form className="lg:col-span-7" role="search" action={localeHref(locale, "/courses")}>
              <label className="sr-only" htmlFor="cq">
                {t("catalog.searchLabel")}
              </label>
              <div className="sfield !h-[64px] shadow-[0_0_0_1px_var(--line-2),var(--shadow-md)]">
                <Search className="i" aria-hidden />
                <input
                  id="cq"
                  name="q"
                  type="search"
                  defaultValue={query.q ?? ""}
                  placeholder={t("catalog.searchPlaceholder")}
                  autoComplete="off"
                />
                <button className="btn btn-primary !h-12 !rounded-[16px] !px-5" type="submit">
                  <span className="hidden sm:inline">{t("landing.searchSubmit")}</span>
                  <ArrowRight className="i i-arrow sm:hidden" aria-hidden />
                  <span className="sr-only sm:hidden">{t("landing.searchSubmit")}</span>
                </button>
              </div>
              {/* A GET form replaces the whole query string, so the active
                  filters ride along as hidden fields: searching narrows the
                  current selection instead of clearing it. A new search starts
                  on page one. */}
              {Object.entries(raw).map(([key, value]) =>
                value && key !== "q" && key !== "page" ? <input key={key} type="hidden" name={key} value={value} /> : null,
              )}
            </form>
          </div>
        </div>

        {/* The colourful category filter. */}
        {categories.length ? (
          <div className="wrap mt-8 lg:mt-10">
            <div className="scroller bleed pad-y" role="group" aria-label={t("catalog.category")}>
              <Link
                href={localeHref(locale, withParam(raw, "categoryId", null))}
                className="cat-mini k-navy"
                aria-pressed={!query.categoryId}
                scroll={false}
              >
                <span className="sw grid place-items-center !bg-[var(--brand-navy)] text-white">
                  <LayoutGrid className="i" aria-hidden />
                </span>
                <span>
                  <b>{t("ui.allCourses")}</b>
                  <small>{t("ui.courseCount", { count: index.total })}</small>
                </span>
              </Link>
              {[...categories]
                .sort((a, b) => b.count - a.count)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={localeHref(locale, withParam(raw, "categoryId", query.categoryId === c.id ? null : c.id))}
                    className={cn("cat-mini", c.k, !c.count && "dim")}
                    aria-pressed={query.categoryId === c.id}
                    scroll={false}
                  >
                    <span className="sw">
                      <Svg markup={swatchSvg(c.art)} />
                    </span>
                    <span>
                      <b>{c.short}</b>
                      <small>{c.count > 0 ? t("ui.courseCount", { count: c.count }) : t("ui.noCoursesYet")}</small>
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ============ 2. BODY: filters + results ============ */}
      <section className="wrap pb-20 pt-6 lg:pb-28 lg:pt-8" aria-label={t("catalog.results")}>
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12">
          {!sparse ? (
            <aside className="hidden lg:col-span-3 lg:block" aria-label={t("catalog.filters")}>
              <FilterPanel categories={categories} />
            </aside>
          ) : null}

          <div className={cn("min-w-0", sparse ? "lg:col-span-12" : "lg:col-span-9")}>
            {!data ? (
              <div className="empty px-6 py-14 sm:py-20">
                <CloudOff className="i mx-auto !size-10 text-ink-3" aria-hidden />
                <h2 className="t-lg mt-6">{t("catalog.loadError")}</h2>
                <p className="mx-auto mt-2 max-w-md text-ink-2">{t("catalog.loadErrorHint")}</p>
                <LocaleLink href="/courses" className="btn btn-primary mt-7">
                  {t("catalog.retry")}
                </LocaleLink>
              </div>
            ) : (
              <>
                <div className="toolbar-sticky -mx-5 mb-6 flex flex-wrap items-center gap-3 px-5 py-3 sm:mx-0 sm:px-0 lg:static lg:mb-9 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
                  <p className="mr-auto font-display text-[20px] font-bold tracking-tight lg:text-[22px]">
                    {count > 0 ? t("ui.courseCount", { count }) : t("catalog.noResults")}
                  </p>
                  {!sparse ? (
                    <FilterSheet
                      categories={categories}
                      showLabel={count > 0 ? t("catalog.showResults", { count }) : t("catalog.close")}
                    />
                  ) : null}
                  {chips.length ? (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      {chips.map((c) => (
                        <Link key={c.label} href={localeHref(locale, c.href)} className="chip sm plain" scroll={false}>
                          {c.label} <X className="x" aria-label={t("catalog.remove")} />
                        </Link>
                      ))}
                      <LocaleLink
                        href={query.q ? `/courses?q=${encodeURIComponent(query.q)}` : "/courses"}
                        className="ml-1 text-[13.5px] font-semibold text-ink-2 underline decoration-line-2 underline-offset-4 hover:decoration-gold"
                      >
                        {t("catalog.clear")}
                      </LocaleLink>
                    </div>
                  ) : null}
                </div>

                {data.content.length === 0 ? (
                  <EmptyResult t={t} categories={categories.filter((c) => c.count > 0).slice(0, 4)} />
                ) : sparse && data.content.length < 3 ? (
                  <div className="grid gap-10">
                    {data.content.map((c) => (
                      <WideCourseCard
                        key={c.id}
                        course={c}
                        category={catFor(c.id)}
                        labels={labels}
                        initials={initialsOf(c.tutorDisplayName || "")}
                        cta
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 sm:gap-y-12 xl:grid-cols-3">
                    {data.content.map((c) => (
                      <CourseCard key={c.id} course={c} category={catFor(c.id)} labels={labels} resp />
                    ))}
                  </div>
                )}

                {sparse ? (
                  <div className="mt-10 grid items-center gap-6 rounded-[32px] bg-paper-2 p-6 sm:p-9 lg:grid-cols-[1fr_auto]">
                    <div className="flex items-start gap-5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-gold-tint text-gold-ink">
                        <Sparkles className="i" aria-hidden />
                      </span>
                      <div>
                        <p className="font-display text-[21px] font-bold tracking-tight">{t("catalog.openedTitle")}</p>
                        <p className="mt-1.5 max-w-xl text-ink-2">{t("catalog.openedText")}</p>
                      </div>
                    </div>
                    <LocaleLink href="/register/tutor" className="btn btn-ghost justify-self-start">
                      {t("catalog.applyExpert")} <ArrowRight className="i i-arrow" aria-hidden />
                    </LocaleLink>
                  </div>
                ) : null}

                <Pager
                  page={data.page}
                  totalPages={data.totalPages}
                  total={data.totalElements}
                  size={data.size}
                  raw={raw}
                  locale={locale}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============ 3. HELP BAND ============ */}
      {!sparse ? (
        <section className="pb-20 lg:pb-28" aria-labelledby="help-t">
          <div className="wrap">
            <div className="relative isolate grid items-center gap-8 overflow-hidden rounded-[36px] bg-paper-2 p-7 sm:p-10 lg:grid-cols-12 lg:p-12">
              <div className="lg:col-span-7">
                <h2 id="help-t" className="d-md">
                  {t("catalog.helpTitle")}
                </h2>
                <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-ink-2">{t("catalog.helpText")}</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
                <LocaleLink href="/register/tutor" className="btn btn-primary">
                  {t("catalog.applyExpert")} <ArrowRight className="i i-arrow" aria-hidden />
                </LocaleLink>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-ghost">
                  <Mail className="i" aria-hidden />
                  {t("landing.writeUs")}
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function EmptyResult({
  t,
  categories,
}: {
  t: Awaited<ReturnType<typeof getT>>;
  categories: { id: string; name: string; k: string; art: import("@/lib/art").ArtKind }[];
}) {
  return (
    <div className="empty k-it relative overflow-hidden px-6 py-14 sm:py-20">
      <svg viewBox="0 0 240 150" className="mx-auto w-[220px]" aria-hidden>
        <circle cx="120" cy="75" r="70" className="f100" />
        <path
          className="grid"
          d="M60 20V130M80 20V130M100 20V130M120 20V130M140 20V130M160 20V130M180 20V130M60 40H180M60 60H180M60 80H180M60 100H180M60 120H180"
          opacity=".7"
        />
        <circle cx="108" cy="68" r="30" className="f0 s900" strokeWidth="8" />
        <path d="M130 90 L156 116" className="s900 rnd" strokeWidth="11" />
        <path d="M98 58 L118 78M118 58 L98 78" className="s500 rnd" strokeWidth="6" />
        <circle cx="172" cy="40" r="7" className="fg" />
      </svg>
      <h2 className="t-lg mt-6">{t("catalog.emptyTitle")}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-2">{t("catalog.emptyText")}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <LocaleLink href="/courses" className="btn btn-primary">
          {t("catalog.clearFilters")}
        </LocaleLink>
      </div>
      {categories.length ? (
        <div className="mx-auto mt-10 max-w-xl border-t border-line pt-8">
          <p className="kicker w-full justify-center">{t("catalog.tryTopics")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <LocaleLink key={c.id} href={`/courses?categoryId=${c.id}`} className={cn("chip", c.k)}>
                <span className="sw">
                  <Svg markup={swatchSvg(c.art)} />
                </span>
                {c.name}
              </LocaleLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Pager({
  page,
  totalPages,
  total,
  size,
  raw,
  locale,
  t,
}: {
  page: number;
  totalPages: number;
  total: number;
  size: number;
  raw: Record<string, string | undefined>;
  locale: Locale;
  t: Awaited<ReturnType<typeof getT>>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) if (v && k !== "page") u.set(k, v);
    if (p > 0) u.set("page", String(p));
    const qs = u.toString();
    return localeHref(locale, `/courses${qs ? `?${qs}` : ""}`);
  };
  // A window of up to five page numbers around the current one.
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  return (
    <nav
      className="mt-14 flex flex-col items-center justify-between gap-5 border-t border-line pt-8 sm:flex-row lg:mt-20"
      aria-label={t("catalog.pages")}
    >
      <p className="order-2 text-[14px] text-ink-3 sm:order-1">{t("catalog.showing", { from, to, total })}</p>
      <div className="pager order-1 sm:order-2">
        {page > 0 ? (
          <Link href={href(page - 1)} aria-label={t("ui.prev")}>
            <ChevronLeft className="i" aria-hidden />
          </Link>
        ) : (
          <span className="opacity-40" aria-hidden>
            <ChevronLeft className="i" />
          </span>
        )}
        {pages.map((p) => (
          <Link key={p} href={href(p)} aria-current={p === page ? "page" : undefined}>
            {p + 1}
          </Link>
        ))}
        {page < totalPages - 1 ? (
          <Link href={href(page + 1)} className="!flex !w-auto items-center gap-1.5 !px-4">
            {t("ui.next")} <ChevronRight className="i !size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

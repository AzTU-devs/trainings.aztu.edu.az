import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LinkGo } from "@/components/ui/link-go";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { PageIntro } from "@/components/common/PageIntro";
import { Dept } from "@/components/editorial/Dept";
import { Kicker } from "@/components/editorial/Kicker";
import { categoryServerApi } from "@/features/category/api.server";
import type { CategoryRef } from "@/features/category/style";
import { allPublishedCourses, getCategoryIndex, type CategoryIndex } from "@/features/course/catalog.server";
import { expertServerApi } from "@/features/expert/api.server";
import { listExperts } from "@/features/expert/directory.server";
import { ExpertInviteRow, ExpertRow } from "@/features/expert/components/ExpertCard";
import {
  ExpertHoverPanel,
  ExpertHoverProvider,
  ExpertHoverTrigger,
} from "@/features/expert/components/ExpertHover";
import { ExpertPanel, ExpertSpread, expertCategory } from "@/features/expert/components/ExpertSpread";
import type { ExpertSummary } from "@/features/expert/types";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { formatNumber } from "@/lib/utils/format";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return {
    title: t("experts.metaTitle"),
    description: t("experts.metaDescription"),
  };
}

/**
 * The category index, read only to colour the portraits (IMPLEMENTATION §3.5).
 * Cached for this page's own 300 s (`listCached`, not the uncached `list()`,
 * which would make the page render per request just for a colour). A failure
 * costs only the colours: every portrait falls back to AzTU navy.
 */
async function loadIndex(): Promise<CategoryIndex | null> {
  try {
    return await getCategoryIndex(await categoryServerApi.listCached(300), { revalidate: 300 });
  } catch {
    return null;
  }
}

/**
 * Each expert's most-enrolled course, the colour's fallback when their
 * profile names no live category. Read from the same cached catalogue walk
 * `listExperts()` just made (shared fetch entries), so it costs no request.
 */
async function topCourses(): Promise<Map<string, string>> {
  const all = await allPublishedCourses().catch(() => null);
  const best = new Map<string, { id: string; enrolled: number }>();
  for (const c of all?.courses ?? []) {
    if (!c.tutorId) continue;
    const cur = best.get(c.tutorId);
    if (!cur || c.enrolledCount > cur.enrolled) best.set(c.tutorId, { id: c.id, enrolled: c.enrolledCount });
  }
  return new Map([...best].map(([tutor, { id }]) => [tutor, id]));
}

export default async function ExpertsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const [experts, index, tops] = await Promise.all([listExperts(), loadIndex(), topCourses()]);
  const n = experts.length;
  // The spread (one expert) shows the start of the bio, which the summary
  // does not carry: the same cached profile fetch the directory just made.
  const solo =
    n === 1 ? await expertServerApi.byId(experts[0].id).catch(() => null) : null;

  const colour = (e: ExpertSummary): CategoryRef | null =>
    expertCategory(e, index, tops.get(e.id), t, locale);
  const courseTotal = experts.reduce((sum, e) => sum + e.courseCount, 0);

  return (
    <>
      <PageIntro
        breadcrumbs={
          // -my-1.5 cancels the crumbs' tap padding, as the catalogue head
          // does, so the crumbs, kicker and h1 sit at the same heights on
          // /courses and here and the headline does not jump between them.
          <div className="-my-1.5">
            <Breadcrumbs
              items={[
                { label: t("common.home"), href: localeHref(locale, "/") },
                { label: t("nav.experts") },
              ]}
            />
          </div>
        }
        eyebrow={t("experts.eyebrow")}
        title={t("experts.title")}
        count={n ? formatNumber(n, locale) : undefined}
        description={t("experts.subtitle")}
        aside={
          <div className="flex lg:justify-end lg:pb-2">
            <LinkGo href={localeHref(locale, "/register/tutor")}>{t("experts.applyCta")}</LinkGo>
          </div>
        }
      />

      {n === 0 ? (
        <section className="wrap pb-(--section-y) pt-12 lg:pt-16">
          <EmptyState
            plate={t("experts.expertCount", { n: formatNumber(0, locale), count: 0 })}
            title={t("experts.empty")}
            description={t("experts.emptyHint")}
            headingLevel="h2"
            action={
              <Link href={localeHref(locale, "/register/tutor")} className={buttonVariants()}>
                {t("experts.applyCta")}
                <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
              </Link>
            }
          />
        </section>
      ) : n === 1 ? (
        <section className="wrap pb-(--section-y) pt-12 lg:pt-16">
          {/* "All experts" would read oddly over a single person: the opener
              states the count instead. */}
          <Dept number="01" label={t("experts.expertCount", { n: formatNumber(1, locale), count: 1 })} as="span" />
          <ExpertSpread
            className="mt-10 lg:mt-14"
            expert={experts[0]}
            bio={solo?.approvalStatus === "APPROVED" ? solo.bio : null}
            category={colour(experts[0])}
            locale={locale}
            kicker={t("experts.soloKicker")}
            invite
          />
        </section>
      ) : (
        <section className="wrap pb-(--section-y) pt-12 lg:pt-16" aria-labelledby="experts-list">
          <Dept
            number="01"
            id="experts-list"
            label={t("experts.listLabel")}
            aside={
              <Kicker as="span" className="text-ink-2">
                {t("experts.expertCount", { n: formatNumber(n, locale), count: n })}
                {/* The course total is extra; on the narrowest phones it
                    would crowd the label, so it starts at sm. */}
                {courseTotal > 0 ? (
                  <span className="hidden sm:inline">
                    {` · ${t("ui.courseCount", { n: formatNumber(courseTotal, locale), count: courseTotal })}`}
                  </span>
                ) : null}
              </Kicker>
            }
          />
          <ExpertHoverProvider
            initialId={experts[0].id}
            panels={Object.fromEntries(
              experts.map((e) => [e.id, <ExpertPanel key={e.id} expert={e} category={colour(e)} locale={locale} />]),
            )}
          >
            <div className="g12 mt-8 lg:mt-12">
              {/* The portrait follows the row being pointed at or focused.
                  Desktop only: on narrower screens every row carries its
                  own avatar and a panel would push the list down. */}
              <div className="hidden lg:col-span-3 lg:block">
                <ExpertHoverPanel className="sticky top-[calc(var(--hdr)+2rem)]" />
              </div>
              <ol className="col-span-4 md:col-span-8 lg:col-span-8 lg:col-start-5">
                {experts.map((e, i) => (
                  <ExpertHoverTrigger key={e.id} id={e.id} as="li" className="block border-b border-line">
                    <ExpertRow expert={e} category={colour(e)} locale={locale} number={i + 1} />
                  </ExpertHoverTrigger>
                ))}
                <li className="pt-8">
                  <ExpertInviteRow locale={locale} />
                </li>
              </ol>
            </div>
          </ExpertHoverProvider>
        </section>
      )}
    </>
  );
}

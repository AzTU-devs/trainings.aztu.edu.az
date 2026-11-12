import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, GraduationCap, History, Languages, Layers, ScrollText, Users } from "lucide-react";
import { categoryOf, categoryOfExpert, indexFor } from "@/features/course/catalog-index.server";
import { courseLabels } from "@/features/course/labels";
import { mediaSrc } from "@/features/course/media";
import { CourseCard } from "@/features/course/components/CourseCard";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { expertAreas } from "@/features/expert/areas";
import { ExpertAreaChips } from "@/features/expert/components/ExpertAreas";
import { ExpertPortrait } from "@/features/expert/components/ExpertPortrait";
import { externalHref, orcidHref } from "@/features/expert/links";
import { fullExpertName, type ExpertProfile } from "@/features/expert/types";
import { SHOWCASE } from "@/features/showcase/flag";
import { coursesByExpertSource, expertProfileSource, isSampleExpert } from "@/features/showcase/source.server";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/layout/PageHeader";
import { StarIcon } from "@/components/bright/bits";
import { env } from "@/lib/env";
import { formatCompact, formatRating } from "@/lib/utils/format";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lang } = await params;
  const expert = await expertProfileSource(id);
  if (!expert) {
    const t = await getT(isLocale(lang) ? lang : defaultLocale);
    // The page is a "not found" notice; nothing there for a search engine.
    return { title: t("experts.metaFallback"), robots: { index: false, follow: true } };
  }
  const affiliation = [expert.academicTitle, expert.department].filter(Boolean).join(", ");
  return {
    title: fullExpertName(expert),
    description: expert.headline || affiliation || expert.bio?.slice(0, 160) || undefined,
    // A sample expert's page exists only for the sample courses that name
    // them; like those courses, search engines should not list it.
    robots: isSampleExpert(id) ? { index: false, follow: true } : undefined,
  };
}

/** Free-text profile fields hold one item per line. */
const lines = (text: string | null | undefined) =>
  (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•–·]\s+/, "").trim())
    .filter(Boolean);

export default async function PublicExpertPage({ params }: Props) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  // A real expert is matched against the real categories and courses even
  // while the catalogue shows samples; a sample expert (reached from a sample
  // course) against the sample ones. Their ids exist only on their own side.
  const sample = isSampleExpert(id);
  const [expert, courses, index] = await Promise.all([
    expertProfileSource(id).catch((): ExpertProfile | null => null),
    coursesByExpertSource(id).catch(() => []),
    indexFor(sample),
  ]);

  // An unknown, pending or rejected expert: a notice with a way back, rather
  // than a bare 404 page without the site around it.
  if (!expert || expert.approvalStatus !== "APPROVED") {
    return (
      <div className="wrap py-16 sm:py-24">
        <div className="empty mx-auto max-w-2xl px-6 py-14">
          <h1 className="t-lg">{t("experts.notFoundTitle")}</h1>
          <p className="mx-auto mt-2 max-w-md text-ink-2">{t("experts.notFoundHint")}</p>
          <LocaleLink href="/experts" className="btn btn-ghost mt-7">
            <ArrowLeft className="i" aria-hidden />
            {t("experts.backToExperts")}
          </LocaleLink>
        </div>
      </div>
    );
  }

  const name = fullExpertName(expert);
  const main = categoryOfExpert(index, expert) ?? (courses[0] ? categoryOf(index, courses[0].id) : null);
  const k = categoryStyle(main).k;
  // A category chip filters the catalogue by that category, which only works
  // when the catalogue lists the same side as this expert: a real expert's
  // category ids match nothing in the sample catalogue, so while it shows,
  // their chips stay plain labels.
  const catalogueMatches = sample || !SHOWCASE;
  const { picked, own } = expertAreas(index.categories, expert, t, locale, {
    href: catalogueMatches ? (c) => `/courses?categoryId=${c.id}` : undefined,
  });
  // The label above the name shows one area (or a course's category when
  // they picked none); the chips list them all once that leaves any out.
  const labelIsArea = main ? picked.some((p) => p.id === main.id) : own.length > 0;
  const showAreas = picked.length + own.length > (labelIsArea ? 1 : 0);
  const labels = courseLabels(t, locale);
  const enrolled = courses.reduce((s, c) => s + c.enrolledCount, 0);

  const links = [
    ["Google Scholar", externalHref(expert.googleScholarUrl)],
    ["ResearchGate", externalHref(expert.researchGateUrl)],
    ["ORCID", orcidHref(expert.orcid)],
    ["GitHub", externalHref(expert.githubUrl)],
    ["LinkedIn", externalHref(expert.linkedinUrl)],
    [t("expertsPage.website"), externalHref(expert.websiteUrl)],
  ].filter((l): l is [string, string] => !!l[1]);

  const details: [React.ReactNode, string, string[]][] = [
    [<GraduationCap key="e" className="i" aria-hidden />, t("expertsPage.education"), lines(expert.education)],
    [<ScrollText key="c" className="i" aria-hidden />, t("expertsPage.certifications"), lines(expert.certifications)],
    [<Languages key="l" className="i" aria-hidden />, t("expertsPage.languages"), expert.languages ? [expert.languages] : []],
  ].filter((d) => (d[2] as string[]).length) as [React.ReactNode, string, string[]][];

  return (
    <>
      <div className={k}>
        <section className="page-head wrap" aria-labelledby="x-title">
          <Breadcrumb
            label={t("ui.breadcrumb")}
            items={[{ label: t("ui.home"), href: "/" }, { label: t("ui.navExperts"), href: "/experts" }, { label: name }]}
          />
          <div className="mt-6 grid items-start gap-6 sm:grid-cols-[160px_1fr] sm:gap-10 lg:mt-8 lg:grid-cols-[200px_1fr]">
            <ExpertPortrait name={name} avatarUrl={expert.avatarUrl} sizes="200px" className="panel aspect-square w-[120px] text-[36px] sm:w-full sm:text-[48px]" />
            <div className="min-w-0">
              {main ? (
                <span className="cat-label">{categoryLabel(main, t, locale)}</span>
              ) : own[0] ? (
                <span className="own-label" title={t("expertsPage.ownArea")}>
                  {own[0]}
                </span>
              ) : null}
              <h1 id="x-title" className="d-lg mt-3">
                {name}
              </h1>
              {expert.academicTitle || expert.department ? (
                <p className="mt-2 text-[17px] text-ink-2">{[expert.academicTitle, expert.department].filter(Boolean).join(", ")}</p>
              ) : null}
              {expert.headline ? <p className="mt-1 text-[16px] text-ink-2">{expert.headline}</p> : null}
              <div className="meta mt-5 !text-[14.5px]">
                {expert.ratingCount > 0 ? (
                  <span className="rate">
                    <StarIcon />
                    {formatRating(expert.ratingAvg, locale)}
                  </span>
                ) : null}
                <span>
                  <Layers className="i" aria-hidden />
                  {t("ui.courseCount", { count: courses.length })}
                </span>
                {enrolled ? (
                  <span>
                    <Users className="i" aria-hidden />
                    {t("landing.participants", { count: enrolled })}
                  </span>
                ) : null}
                {expert.yearsExperience ? (
                  <span>
                    <History className="i" aria-hidden />
                    {t("course2.years", { count: expert.yearsExperience })}
                  </span>
                ) : null}
              </div>
              {links.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {links.map(([label, href]) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="chip sm plain">
                      {label} <ArrowUpRight className="i !size-4 text-ink-3" aria-hidden />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="wrap">
        <div className="grid gap-10 border-t border-line py-12 lg:grid-cols-12 lg:gap-16 lg:py-16">
          <div className="lg:col-span-7">
            <h2 className="d-md">{t("expertsPage.about")}</h2>
            <p className="mt-4 max-w-2xl text-[16.5px] leading-[1.7] text-ink-2">
              {expert.bio || expert.headline || t("expertsPage.noBio")}
            </p>
            {showAreas ? (
              <ExpertAreaChips className="mt-8" picked={picked} own={own} ownTitle={t("expertsPage.ownArea")} />
            ) : null}
          </div>
          {details.length ? (
            // One card, a section per field. The fields are part of "About",
            // so their titles are h3s under its h2.
            <div className="divide-y divide-line self-start rounded-[16px] bg-surface shadow-[0_0_0_1px_var(--line)] lg:col-span-5">
              {details.map(([icon, title, items]) => (
                <section key={title} className="p-5 sm:px-6">
                  <h3 className="flex items-center gap-3 font-semibold">
                    <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-surface-2 text-ink-2 [&_.i]:!size-[17px]">
                      {icon}
                    </span>
                    {title}
                  </h3>
                  <ul className="mt-3 grid gap-1.5 pl-11 text-[15px] text-ink-2">
                    {items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </div>
        </div>
      </div>

      <section className="wrap pb-16 lg:pb-24" aria-labelledby="xc-title">
        <h2 id="xc-title" className="d-md border-t border-line pt-12 lg:pt-16">
          {t("expertsPage.courses")}
        </h2>
        {courses.length ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((c) => {
              const cat = categoryOf(index, c.id);
              return (
                <CourseCard
                  key={c.id}
                  course={c}
                  category={cat ? { name: categoryLabel(cat, t, locale), style: categoryStyle(cat) } : null}
                  labels={labels}
                  resp
                />
              );
            })}
          </div>
        ) : (
          <div className="soft-empty mt-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-surface text-ink-3 shadow-[0_0_0_1px_var(--line)]">
              <BookOpen className="i" aria-hidden />
            </span>
            <p className="font-semibold">{t("expertsPage.noCourses")}</p>
          </div>
        )}
        <p className="mt-8 text-[14px] text-ink-3">{t("expertsPage.participantsNote", { count: formatCompact(enrolled, locale) })}</p>
      </section>

      {/* Real experts only, like the course page's Course data. Every value is
          plain text: names and areas are plain by construction, and JsonLd
          escapes what could close its <script>. */}
      {!sample ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name,
            url: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/${locale}/experts/${expert.id}`,
            image: mediaSrc(expert.avatarUrl) ?? undefined,
            jobTitle: expert.academicTitle || undefined,
            description: expert.headline || undefined,
            knowsAbout: [...picked.map((c) => c.name), ...own],
            sameAs: links.length ? links.map(([, href]) => href) : undefined,
          }}
        />
      ) : null}
    </>
  );
}

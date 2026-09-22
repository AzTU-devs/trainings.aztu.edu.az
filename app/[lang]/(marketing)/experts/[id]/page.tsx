import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, GraduationCap, History, Languages, Layers, ScrollText, Users } from "lucide-react";
import { categoryOf, getCatalogIndex } from "@/features/course/catalog-index.server";
import { courseLabels } from "@/features/course/labels";
import { CourseCard } from "@/features/course/components/CourseCard";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { ExpertArch } from "@/features/expert/components/ExpertArch";
import { externalHref, orcidHref } from "@/features/expert/links";
import { fullExpertName, type ExpertProfile } from "@/features/expert/types";
import { coursesByExpertSource, expertProfileSource } from "@/features/showcase/source.server";
import { StarIcon } from "@/components/bright/bits";
import { formatCompact, formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
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
    return { title: t("experts.metaFallback") };
  }
  const affiliation = [expert.academicTitle, expert.department].filter(Boolean).join(", ");
  return {
    title: fullExpertName(expert),
    description: expert.headline || affiliation || expert.bio?.slice(0, 160) || undefined,
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

  const [expert, courses, index] = await Promise.all([
    expertProfileSource(id).catch((): ExpertProfile | null => null),
    coursesByExpertSource(id).catch(() => []),
    getCatalogIndex(),
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
  const expertise = index.categories.filter((c) => expert.expertiseCategoryIds.includes(c.id));
  const main = expertise[0] ?? (courses[0] ? categoryOf(index, courses[0].id) : null);
  const k = categoryStyle(main).k;
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
      <div className={cn("c-page overflow-x-clip", k)}>
        <div className="wrap">
          <section className="c-hero-row grid items-end gap-8 pb-16 pt-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-12 lg:pb-20 lg:pt-12" aria-labelledby="x-title">
            <div className="max-w-[15rem]">
              <ExpertArch id={expert.id} name={name} avatarUrl={expert.avatarUrl} k={k} className="shadow-[0_0_0_1.5px_var(--k-200),var(--shadow-md)]" />
            </div>
            <div className="pb-2">
              <nav aria-label={t("ui.breadcrumb")} className="crumbs flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
                <LocaleLink href="/">{t("ui.home")}</LocaleLink>
                <span aria-hidden>/</span>
                <LocaleLink href="/experts">{t("ui.navExperts")}</LocaleLink>
              </nav>
              {main ? (
                <div className="mt-5">
                  <span className="cat-label">{categoryLabel(main, t, locale)}</span>
                </div>
              ) : null}
              <h1 id="x-title" className="d-lg mt-3">
                {name}
              </h1>
              {expert.academicTitle || expert.department ? (
                <p className="sub mt-3 text-[17px]">{[expert.academicTitle, expert.department].filter(Boolean).join(", ")}</p>
              ) : null}
              {expert.headline ? <p className="sub mt-2 text-[16px]">{expert.headline}</p> : null}
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
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="chip plain">
                      {label} <ArrowUpRight className="i !size-4" aria-hidden />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <div className="grid gap-10 py-14 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-7">
              <h2 className="d-md">{t("expertsPage.about")}</h2>
              <p className="mt-5 max-w-2xl text-[16.5px] leading-[1.7] text-ink-2">
                {expert.bio || expert.headline || t("expertsPage.noBio")}
              </p>
              {expertise.length > 1 ? (
                <div className="mt-8 flex flex-wrap gap-2">
                  {expertise.map((c) => (
                    <LocaleLink key={c.id} href={`/courses?categoryId=${c.id}`} className={cn("chip plain", categoryStyle(c).k)}>
                      {categoryLabel(c, t, locale)}
                    </LocaleLink>
                  ))}
                </div>
              ) : null}
            </div>
            {details.length ? (
              <div className="grid gap-4 lg:col-span-5">
                {details.map(([icon, title, items]) => (
                  <div key={title} className="rounded-[26px] bg-surface p-6 shadow-[0_0_0_1px_var(--line)]">
                    <p className="flex items-center gap-2 font-semibold">
                      {icon}
                      {title}
                    </p>
                    <ul className="mt-3 grid gap-1.5 text-[15px] text-ink-2">
                      {items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="wrap pb-20 lg:pb-28" aria-labelledby="xc-title">
        <h2 id="xc-title" className="d-md">
          {t("expertsPage.courses")}
        </h2>
        {courses.length ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((c) => {
              const cat = categoryOf(index, c.id);
              return (
                <CourseCard
                  key={c.id}
                  course={c}
                  category={cat ? { name: categoryLabel(cat, t, locale), style: categoryStyle(cat) } : null}
                  labels={labels}
                />
              );
            })}
          </div>
        ) : (
          <div className="soft-empty mt-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-surface text-ink-3 shadow-[0_0_0_1px_var(--line)]">
              <BookOpen className="i" aria-hidden />
            </span>
            <p className="font-semibold">{t("expertsPage.noCourses")}</p>
          </div>
        )}
        <p className="mt-10 text-[14px] text-ink-3">{t("expertsPage.participantsNote", { count: formatCompact(enrolled, locale) })}</p>
      </section>
    </>
  );
}

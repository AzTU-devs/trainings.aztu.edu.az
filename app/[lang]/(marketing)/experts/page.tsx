import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Layers, Users } from "lucide-react";
import { categoryOfExpert, getCatalogIndex } from "@/features/course/catalog-index.server";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { ExpertArch } from "@/features/expert/components/ExpertArch";
import { listExpertsSource } from "@/features/showcase/source.server";
import { StarIcon } from "@/components/bright/bits";
import { formatCompact, formatRating } from "@/lib/utils/format";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";

// Rendered per request, never at build time: the image build has no API
// access, and a directory prerendered there was cached as "No experts yet"
// until the first revalidation after every deploy. The data fetches below
// carry their own caching.
export const revalidate = 0;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const t = await getT(isLocale(lang) ? lang : "az");
  return { title: t("expertsPage.title"), description: t("expertsPage.sub") };
}

export default async function ExpertsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);
  const [experts, index] = await Promise.all([listExpertsSource().catch(() => []), getCatalogIndex()]);

  const catOf = (id: string) => categoryOfExpert(index, id);

  return (
    <>
      <section className="relative isolate overflow-x-clip" aria-labelledby="ex-h1">
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
              {t("ui.navExperts")}
            </span>
          </nav>
          <div className="mt-4 grid items-end gap-x-8 gap-y-6 lg:grid-cols-12">
            <h1 id="ex-h1" className="d-lg lg:col-span-7">
              {t("expertsPage.title")}
            </h1>
            <p className="lead lg:col-span-5 lg:pb-1.5">{t("expertsPage.sub")}</p>
          </div>
        </div>
      </section>

      <section className="wrap pb-20 pt-12 lg:pb-28 lg:pt-16" aria-label={t("expertsPage.title")}>
        {experts.length ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {experts.map((e) => {
              const cat = catOf(e.id);
              return (
                <article key={e.id} className="xcard group relative">
                  <ExpertArch id={e.id} name={e.displayName} avatarUrl={e.avatarUrl} k={categoryStyle(cat).k} />
                  <div className="px-1 pt-4">
                    {cat ? <span className={`cat-label ${categoryStyle(cat).k}`}>{categoryLabel(cat, t, locale)}</span> : null}
                    <h2 className="t-md mt-2">
                      <LocaleLink href={`/experts/${e.id}`} className="stretched">
                        {e.displayName}
                      </LocaleLink>
                    </h2>
                    {e.academicTitle || e.headline ? (
                      <p className="clamp-2 mt-1 text-[14px] text-ink-2">
                        {[e.academicTitle, e.headline ?? e.department].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
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
              );
            })}
            <Invite t={t} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="soft-empty">
              <div>
                <p className="font-semibold">{t("expertsPage.empty")}</p>
                <p className="mt-0.5 text-[15px] text-ink-2">{t("expertsPage.emptyHint")}</p>
              </div>
            </div>
            <Invite t={t} />
          </div>
        )}
      </section>
    </>
  );
}

function Invite({ t }: { t: Awaited<ReturnType<typeof getT>> }) {
  return (
    <div className="k-gold relative isolate flex flex-col overflow-hidden rounded-[30px] bg-[var(--k-100)] p-7 text-[var(--k-900)]">
      <svg className="absolute -right-10 -top-10 -z-10 w-40" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="40" className="s300 fnone" strokeWidth="8" />
        <circle cx="50" cy="50" r="16" className="f300" />
      </svg>
      <p className="font-display text-[22px] font-bold tracking-tight">{t("landing.shareTitle")}</p>
      <p className="mt-2 max-w-[17rem] text-[15px] opacity-85">{t("landing.shareText")}</p>
      <LocaleLink href="/register/tutor" className="btn btn-primary btn-sm mt-6 self-start">
        {t("landing.shareCta")} <ArrowRight className="i i-arrow" aria-hidden />
      </LocaleLink>
    </div>
  );
}

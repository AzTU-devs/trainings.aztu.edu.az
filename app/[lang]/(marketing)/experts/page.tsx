import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { categoryOfExpert, indexFor } from "@/features/course/catalog-index.server";
import { categoryStyle } from "@/features/category/style";
import { expertAreas } from "@/features/expert/areas";
import { ExpertAreaLabels } from "@/features/expert/components/ExpertAreas";
import { ExpertCard } from "@/features/expert/components/ExpertCard";
import { SHOWCASE_EXPERTS } from "@/features/showcase/flag";
import { listExpertsSource } from "@/features/showcase/source.server";
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
  // The experts are real (unless SHOWCASE_EXPERTS brings back the samples), so
  // their areas are matched against the real categories, never the sample
  // catalogue's: a real expert's category ids exist only there.
  const [experts, index] = await Promise.all([listExpertsSource().catch(() => []), indexFor(SHOWCASE_EXPERTS)]);

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
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {experts.map((e) => {
              const main = categoryOfExpert(index, e);
              const { picked, own } = expertAreas(index.categories, e, t, locale, { fallback: main });
              return (
                <ExpertCard
                  key={e.id}
                  expert={e}
                  k={categoryStyle(main).k}
                  t={t}
                  locale={locale}
                  heading="h2"
                  areas={<ExpertAreaLabels picked={picked} own={own} ownTitle={t("expertsPage.ownArea")} />}
                />
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

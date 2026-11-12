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
import { PageHeader } from "@/components/layout/PageHeader";
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
      <PageHeader
        id="ex-h1"
        title={t("expertsPage.title")}
        lead={t("expertsPage.sub")}
        crumbs={[{ label: t("ui.home"), href: "/" }, { label: t("ui.navExperts") }]}
        crumbsLabel={t("ui.breadcrumb")}
      />

      <section className="wrap pb-16 pt-2 lg:pb-24" aria-label={t("expertsPage.title")}>
        {experts.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
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

/** The last cell of the grid: the way in for someone who would like to teach. */
function Invite({ t }: { t: Awaited<ReturnType<typeof getT>> }) {
  return (
    <div className="flex flex-col rounded-[16px] bg-paper-2 p-5 sm:p-6">
      <p className="t-md">{t("landing.shareTitle")}</p>
      <p className="mt-2 text-[14.5px] text-ink-2">{t("landing.shareText")}</p>
      <LocaleLink href="/register/tutor" className="btn btn-primary btn-sm mt-6 self-start">
        {t("landing.shareCta")} <ArrowRight className="i i-arrow" aria-hidden />
      </LocaleLink>
    </div>
  );
}

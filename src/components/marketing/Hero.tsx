import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Building2, ChartNoAxesColumn, Monitor } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { bakuDate, formatNumber } from "@/lib/utils/format";
import { catAttrs } from "@/features/category/style";
import { PAYMENTS_ENABLED } from "@/features/course/payments";
import { Shield } from "@/components/layout/AztuMark";
import { CoverArt } from "@/components/cover/CoverArt";
import { Dateline } from "@/components/editorial/Dateline";
import { Highlight } from "@/components/editorial/Highlight";
import { LinkGo } from "@/components/ui/link-go";
import { QuickChip } from "@/components/ui/chip";
import { SearchField } from "@/components/ui/search-field";
import { buttonVariants } from "@/components/ui/button";
import { loadStats } from "./HomeData";
import { SignedOutSwap } from "./SignedOutSwap";
import s from "./Hero.module.css";

/** The shortcuts under the search appear only once the catalogue is big enough to need them. */
const QUICK_CHIPS_FROM = 7;

/** Inline custom properties for one line or tile of the animated headline. */
const vars = (v: Record<string, string | number>) => v as CSSProperties;

/**
 * The masthead: the dateline, the two-line headline with the AzTU seal and
 * two poster tiles set inside the words, the search and the lead with the two
 * calls to action. Everything here is static except `updated` (the dateline
 * date) and `quick` (the chips with real counts), which the page streams in
 * through <Suspense> so the headline never waits for the API.
 */
export async function Hero({
  locale,
  updated,
  quick,
}: {
  locale: Locale;
  updated: ReactNode;
  quick: ReactNode;
}) {
  const t = await getT(locale);
  const catalogue = localeHref(locale, "/courses");

  return (
    <section className="wrap pt-4 lg:pt-5" aria-labelledby="home-h1">
      <Dateline items={[t("home.university"), t("home.datelinePlatform"), updated]} />

      {/* The tiles are aria-hidden, so the heading reads as the plain sentence. */}
      <h1 id="home-h1" className="t-display-xxl mt-8 md:mt-10">
        <span className={s.line} style={vars({ "--i": 0 })}>
          <span>
            {/* Each tile stays on the line of the word before it. */}
            <span className="whitespace-nowrap">
              {t("home.heroL1a")}
              <span
                aria-hidden="true"
                className={cn(s.tile, s.seal)}
                style={vars({ "--w": ".74em", "--i": 0, marginLeft: ".2em" })}
              >
                <Shield className={s.sealMark} />
              </span>
            </span>{" "}
            {t("home.heroL1b")}
          </span>
        </span>{" "}
        <span className={s.line} style={vars({ "--i": 1 })}>
          <span>
            <span className="whitespace-nowrap">
              {t("home.heroL2")}
              <span
                aria-hidden="true"
                {...catAttrs({ key: "eng" })}
                className={cn(s.tile, s.wide)}
                style={vars({ "--w": "1.32em", "--i": 1, marginLeft: ".18em" })}
              >
                <CoverArt cat="eng" seed={5} ratio={1.78} noTech className="absolute inset-0 size-full" />
              </span>
              <span
                aria-hidden="true"
                {...catAttrs({ key: "it" })}
                className={s.tile}
                style={vars({ "--w": ".74em", "--i": 2, marginLeft: ".14em" })}
              >
                <CoverArt cat="it" seed={7} ratio={1} noTech className="absolute inset-0 size-full" />
              </span>
            </span>{" "}
            <Highlight>{t("home.heroEmph")}</Highlight>
          </span>
        </span>
      </h1>

      <div className="g12 mt-8 items-start gap-y-8 lg:mt-10">
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          <SearchField
            id="hero-q"
            action={catalogue}
            placeholder={t("home.searchPlaceholder")}
            label={t("ui.searchLabel")}
            submitLabel={t("ui.searchSubmit")}
          />
          {quick}
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:col-start-9">
          {/* "Pulsuz" is only true while the API serves free courses alone. */}
          <p className="t-lead max-w-[44ch]">
            {t(PAYMENTS_ENABLED ? "home.heroLeadPaid" : "home.heroSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={catalogue} className={buttonVariants()}>
              {t("ui.browseCatalogue")}
              <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
            </Link>
            {/* A signed-in participant is sent to their courses, not to sign-up. */}
            <SignedOutSwap
              signedIn={<LinkGo href={localeHref(locale, "/my-courses")}>{t("home.goMyCourses")}</LinkGo>}
            >
              <LinkGo href={localeHref(locale, "/register")}>{t("common.signUp")}</LinkGo>
            </SignedOutSwap>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Kataloq yenilənib · 14 sentyabr 2026": the newest publish date, or nothing. */
export async function HeroUpdated({ locale }: { locale: Locale }) {
  const stats = await loadStats();
  const date = stats?.updatedAt ? bakuDate(stats.updatedAt, locale) : "";
  if (!date) return null;
  const t = await getT(locale);
  return <>{t("home.datelineUpdated", { date })}</>;
}

/**
 * Format and level shortcuts with their real counts, shown only from seven
 * courses (below that the catalogue is one screen anyway). Each chip appears
 * only when it leads somewhere non-empty; counts are dropped when the walk was
 * capped and they would be partial.
 */
export async function HeroQuickChips({ locale }: { locale: Locale }) {
  const stats = await loadStats();
  if (!stats || stats.apiTotal < QUICK_CHIPS_FROM) return null;
  const t = await getT(locale);
  const count = (n: number) => (stats.complete ? formatNumber(n, locale) : undefined);
  const chips = [
    { key: "online", href: "/courses?type=ONLINE", icon: Monitor, label: t("ui.onlineCourses"), n: stats.byType.ONLINE },
    { key: "offline", href: "/courses?type=OFFLINE", icon: Building2, label: t("ui.offlineCourses"), n: stats.byType.OFFLINE },
    {
      key: "beginner",
      href: "/courses?level=BEGINNER",
      icon: ChartNoAxesColumn,
      label: t("home.quickBeginner"),
      n: stats.byLevel.BEGINNER,
    },
  ].filter((c) => c.n > 0);
  if (!chips.length) return null;

  return (
    <ul className="qchips" aria-label={t("home.quickLinks")}>
      {chips.map((c) => (
        <li key={c.key} className="flex">
          <QuickChip href={localeHref(locale, c.href)} icon={c.icon} label={c.label} count={count(c.n)} />
        </li>
      ))}
    </ul>
  );
}

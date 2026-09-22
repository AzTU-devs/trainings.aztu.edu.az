import type { CSSProperties } from "react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { CoverArt } from "@/components/cover/CoverArt";
import type { CoverSpecial } from "@/components/cover/art";
import { Kicker } from "@/components/editorial/Kicker";
import { LinkGo } from "@/components/ui/link-go";
import { Reveal } from "@/components/motion";
import s from "./Spread.module.css";

/**
 * Fixed poster inks for the two flat product drawings: paper with navy and
 * gold for online, gold with navy and paper for in-person. They stay the same
 * at night, where they read as lit panels on the navy spread.
 */
const INKS: Record<CoverSpecial, CSSProperties> = {
  online: { "--cv-bg": "#f6f2ea", "--cv-fg": "#0b2a5b", "--cv-ac": "#c8a951" } as CSSProperties,
  offline: { "--cv-bg": "#c8a951", "--cv-fg": "#0b2a5b", "--cv-ac": "#f6f2ea" } as CSSProperties,
};

/**
 * The format diptych inside the navy spread: "Onlayn" and "Əyani" as the
 * typographic moment, each with its drawing, one true sentence about how it
 * works (enrolment is immediate for both, D3) and the real number of courses.
 * `null` counts mean the catalogue walk failed: the link then goes without a
 * number.
 */
export async function FormatDiptych({
  locale,
  online,
  offline,
}: {
  locale: Locale;
  online: number | null;
  offline: number | null;
}) {
  const t = await getT(locale);
  const sides = [
    {
      key: "online" as const,
      word: t("common.online"),
      title: t("home.onlineTitle"),
      body: t("home.onlineBody"),
      n: online,
      href: localeHref(locale, "/courses?type=ONLINE"),
      countKey: "home.onlineCount",
      allLabel: t("ui.onlineCourses"),
      none: t("home.onlineNone"),
      seed: 2,
    },
    {
      key: "offline" as const,
      word: t("common.offline"),
      title: t("home.offlineTitle"),
      body: t("home.offlineBody"),
      n: offline,
      href: localeHref(locale, "/courses?type=OFFLINE"),
      countKey: "home.offlineCount",
      allLabel: t("ui.offlineCourses"),
      none: t("home.offlineNone"),
      seed: 9,
    },
  ];

  return (
    <div className="g12 mt-10 gap-y-16 lg:mt-14">
      {sides.map((side, i) => (
        <Reveal key={side.key} delay={i * 0.08} className={cn("col-span-4 md:col-span-8 lg:col-span-6", s.fmtCol)}>
          <article className={s.fmt}>
            <Kicker className="text-spread-2">{t("home.formatKicker", { n: String(i + 1).padStart(2, "0") })}</Kicker>
            <h3 className={s.word}>{side.word}</h3>
            <span className={s.frame} style={INKS[side.key]}>
              <CoverArt cat="brand" seed={side.seed} ratio={16 / 9} special={side.key} className="absolute inset-0 size-full" />
            </span>
            <div>
              <p className="t-title-l text-spread-ink">{side.title}</p>
              <p className="t-body mt-3 max-w-[48ch] text-spread-2">{side.body}</p>
              <div className="mt-5">
                {side.n === 0 ? (
                  <p className="t-small text-spread-2">{side.none}</p>
                ) : (
                  <LinkGo href={side.href} className="text-spread-ink">
                    {side.n === null
                      ? side.allLabel
                      : t(side.countKey, { n: formatNumber(side.n, locale), count: side.n })}
                  </LinkGo>
                )}
              </div>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

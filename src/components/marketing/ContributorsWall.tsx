import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import type { CategoryRef } from "@/features/category/style";
import type { ExpertSummary } from "@/features/expert/types";
import { ExpertAvatar } from "@/features/expert/components/ExpertAvatar";
import { ExpertPanel, expertAffiliation } from "@/features/expert/components/ExpertSpread";
import {
  ExpertHoverPanel,
  ExpertHoverProvider,
  ExpertHoverTrigger,
} from "@/features/expert/components/ExpertHover";
import { LinkGo } from "@/components/ui/link-go";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/motion";
import s from "./Names.module.css";

/** Names on the wall; the rest are behind "və daha N ekspert". */
const WALL_CAP = 12;
/** Rows in the phone list, which has no room for a wall. */
const PHONE_ROWS = 5;

/** Azerbaijani collation (ç after c, ə after e, ş after s), whatever the page locale. */
const collator = new Intl.Collator("az");

/**
 * Home §04 with two or more experts. At ≥1024px the names are one Fraunces
 * paragraph (the twelve with the most participants, in alphabetical order),
 * each with its course count, and a sticky portrait panel at columns 1–3
 * follows the name pointed at or focused. Below 1024px it is a short avatar
 * list of the experts with the most participants and a link to all of them.
 *
 * A server component: the panels are rendered here and handed to the
 * experts area's hover island (ExpertHover), which only picks the visible one.
 */
export async function ContributorsWall({
  locale,
  experts,
  colourOf,
  headingId,
}: {
  locale: Locale;
  /** listExperts() order: most participants first. */
  experts: ExpertSummary[];
  colourOf: (expert: ExpertSummary) => CategoryRef | null;
  headingId: string;
}) {
  const t = await getT(locale);
  const wall = experts.slice(0, WALL_CAP).sort((a, b) => collator.compare(a.displayName, b.displayName));
  const more = experts.length - wall.length;
  const total = formatNumber(experts.length, locale);
  const panels = Object.fromEntries(
    wall.map((e) => [e.id, <ExpertPanel key={e.id} expert={e} category={colourOf(e)} locale={locale} />]),
  );
  const expertHref = (e: ExpertSummary) => localeHref(locale, `/experts/${e.id}`);
  const applyHref = localeHref(locale, "/register/tutor");

  return (
    <ExpertHoverProvider panels={panels} initialId={wall[0].id}>
      <div className="g12 mt-10 gap-y-10 lg:mt-14">
        <div className="hidden lg:col-span-3 lg:block">
          <ExpertHoverPanel className="sticky top-[calc(var(--hdr)+40px)]" />
        </div>

        <div className="col-span-4 min-w-0 md:col-span-8 lg:col-span-8 lg:col-start-5">
          <Reveal>
            <h2 id={headingId} className="t-display-l">
              {t("home.expertsTitle")}
            </h2>
            <p className="t-lead mt-5 max-w-[50ch]">{t("home.expertsDek")}</p>
          </Reveal>

          <Reveal className="hidden lg:block">
            {/* Each name travels with the slash after it as one unbreakable
                unit (Names.module.css .unit), and the plain spaces between
                units are the only line breaks: a line may end with "/" but
                never starts with one, and no name is split across lines. The
                slash sits outside the hover trigger, so pointing at it does
                not change the portrait. */}
            <p className={cn(s.names, "mt-14")}>
              {wall.map((e) => (
                <Fragment key={e.id}>
                  <span className={s.unit}>
                    <ExpertHoverTrigger id={e.id} className={s.name}>
                      <Link href={expertHref(e)}>
                        {e.displayName}
                        <sup aria-hidden="true" className={s.count}>
                          {String(e.courseCount).padStart(2, "0")}
                        </sup>
                      </Link>
                    </ExpertHoverTrigger>
                    <span aria-hidden="true" className={s.sep}>
                      {"\u00a0/"}
                    </span>
                  </span>{" "}
                </Fragment>
              ))}
              <Link href={applyHref} className={s.slot}>
                {t("home.yourName")}
              </Link>
              {more > 0 ? (
                <LinkGo href={localeHref(locale, "/experts")} className={s.more}>
                  {t("home.moreExperts", { n: formatNumber(more, locale), count: more })}
                </LinkGo>
              ) : null}
            </p>
          </Reveal>

          <ul className="mt-8 border-t border-line-strong lg:hidden">
            {experts.slice(0, PHONE_ROWS).map((e) => {
              const meta = expertAffiliation(e);
              return (
                <li key={e.id} className="border-b border-line">
                  <Link href={expertHref(e)} className="group flex items-center gap-4 py-4">
                    <ExpertAvatar
                      name={e.displayName}
                      avatarUrl={e.avatarUrl}
                      category={colourOf(e)}
                      size={52}
                      sizes="52px"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="t-title block break-words group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
                        {e.displayName}
                      </span>
                      {meta ? <span className="t-meta mt-0.5 block break-words">{meta}</span> : null}
                    </span>
                    <ArrowRight aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0 text-ink-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={localeHref(locale, "/experts")}
            className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full lg:hidden")}
          >
            {t("home.allExpertsN", { n: total })}
            <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
          </Link>

          <p className="t-body mt-10 border-t border-line pt-6 lg:mt-14">
            {t("home.shareKnowledge")} <LinkGo href={applyHref}>{t("home.applyAsExpert")}</LinkGo>
          </p>
        </div>
      </div>
    </ExpertHoverProvider>
  );
}

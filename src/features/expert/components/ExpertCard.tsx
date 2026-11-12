import type { ReactNode } from "react";
import { Layers, Users } from "lucide-react";
import { StarIcon } from "@/components/bright/bits";
import { LocaleLink } from "@/i18n/LocaleLink";
import type { TFunction } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatCompact, formatRating } from "@/lib/utils/format";
import type { ExpertSummary } from "../types";
import { ExpertPortrait } from "./ExpertPortrait";

/**
 * An expert in a grid (the experts directory, the home page): one card — the
 * portrait, then the areas, name, title line and figures — on a single
 * surface (`.card.expert-card` in globals.css). The name is the link,
 * stretched over the whole card. The card fills its grid cell, so a row
 * shares one height, and the figures sit on the bottom edge so they line up.
 */
export function ExpertCard({
  expert: e,
  k,
  t,
  locale,
  heading: Heading = "h3",
  areas,
  className,
}: {
  expert: ExpertSummary;
  /** Hue-engine class of the expert's main subject area (tints their area labels). */
  k: string;
  t: TFunction;
  locale: Locale;
  /** The name's heading level: h2 when the card sits directly under the page's h1. */
  heading?: "h2" | "h3";
  /** The area labels, when the grid shows them (the directory does). */
  areas?: ReactNode;
  className?: string;
}) {
  const byline = [e.academicTitle, e.headline ?? e.department].filter(Boolean).join(" · ");
  return (
    <article className={cn("card expert-card", k, className)}>
      <ExpertPortrait name={e.displayName} avatarUrl={e.avatarUrl} sizes="(min-width: 1024px) 25vw, 50vw" />
      <div className="body">
        {areas}
        <Heading className={cn("name", areas ? "mt-2" : null)}>
          <LocaleLink href={`/experts/${e.id}`} className="stretched">
            {e.displayName}
          </LocaleLink>
        </Heading>
        {byline ? <p className="clamp-2 mt-1 text-[14px] text-ink-2">{byline}</p> : null}
        <div className="meta">
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
}

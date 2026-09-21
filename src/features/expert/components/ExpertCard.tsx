import { ArrowRight, BookOpen, GraduationCap, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocaleLink } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils/cn";
import { formatCompact } from "@/lib/utils/format";
import type { ExpertSummary } from "../types";
import { ExpertAvatar } from "./ExpertAvatar";

export type ExpertCardLabels = {
  courses: string;
  students: string;
  online: string;
  offline: string;
  /**
   * Text for the pill at the foot of the card. Optional so existing callers
   * keep compiling; without it the pill shrinks to its arrow.
   */
  view?: string;
};

/**
 * A directory tile. The whole card is the link to the expert's profile, so the
 * "view profile" pill at the bottom is a styled span, not a nested anchor.
 *
 * From `sm` the portrait is the card's image, inset one radius step inside it
 * like a course cover; an expert without one gets their initials on the navy
 * gradient, which keeps a row of mixed cards the same height and family.
 *
 * Below `sm` every grid that uses this card (directory, home) is a single
 * column, and a full-width 4:3 cover per expert would turn a real directory
 * into a long scroll of giant initials. There the card is a compact row
 * instead: a small portrait beside the name and figures. Keyed to the
 * viewport rather than a container query because the grids go two-up at `sm`,
 * where each card is *narrower* than the single-column phone card, so width
 * alone cannot tell "one column" from "two".
 */
export function ExpertCard({
  expert,
  labels,
  locale,
}: {
  expert: ExpertSummary;
  labels: ExpertCardLabels;
  /** The page's locale, for number formatting — never the runtime default. */
  locale: string;
}) {
  const modes = [
    expert.online ? labels.online : null,
    expert.offline ? labels.offline : null,
  ].filter((m): m is string => Boolean(m));
  const affiliation = [expert.academicTitle, expert.department]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
  // Rating only once someone has rated: a 0.0 on a new expert reads as a bad
  // score rather than as "not rated yet".
  const rated = expert.ratingCount > 0;

  return (
    <LocaleLink
      href={`/experts/${expert.id}`}
      prefetch
      className="group flex h-full items-center gap-4 rounded-3xl border border-border/80 bg-card p-2.5 elev-1 transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:elev-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-col sm:items-stretch sm:gap-0 sm:p-2"
    >
      <div className="relative shrink-0">
        <ExpertAvatar
          name={expert.displayName}
          avatarUrl={expert.avatarUrl}
          sizes="(max-width: 640px) 80px, (max-width: 1024px) 50vw, 320px"
          className="size-20 rounded-2xl text-2xl tracking-tight text-white/90 sm:aspect-[4/3] sm:h-auto sm:w-full sm:text-5xl"
        />

        {/* The cover badges need a cover; the phone row's portrait is too
            small to carry them, so there the rating moves into the figures
            and the formats are left to the profile. */}
        {modes.length ? (
          <div className="absolute left-3 top-3 hidden flex-wrap gap-1.5 sm:flex">
            {modes.map((mode) => (
              <Badge key={mode} variant="onDeep">
                {mode}
              </Badge>
            ))}
          </div>
        ) : null}

        {rated ? (
          <Badge
            variant="onDeep"
            className="absolute right-3 top-3 hidden gap-1 sm:inline-flex"
          >
            <Star className="size-3 fill-gold-400 text-gold-400" />
            {expert.ratingAvg.toFixed(1)}
            <span className="font-normal text-white/70">
              ({formatCompact(expert.ratingCount, locale)})
            </span>
          </Badge>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col self-stretch py-1 pr-1 sm:px-4 sm:pb-3 sm:pt-5 sm:pr-4">
        <h3 className="font-display text-[17px] leading-snug transition-colors group-hover:text-primary sm:text-lg">
          {expert.displayName}
        </h3>

        {affiliation ? (
          <p className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-foreground/75 sm:mt-1 sm:text-sm">
            {affiliation}
          </p>
        ) : null}

        {expert.headline ? (
          <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-2 sm:text-sm">
            {expert.headline}
          </p>
        ) : null}

        {/* pt keeps the footer off the text on the tallest card in a row,
            where mt-auto has no spare height to give; the profile fields make
            card heights vary. */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2.5 sm:items-end sm:pt-6">
          <ul className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-muted-foreground sm:flex-col sm:gap-1.5">
            <li className="flex items-center gap-1.5 sm:gap-2">
              <BookOpen className="size-3.5 shrink-0" />
              {labels.courses}
            </li>
            {/* Every directory entry has a course, but not every course has
                participants yet; "no participants" says nothing useful here. */}
            {expert.enrolledCount > 0 ? (
              <li className="flex items-center gap-1.5 sm:gap-2">
                <Users className="size-3.5 shrink-0" />
                {labels.students}
              </li>
            ) : null}
            {rated ? (
              <li className="flex items-center gap-1.5 font-medium text-foreground sm:hidden">
                <Star className="size-3.5 shrink-0 fill-gold-400 text-gold-400" />
                {expert.ratingAvg.toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  ({formatCompact(expert.ratingCount, locale)})
                </span>
              </li>
            ) : null}
          </ul>

          <span
            aria-hidden={labels.view ? undefined : true}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-navy-900/60 dark:text-navy-100",
              labels.view &&
                "sm:flex sm:w-auto sm:items-center sm:gap-1.5 sm:pl-4 sm:pr-3 sm:text-[13px] sm:font-semibold",
            )}
          >
            {/* On the phone row the pill is just its arrow; the text stays in
                the link's accessible name. */}
            {labels.view ? (
              <span className="sr-only sm:not-sr-only">{labels.view}</span>
            ) : null}
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </LocaleLink>
  );
}

/**
 * The open invitation that fills the free cells of a short last row of expert
 * cards, so the directory ends in a way to become an expert rather than a
 * gap. The same soft tile the home page's experts section uses.
 */
export function ExpertInviteCard({
  title,
  description,
  cta,
  className,
}: {
  title: string;
  description: string;
  cta: string;
  className?: string;
}) {
  return (
    <LocaleLink
      href="/register/tutor"
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-3xl bg-navy-50 p-6 ring-1 ring-inset ring-navy-100 transition duration-200 hover:-translate-y-0.5 hover:elev-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-h-64 sm:p-8 dark:bg-navy-900/40 dark:ring-navy-800",
        className,
      )}
    >
      {/* Concentric rings echo the hero; decoration only. */}
      <span
        aria-hidden
        className="absolute -bottom-28 -right-28 -z-10 hidden size-80 rounded-full border border-navy-200/70 sm:block dark:border-navy-800"
      />
      <span
        aria-hidden
        className="absolute -bottom-14 -right-14 -z-10 hidden size-52 rounded-full border border-navy-200/70 sm:block dark:border-navy-800"
      />
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-navy-700 elev-1 dark:text-navy-100"
      >
        <GraduationCap className="size-5" strokeWidth={1.9} />
      </span>
      <h3 className="font-display mt-5 text-xl leading-snug sm:mt-6">{title}</h3>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-auto pt-6 sm:pt-8">
        <span className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-5 text-sm font-semibold text-navy-700 elev-1 transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:text-navy-100 dark:group-hover:text-primary-foreground">
          {cta}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </LocaleLink>
  );
}

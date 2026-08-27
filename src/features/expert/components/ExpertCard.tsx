import { Star, Users, BookOpen } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { formatCompact } from "@/lib/utils/format";
import { initialsOf, type ExpertSummary } from "../types";

export type ExpertCardLabels = {
  courses: string;
  students: string;
  online: string;
  offline: string;
};

/** A directory tile. The whole card is the link to the expert's profile. */
export function ExpertCard({
  expert,
  labels,
}: {
  expert: ExpertSummary;
  labels: ExpertCardLabels;
}) {
  const modes = [
    expert.online ? labels.online : null,
    expert.offline ? labels.offline : null,
  ].filter(Boolean);

  return (
    <LocaleLink
      href={`/experts/${expert.id}`}
      prefetch
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-3"
    >
      <span
        aria-hidden
        className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-900 font-display text-lg text-white ring-1 ring-inset ring-white/15 transition-transform duration-300 group-hover:scale-105"
      >
        {initialsOf(expert.displayName)}
      </span>

      <h3 className="font-display mt-6 text-lg leading-snug transition-colors group-hover:text-primary">
        {expert.displayName}
      </h3>

      {modes.length ? (
        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {modes.join(" · ")}
        </p>
      ) : null}

      <div className="mt-auto space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5" />
            {labels.courses}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {formatCompact(expert.enrolledCount)}
          </span>
        </div>
        {expert.ratingCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <Star className="size-3.5 fill-gold-500 text-gold-500" />
            <span className="font-medium text-foreground">
              {expert.ratingAvg.toFixed(1)}
            </span>
            <span>({formatCompact(expert.ratingCount)})</span>
          </div>
        ) : null}
      </div>
    </LocaleLink>
  );
}

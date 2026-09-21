import { Star, Users, BookOpen } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { formatCompact } from "@/lib/utils/format";
import type { ExpertSummary } from "../types";
import { ExpertAvatar } from "./ExpertAvatar";

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
  const affiliation = [expert.academicTitle, expert.department]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <LocaleLink
      href={`/experts/${expert.id}`}
      prefetch
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-3"
    >
      {/* pb keeps a gap above the footer rule on the tallest card in a row,
          where mt-auto has no spare height to give; the profile fields make
          card heights vary. */}
      <div className="pb-5">
        <ExpertAvatar
          name={expert.displayName}
          avatarUrl={expert.avatarUrl}
          sizes="64px"
          className="size-16 text-lg transition-transform duration-300 group-hover:scale-105"
        />

        <h3 className="font-display mt-6 text-lg leading-snug transition-colors group-hover:text-primary">
          {expert.displayName}
        </h3>

        {affiliation ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-foreground/80">
            {affiliation}
          </p>
        ) : null}

        {expert.headline ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {expert.headline}
          </p>
        ) : null}

        {modes.length ? (
          <p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {modes.join(" · ")}
          </p>
        ) : null}
      </div>

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

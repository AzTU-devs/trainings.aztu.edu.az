import { Star, Briefcase, Award, Globe, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fullExpertName, initialsOf, type ExpertProfile } from "../types";
import { formatRating } from "@/lib/utils/format";

export type ExpertProfileLabels = {
  reviews: string;
  years: string;
  specialties: string;
  about: string;
  website: string;
  linkedin: string;
};

/**
 * The expert's identity block. Rendered as a page masthead rather than a card
 * so the detail page reads as a profile, not as one tile among many.
 */
export function ExpertProfileCard({
  expert,
  labels,
  as = "h1",
}: {
  expert: ExpertProfile;
  labels: ExpertProfileLabels;
  /** `h1` on the public profile; `h2` when embedded under another heading. */
  as?: "h1" | "h2";
}) {
  const name = fullExpertName(expert);
  const Heading = as;

  return (
    <div className="flex flex-col gap-7 sm:flex-row sm:gap-9">
      <span
        aria-hidden
        className="grid size-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-500 to-navy-900 font-display text-3xl text-white ring-1 ring-inset ring-white/15"
      >
        {initialsOf(name)}
      </span>

      <div className="min-w-0 flex-1">
        <Heading className="font-display text-3xl leading-tight sm:text-4xl">
          {name}
        </Heading>
        {expert.headline ? (
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {expert.headline}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Star className="size-4 fill-gold-500 text-gold-500" />
            <span className="font-medium text-foreground">
              {formatRating(expert.ratingAvg)}
            </span>
            <span>({labels.reviews})</span>
          </span>
          {expert.yearsExperience ? (
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4" />
              {labels.years}
            </span>
          ) : null}
          {expert.expertiseCategoryIds.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <Award className="size-4" />
              {labels.specialties}
            </span>
          ) : null}
        </div>

        {expert.websiteUrl || expert.linkedinUrl ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {expert.websiteUrl ? (
              <ProfileLink href={expert.websiteUrl} icon={<Globe className="size-3.5" />}>
                {labels.website}
              </ProfileLink>
            ) : null}
            {expert.linkedinUrl ? (
              <ProfileLink
                href={expert.linkedinUrl}
                icon={<ExternalLink className="size-3.5" />}
              >
                {labels.linkedin}
              </ProfileLink>
            ) : null}
          </div>
        ) : null}

        {expert.approvalStatus !== "APPROVED" ? (
          <Badge variant="secondary" className="mt-5">
            {expert.approvalStatus.toLowerCase()}
          </Badge>
        ) : null}

        {expert.bio ? (
          <div className="mt-9 border-t border-border pt-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400">
              {labels.about}
            </h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {expert.bio}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProfileLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-accent"
    >
      {icon}
      {children}
    </a>
  );
}

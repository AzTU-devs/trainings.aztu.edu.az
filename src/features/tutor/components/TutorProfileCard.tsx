import { Star, Briefcase, Award, Globe, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fullTutorName, type TutorProfile } from "../types";
import { formatRating } from "@/lib/utils/format";

export type TutorProfileLabels = {
  reviews: string;
  years: string;
  specialties: string;
  about: string;
  website: string;
  linkedin: string;
};

export function TutorProfileCard({
  tutor,
  labels,
}: {
  tutor: TutorProfile;
  labels: TutorProfileLabels;
}) {
  const name = fullTutorName(tutor);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card>
      <CardContent className="space-y-6 p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <span
            aria-hidden
            className="grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy-500 to-navy-800 text-2xl font-bold text-white"
          >
            {initials}
          </span>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl leading-tight">{name}</h1>
              <Badge
                variant={
                  tutor.approvalStatus === "APPROVED" ? "success" : "secondary"
                }
              >
                {tutor.approvalStatus.toLowerCase()}
              </Badge>
            </div>
            {tutor.headline ? (
              <p className="text-muted-foreground">{tutor.headline}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-gold-500 text-gold-500" />
                <span className="font-medium text-foreground">
                  {formatRating(tutor.ratingAvg)}
                </span>{" "}
                ({labels.reviews})
              </span>
              {tutor.yearsExperience ? (
                <span className="flex items-center gap-1">
                  <Briefcase className="size-4" />
                  {labels.years}
                </span>
              ) : null}
              {tutor.expertiseCategoryIds.length > 0 ? (
                <span className="flex items-center gap-1">
                  <Award className="size-4" />
                  {labels.specialties}
                </span>
              ) : null}
            </div>
            {(tutor.websiteUrl || tutor.linkedinUrl) ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {tutor.websiteUrl ? (
                  <a
                    href={tutor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent"
                  >
                    <Globe className="size-3.5" />
                    {labels.website}
                  </a>
                ) : null}
                {tutor.linkedinUrl ? (
                  <a
                    href={tutor.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent"
                  >
                    <ExternalLink className="size-3.5" />
                    {labels.linkedin}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {tutor.bio ? (
          <div className="space-y-2 border-t border-border pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.about}
            </h2>
            <p className="whitespace-pre-line text-sm">{tutor.bio}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

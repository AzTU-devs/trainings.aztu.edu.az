import {
  Star,
  Briefcase,
  Award,
  Globe,
  ExternalLink,
  Languages,
  GraduationCap,
  Microscope,
  IdCard,
  CodeXml,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatRating } from "@/lib/utils/format";
import { fullExpertName, type ExpertProfile } from "../types";
import { externalHref, orcidHref } from "../links";
import { ExpertAvatar } from "./ExpertAvatar";

export type ExpertProfileLabels = {
  reviews: string;
  years: string;
  specialties: string;
  about: string;
  website: string;
  linkedin: string;
};

/**
 * Labels for the detail fields: education, certifications, languages and the
 * research profiles. A separate, optional group because the /tutor own-profile
 * page embeds this card too and predates these fields; without it the card
 * renders what it always did, plus the avatar and affiliation, which need no
 * label.
 */
export type ExpertDetailLabels = {
  education: string;
  certifications: string;
  languages: string;
  googleScholar: string;
  researchGate: string;
  orcid: string;
  github: string;
};

type ProfileLinkItem = { href: string | null; icon: LucideIcon; label: string };

/**
 * The expert's identity block. Rendered as a page masthead rather than a card
 * so the detail page reads as a profile, not as one tile among many.
 *
 * Every optional field is omitted when empty rather than shown under a blank
 * heading: most profiles fill in only some of them.
 */
export function ExpertProfileCard({
  expert,
  labels,
  details,
  as = "h1",
}: {
  expert: ExpertProfile;
  labels: ExpertProfileLabels;
  details?: ExpertDetailLabels;
  /** `h1` on the public profile; `h2` when embedded under another heading. */
  as?: "h1" | "h2";
}) {
  const name = fullExpertName(expert);
  const Heading = as;
  const SectionHeading = as === "h1" ? "h2" : "h3";

  // The API serves an avatar anonymously only while its expert is APPROVED;
  // for anyone else (a pending applicant viewing their own profile) the URL is
  // a certain 404, so it is not requested at all.
  const avatarUrl =
    expert.approvalStatus === "APPROVED" ? expert.avatarUrl : null;

  const affiliation = [expert.academicTitle, expert.department]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" · ");
  const languages = expert.languages?.trim();

  const links: ProfileLinkItem[] = [
    { href: externalHref(expert.websiteUrl), icon: Globe, label: labels.website },
    {
      href: externalHref(expert.linkedinUrl),
      icon: ExternalLink,
      label: labels.linkedin,
    },
  ];
  if (details) {
    links.push(
      {
        href: externalHref(expert.googleScholarUrl),
        icon: GraduationCap,
        label: details.googleScholar,
      },
      {
        href: externalHref(expert.researchGateUrl),
        icon: Microscope,
        label: details.researchGate,
      },
      { href: orcidHref(expert.orcid), icon: IdCard, label: details.orcid },
      { href: externalHref(expert.githubUrl), icon: CodeXml, label: details.github },
    );
  }
  const shownLinks = links.filter(
    (l): l is ProfileLinkItem & { href: string } => l.href !== null,
  );

  const credentials = details
    ? [
        { title: details.education, lines: linesOf(expert.education) },
        { title: details.certifications, lines: linesOf(expert.certifications) },
      ].filter((c) => c.lines.length > 0)
    : [];

  return (
    <div className="flex flex-col gap-7 sm:flex-row sm:gap-9">
      <ExpertAvatar
        name={name}
        avatarUrl={avatarUrl}
        sizes="112px"
        className="size-24 text-3xl sm:size-28"
      />

      <div className="min-w-0 flex-1">
        <Heading className="font-display text-3xl leading-tight sm:text-4xl">
          {name}
        </Heading>
        {affiliation ? (
          <p className="mt-2 font-medium text-foreground/80">
            {affiliation}
          </p>
        ) : null}
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
          {details && languages ? (
            <span className="flex items-center gap-1.5">
              <Languages className="size-4" />
              {/* The icon carries the meaning visually; say it for readers. */}
              <span className="sr-only">{details.languages}: </span>
              {languages}
            </span>
          ) : null}
        </div>

        {shownLinks.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {shownLinks.map(({ href, icon: Icon, label }) => (
              <ProfileLink
                key={label}
                href={href}
                icon={<Icon className="size-3.5" />}
              >
                {label}
              </ProfileLink>
            ))}
          </div>
        ) : null}

        {expert.approvalStatus !== "APPROVED" ? (
          <Badge variant="secondary" className="mt-5">
            {expert.approvalStatus.toLowerCase()}
          </Badge>
        ) : null}

        {expert.bio ? (
          <div className="mt-9 border-t border-border pt-7">
            <SectionHeading className={SECTION_HEADING}>
              {labels.about}
            </SectionHeading>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {expert.bio}
            </p>
          </div>
        ) : null}

        {credentials.length ? (
          <div
            className={cn(
              "mt-9 grid gap-x-10 gap-y-9 border-t border-border pt-7",
              credentials.length > 1 && "sm:grid-cols-2",
            )}
          >
            {credentials.map(({ title, lines }) => (
              <div key={title}>
                <SectionHeading className={SECTION_HEADING}>{title}</SectionHeading>
                <ul className="mt-4 space-y-2.5 leading-relaxed text-muted-foreground">
                  {lines.map((line, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-gold-500"
                      />
                      <span className="min-w-0 break-words">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const SECTION_HEADING =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:text-gold-400";

/** Education and certifications are stored one entry per line. */
function linesOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
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

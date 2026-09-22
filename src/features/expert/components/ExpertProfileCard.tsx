import type { ReactNode } from "react";
import { Star, type LucideIcon } from "lucide-react";
import { Tag } from "@/components/ui/badge";
import { LinkGo } from "@/components/ui/link-go";
import { Kicker } from "@/components/editorial/Kicker";
import { LocaleLink } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils/cn";
import { formatRating } from "@/lib/utils/format";
import { fullExpertName, type ExpertProfile } from "../types";
import { externalHref, orcidHref } from "../links";
import { ExpertPortrait } from "./ExpertAvatar";

/*
 * The expert's own profile as a compact editorial block, for the participant
 * area's /tutor page (the public /experts/[id] page lays the same fields out
 * as a full title page and article instead). The props are the ones the
 * card has always taken, so the /tutor page keeps compiling unchanged.
 *
 * Breakpoints inside are container queries, not viewport ones: the block sits
 * beside the dashboard sidebar, where the viewport says "wide" but the block
 * is not.
 */

export type ExpertProfileLabels = {
  reviews: string;
  years: string;
  specialties: string;
  about: string;
  website: string;
  linkedin: string;
  /** Small mono label above the name. Optional: the /tutor page passes none. */
  eyebrow?: string;
};

/**
 * Labels for the detail fields: education, certifications, languages and the
 * research profiles. Optional: without it only the core fields render.
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

/** A figure for the facts row, e.g. "3 courses". Already localised. */
export type ExpertFact = { icon: LucideIcon; label: string };

/** The expert's subject areas, resolved to names by the caller. */
export type ExpertExpertise = {
  title: string;
  areas: { id: string; name: string; href?: string }[];
};

/** Education and certifications are stored one entry per line. */
function linesOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Languages are free text ("Azerbaijani, English"), split on the separators people type. */
function listOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return [...new Set(text.split(/[,;\n/]+/).map((part) => part.trim()).filter(Boolean))];
}

export function ExpertProfileCard({
  expert,
  labels,
  details,
  facts,
  expertise,
  as = "h1",
  locale,
}: {
  expert: ExpertProfile;
  labels: ExpertProfileLabels;
  /** The page's locale, for number formatting — never the runtime default. */
  locale: string;
  details?: ExpertDetailLabels;
  /** Figures the caller knows and the profile does not (course counts). Listed first. */
  facts?: ExpertFact[];
  expertise?: ExpertExpertise;
  /** `h1` on a page of its own; `h2` when embedded under another heading. */
  as?: "h1" | "h2";
}) {
  const name = fullExpertName(expert);
  const Heading = as;
  const Section = as === "h1" ? "h2" : "h3";
  // The API serves an avatar anonymously only while its expert is APPROVED;
  // for anyone else (a pending applicant viewing their own profile) the URL is
  // a certain 404, so it is not requested at all.
  const avatarUrl = expert.approvalStatus === "APPROVED" ? expert.avatarUrl : null;

  const academicTitle = expert.academicTitle?.trim();
  const department = expert.department?.trim();
  const headline = expert.headline?.trim();
  // A bio that only repeats the headline would print the same line twice.
  const bio = expert.bio?.trim();
  const showBio = !!bio && bio.toLowerCase() !== (headline ?? "").toLowerCase();
  const areas = expertise?.areas ?? [];
  const rated = expert.ratingCount > 0;

  const links = [
    { href: externalHref(expert.websiteUrl), label: labels.website },
    { href: externalHref(expert.linkedinUrl), label: labels.linkedin },
    ...(details
      ? [
          { href: externalHref(expert.googleScholarUrl), label: details.googleScholar },
          { href: externalHref(expert.researchGateUrl), label: details.researchGate },
          { href: orcidHref(expert.orcid), label: details.orcid },
          { href: externalHref(expert.githubUrl), label: details.github },
        ]
      : []),
  ].filter((l): l is { href: string; label: string } => l.href !== null);

  // The figures row. With no reviews the label alone ("No reviews") is the
  // honest figure; a 0,0 beside it would read as a bad score. The expertise
  // count stands in for the chips when the caller could not name the areas.
  const figures: ReactNode[] = [
    ...(facts ?? []).map((f) => f.label),
    rated ? (
      <span className="inline-flex items-center gap-1.5">
        <Star aria-hidden="true" className="size-[15px] fill-current stroke-none text-gold-ink" />
        {`${formatRating(expert.ratingAvg, locale)} · ${labels.reviews}`}
      </span>
    ) : (
      labels.reviews
    ),
    ...(!areas.length && expert.expertiseCategoryIds.length > 0 ? [labels.specialties] : []),
  ];

  const blocks: { title: string; body: ReactNode }[] = [];
  if (showBio) {
    blocks.push({
      title: labels.about,
      body: <p className="t-body max-w-[62ch] whitespace-pre-line">{bio}</p>,
    });
  }
  if (areas.length && expertise) {
    blocks.push({
      title: expertise.title,
      body: (
        <ul className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <li key={area.id}>
              {area.href ? (
                <LocaleLink
                  href={area.href}
                  className="inline-flex h-9 items-center rounded-full border border-line-2 px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
                >
                  {area.name}
                </LocaleLink>
              ) : (
                <Tag variant="case">{area.name}</Tag>
              )}
            </li>
          ))}
        </ul>
      ),
    });
  }
  const languages = details ? listOf(expert.languages) : [];
  if (details && languages.length) {
    blocks.push({
      title: details.languages,
      body: (
        <ul className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <li key={l}>
              <Tag variant="case">{l}</Tag>
            </li>
          ))}
        </ul>
      ),
    });
  }
  for (const [title, text] of details
    ? ([
        [details.education, expert.education],
        [details.certifications, expert.certifications],
      ] as const)
    : []) {
    const lines = linesOf(text);
    if (lines.length) {
      blocks.push({
        title,
        body: (
          <ol className="olist">
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        ),
      });
    }
  }

  return (
    <div className="@container">
      <section className="grid gap-x-8 gap-y-6 border-t border-line-strong pt-6 @xl:grid-cols-[160px_minmax(0,1fr)] @3xl:grid-cols-[208px_minmax(0,1fr)]">
        <ExpertPortrait
          name={name}
          avatarUrl={avatarUrl}
          alt
          sizes="208px"
          className="w-32 @xl:w-full"
        />
        <div className="min-w-0">
          {labels.eyebrow || expert.approvalStatus !== "APPROVED" ? (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              {labels.eyebrow ? <Kicker>{labels.eyebrow}</Kicker> : null}
              {expert.approvalStatus !== "APPROVED" ? (
                <Tag variant="gold">{expert.approvalStatus.toLowerCase()}</Tag>
              ) : null}
            </div>
          ) : null}
          <Heading className="t-display-m">{name}</Heading>
          {department ? <p className="t-meta mt-2">{department}</p> : null}
          {academicTitle || expert.yearsExperience ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {academicTitle ? <Tag variant="case">{academicTitle}</Tag> : null}
              {expert.yearsExperience ? <Tag variant="case">{labels.years}</Tag> : null}
            </div>
          ) : null}
          {headline ? <p className="t-lead mt-4 max-w-[52ch]">{headline}</p> : null}
          <ul className="t-small mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-ink-2">
            {figures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {links.length ? (
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {links.map((l) => (
                <li key={l.label}>
                  <LinkGo href={l.href} external className="t-small">
                    {l.label}
                  </LinkGo>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {blocks.length ? (
        <div className={cn("mt-10 grid gap-x-10 gap-y-10", blocks.length > 1 && "@3xl:grid-cols-2")}>
          {blocks.map((b) => (
            <section key={b.title} className="min-w-0 border-t border-line pt-4">
              <Section className="t-kicker text-ink-3">{b.title}</Section>
              <div className="mt-4">{b.body}</div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

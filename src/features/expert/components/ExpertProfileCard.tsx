import type { ReactNode } from "react";
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
  BadgeCheck,
  Building2,
  ArrowUpRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/components/common/SectionHeading";
import { cn } from "@/lib/utils/cn";
import { formatRating } from "@/lib/utils/format";
import { LocaleLink } from "@/i18n/LocaleLink";
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
  /**
   * Small label on the header's cover band. Optional: the /tutor page sets
   * its own heading above the card and passes none.
   */
  eyebrow?: string;
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

/** A figure for the header's fact list, e.g. "3 courses". Already localised. */
export type ExpertFact = { icon: LucideIcon; label: string };

/**
 * The expert's subject areas, resolved to names by the caller: the profile
 * carries only category ids, and naming them takes a request this card should
 * not make.
 */
export type ExpertExpertise = {
  title: string;
  areas: { id: string; name: string; href?: string }[];
};

type ProfileLinkItem = { href: string | null; icon: LucideIcon; label: string };

/**
 * The expert's profile: a header card with the portrait, identity, links and
 * bio, then a card per detail field.
 *
 * Every optional field is omitted when empty rather than shown under a blank
 * heading: most profiles fill in only some of them, and a profile with none
 * is just the header card.
 *
 * Breakpoints inside are container queries, not viewport ones, because the
 * card renders both full width on the public page and beside the dashboard
 * sidebar on /tutor, where the viewport says "wide" but the card is not.
 */
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

  const academicTitle = expert.academicTitle?.trim();
  const department = expert.department?.trim();
  const headline = expert.headline?.trim();
  // A bio that only repeats the headline (as a quick sign-up leaves it) would
  // print the same line twice under the name, so the About block needs text
  // of its own — the rule CategoryGrid applies to descriptions that repeat a
  // category's name.
  const bio = expert.bio?.trim();
  const showBio =
    !!bio && bio.toLowerCase() !== (headline ?? "").toLowerCase();
  const languages = details ? listOf(expert.languages) : [];
  const areas = expertise?.areas ?? [];

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

  const rated = expert.ratingCount > 0;
  const allFacts: (ExpertFact & { rating?: boolean })[] = [
    ...(facts ?? []),
    ...(expert.yearsExperience ? [{ icon: Briefcase, label: labels.years }] : []),
    {
      icon: Star,
      // With no reviews the label alone ("No reviews") is the honest figure;
      // a 0.0 beside it would read as a bad score.
      label: rated
        ? `${formatRating(expert.ratingAvg, locale)} · ${labels.reviews}`
        : labels.reviews,
      rating: rated,
    },
    // The count stands in for the expertise card when the caller could not
    // name the areas.
    ...(!areas.length && expert.expertiseCategoryIds.length > 0
      ? [{ icon: Award, label: labels.specialties }]
      : []),
  ];

  const sections: DetailSection[] = [];
  if (expertise && areas.length) {
    sections.push({
      title: expertise.title,
      icon: Sparkles,
      body: (
        <ul className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <li key={area.id}>
              {area.href ? (
                <LocaleLink
                  href={area.href}
                  className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors duration-200 hover:border-primary/40 hover:text-primary"
                >
                  {area.name}
                </LocaleLink>
              ) : (
                <span className={CHIP}>{area.name}</span>
              )}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (details && languages.length) {
    sections.push({
      title: details.languages,
      icon: Languages,
      body: (
        <ul className="flex flex-wrap gap-2">
          {languages.map((language) => (
            <li key={language} className={CHIP}>
              {language}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (details) {
    for (const [title, icon, text] of [
      [details.education, GraduationCap, expert.education],
      [details.certifications, BadgeCheck, expert.certifications],
    ] as const) {
      const lines = linesOf(text);
      if (!lines.length) continue;
      sections.push({
        title,
        icon,
        body: (
          <ul className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">
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
        ),
      });
    }
  }

  return (
    <div className="@container space-y-5">
      <section className="overflow-hidden rounded-4xl border border-border/80 bg-card p-2 elev-1">
        {/* The cover band: a contained piece of the deep navy canvas, inset
            one radius step inside the card like any other imagery. */}
        <div className="surface-deep relative h-28 rounded-3xl @2xl:h-40">
          {labels.eyebrow ? (
            <Eyebrow tone="deep" className="absolute left-4 top-4 @2xl:left-6 @2xl:top-6">
              {labels.eyebrow}
            </Eyebrow>
          ) : null}
          {expert.approvalStatus !== "APPROVED" ? (
            <Badge variant="onDeep" className="absolute right-4 top-4 @2xl:right-6 @2xl:top-6">
              {expert.approvalStatus.toLowerCase()}
            </Badge>
          ) : null}
        </div>

        {/* Identity, facts, bio in reading order, so a narrow card shows the
            figures before the prose; from @4xl the facts move to their own
            column beside both. Without a bio that column would stand far
            taller than the identity beside it, so the facts stay below it as
            one strip instead. */}
        <div
          className={cn(
            "grid gap-x-12 gap-y-7 px-3 pb-4 @2xl:px-6 @2xl:pb-7",
            showBio && "@4xl:grid-cols-[minmax(0,1fr)_20rem] @4xl:gap-y-8",
          )}
        >
          <div className="min-w-0">
            {/* The card-coloured frame separates the portrait from the cover
                it overlaps. A wrapper rather than a ring, because the avatar
                draws its own inset ring and the two would merge. */}
            <div className="relative -mt-14 w-fit rounded-[2.375rem] bg-card p-1.5 @2xl:-mt-20">
              <ExpertAvatar
                name={name}
                avatarUrl={avatarUrl}
                sizes="144px"
                className="size-28 rounded-3xl text-4xl @2xl:size-36 @2xl:text-5xl"
              />
            </div>

            <Heading className="font-display mt-4 text-balance text-3xl leading-[1.08] @2xl:text-4xl @4xl:text-5xl">
              {name}
            </Heading>

            {academicTitle || department ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                {academicTitle ? (
                  <Badge variant="soft" className="px-3 py-1.5 text-xs">
                    {academicTitle}
                  </Badge>
                ) : null}
                {department ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                    <Building2 className="size-4 shrink-0 text-muted-foreground" />
                    {department}
                  </span>
                ) : null}
              </div>
            ) : null}

            {headline ? (
              <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {headline}
              </p>
            ) : null}

            {shownLinks.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {shownLinks.map(({ href, icon: Icon, label }) => (
                  <ProfileLink key={label} href={href} icon={<Icon />}>
                    {label}
                  </ProfileLink>
                ))}
              </div>
            ) : null}
          </div>

          <ul
            className={cn(
              "grid grid-cols-2 content-start gap-1.5 self-start rounded-3xl bg-muted/70 p-1.5",
              showBio
                ? "@4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1 @4xl:mt-6 @4xl:grid-cols-1"
                : "@4xl:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]",
            )}
          >
            {allFacts.map(({ icon: Icon, label, rating }, i) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl bg-card px-2.5 py-2.5 dark:ring-1 dark:ring-inset dark:ring-border/60 @xl:gap-3 @xl:px-3",
                  // An odd one out takes the full row rather than leaving a hole.
                  i === allFacts.length - 1 &&
                    allFacts.length % 2 === 1 &&
                    "col-span-2 @4xl:col-span-1",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl @xl:size-10",
                    rating
                      ? "bg-gold-50 text-gold-600 dark:bg-gold-500/15 dark:text-gold-300"
                      : "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
                  )}
                >
                  <Icon className={cn("size-[18px]", rating && "fill-current")} />
                </span>
                <span className="min-w-0 text-sm font-semibold leading-snug">{label}</span>
              </li>
            ))}
          </ul>

          {showBio ? (
            <div className="min-w-0 border-t border-border pt-6 @4xl:col-start-1">
              <SectionHeading className="font-display text-lg leading-snug">
                {labels.about}
              </SectionHeading>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-pretty text-[15px] leading-relaxed text-muted-foreground">
                {bio}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {sections.length ? (
        <div
          className={cn(
            "grid gap-5",
            sections.length === 2 && "@3xl:grid-cols-2",
            sections.length === 3 && "@5xl:grid-cols-3",
            sections.length === 4 && "@3xl:grid-cols-2",
          )}
        >
          {sections.map(({ title, icon: Icon, body }) => (
            <section
              key={title}
              className={cn(
                "rounded-3xl border border-border/80 bg-card p-6 elev-1 @2xl:p-7",
                // A lone section would be a wide card with a short body under
                // its title; side by side it reads as one tidy strip.
                sections.length === 1 &&
                  "@3xl:grid @3xl:grid-cols-[18rem_minmax(0,1fr)] @3xl:items-center @3xl:gap-8",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100">
                  <Icon className="size-5" />
                </span>
                <SectionHeading className="font-display text-lg leading-snug">
                  {title}
                </SectionHeading>
              </div>
              <div className={cn("mt-5", sections.length === 1 && "@3xl:mt-0")}>
                {body}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type DetailSection = { title: string; icon: LucideIcon; body: ReactNode };

const CHIP =
  "inline-flex h-9 items-center rounded-full bg-navy-50 px-4 text-sm font-medium text-navy-700 dark:bg-navy-900/60 dark:text-navy-100";

/** Education and certifications are stored one entry per line. */
function linesOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Languages are free text ("Azerbaijani, English, Russian"), so they are split
 * on the separators people actually type to show one chip per language.
 */
function listOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return [
    ...new Set(
      text
        .split(/[,;\n/]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

function ProfileLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "group/link gap-2 pl-3.5 pr-3")}
    >
      {icon}
      {children}
      <ArrowUpRight className="text-muted-foreground transition-transform duration-200 group-hover/link:-translate-y-px group-hover/link:translate-x-px" />
    </a>
  );
}

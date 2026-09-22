import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatNumber, formatRating } from "@/lib/utils/format";
import { buttonVariants } from "@/components/ui/button";
import { Tag } from "@/components/ui/badge";
import { Kicker } from "@/components/editorial/Kicker";
import { toCategoryRef, type CategoryRef } from "@/features/category/style";
import type { CategoryIndex } from "@/features/course/catalog.server";
import type { ExpertSummary } from "../types";
import { ExpertPortrait } from "./ExpertAvatar";

/*
 * Server-side pieces shared by the expert surfaces (home §04, /experts, the
 * profile): the one-expert spread, the hover panel's content, and the small
 * helpers that turn an `ExpertSummary` into badges, figures and a colour.
 * Server components: never import this file from a "use client" module.
 */

const trim = (s: string | null | undefined) => s?.trim() || "";

/**
 * The expert's colour (IMPLEMENTATION §3.5): the first of their expertise
 * categories that is a live category, else the primary category of their
 * top course, else null (AzTU navy). The profile's category ids may point at
 * a deleted or inactive category, which is why the first *known* one wins.
 */
export function expertCategory(
  expert: Pick<ExpertSummary, "expertiseCategoryIds">,
  index: CategoryIndex | null,
  topCourseId: string | null | undefined,
  t: TFunction,
  locale: Locale,
): CategoryRef | null {
  if (!index) return null;
  const byId = new Map(index.entries.map((e) => [e.category.id, e.category] as const));
  for (const id of expert.expertiseCategoryIds ?? []) {
    const c = byId.get(id);
    if (c) return toCategoryRef(c, t, locale);
  }
  const primary = topCourseId ? index.primaryOf(topCourseId) : null;
  return primary ? toCategoryRef(primary, t, locale) : null;
}

/** The academic badges: the title and "{n} il təcrübə" — real fields only, no degree. */
export function expertBadges(
  expert: Pick<ExpertSummary, "academicTitle" | "yearsExperience">,
  t: TFunction,
): string[] {
  const out: string[] = [];
  const title = trim(expert.academicTitle);
  if (title) out.push(title);
  if (expert.yearsExperience && expert.yearsExperience > 0) {
    out.push(t("experts.years", { count: expert.yearsExperience }));
  }
  return out;
}

/** "Dosent · Kompüter mühəndisliyi kafedrası", or whichever half exists. */
export function expertAffiliation(expert: Pick<ExpertSummary, "academicTitle" | "department">): string {
  return [trim(expert.academicTitle), trim(expert.department)].filter(Boolean).join(" · ");
}

/**
 * The figures line: "3 kurs · 7 iştirakçı · ★ 4,8". Participants read "Hələ
 * iştirakçı yoxdur" at zero, never "0 iştirakçı"; the rating appears only once
 * someone has rated, because 0,0 would read as a bad score. The star is
 * decoration; screen readers get the sentence instead.
 */
export function ExpertStats({
  expert,
  locale,
  t,
  className,
}: {
  expert: Pick<ExpertSummary, "courseCount" | "enrolledCount" | "ratingAvg" | "ratingCount">;
  locale: Locale;
  t: TFunction;
  className?: string;
}) {
  const parts: string[] = [];
  if (expert.courseCount > 0) {
    parts.push(t("ui.courseCount", { n: formatNumber(expert.courseCount, locale), count: expert.courseCount }));
  }
  parts.push(
    expert.enrolledCount > 0
      ? t("ui.participants", { n: formatNumber(expert.enrolledCount, locale), count: expert.enrolledCount })
      : t("ui.noParticipants"),
  );
  const rated = expert.ratingCount > 0;
  const value = formatRating(expert.ratingAvg, locale);
  const rating = rated ? (
    <>
      <span aria-hidden="true" className="whitespace-nowrap">
        <span className="text-gold-ink">★</span> {value}
      </span>
      <span className="sr-only">{t("ui.ratingSummary", { value, count: expert.ratingCount })}</span>
    </>
  ) : null;
  return (
    <span className={className}>
      {parts.join(" · ")}
      {rating ? (
        <>
          {" · "}
          {rating}
        </>
      ) : null}
    </span>
  );
}

/**
 * The hover panel's content (the contributors wall on home, /experts at lg):
 * the 4:5 portrait, the name, the department, the badges and the figures.
 */
export async function ExpertPanel({
  expert,
  category,
  locale,
  className,
}: {
  expert: ExpertSummary;
  category: CategoryRef | null;
  locale: Locale;
  className?: string;
}) {
  const t = await getT(locale);
  const badges = expertBadges(expert, t);
  const department = trim(expert.department);
  return (
    <div className={className}>
      <ExpertPortrait
        name={expert.displayName}
        avatarUrl={expert.avatarUrl}
        category={category}
        sizes="320px"
      />
      <p className="t-title mt-5">{expert.displayName}</p>
      {department ? <p className="t-meta mt-1">{department}</p> : null}
      {badges.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <Tag key={b} variant="case">
              {b}
            </Tag>
          ))}
        </div>
      ) : null}
      <ExpertStats expert={expert} locale={locale} t={t} className="t-small mt-3 block text-ink-2" />
    </div>
  );
}

/** The first paragraph of a bio (blank-line separated), for the short spread. */
function firstParagraph(text: string): string {
  return text.split(/\r?\n\s*\r?\n/)[0]?.trim() ?? "";
}

/**
 * The profile spread for when there is exactly one expert (home §04 state 1,
 * /experts with one entry): the portrait at columns 1–4 and, at 6–12, the
 * kicker, the name, the department, the academic badges, the start of the
 * bio, "Profilə baxın" with the figures, and optionally the dashed "become an
 * expert" invitation.
 *
 * `bio` comes from the caller's `expertServerApi.byId` fetch (the summary does
 * not carry it); without one the headline stands in, so the spread never
 * shows an empty paragraph.
 */
export async function ExpertSpread({
  expert,
  bio,
  category,
  locale,
  kicker,
  headingLevel = "h2",
  headingId,
  invite = false,
  className,
}: {
  expert: ExpertSummary;
  bio?: string | null;
  category: CategoryRef | null;
  locale: Locale;
  /** e.g. "Kursu kim aparır" (home) — sentence case; CSS uppercases it. */
  kicker: string;
  /** The level of the name. */
  headingLevel?: "h2" | "h3";
  /** An id for the name heading, for a section's `aria-labelledby`. */
  headingId?: string;
  invite?: boolean;
  className?: string;
}) {
  const t = await getT(locale);
  const H = headingLevel;
  const department = trim(expert.department);
  const headline = trim(expert.headline);
  const lead = department || headline;
  const about = firstParagraph(trim(bio));
  // A bio that only repeats the lead line (a quick sign-up leaves them equal)
  // would print the same sentence twice.
  const body =
    about && about.toLowerCase() !== lead.toLowerCase() ? about : department && headline ? headline : "";
  const badges = expertBadges(expert, t);

  return (
    <div className={cn("g12 gap-y-10", className)}>
      <div className="col-span-4 md:col-span-3 lg:col-span-4">
        <ExpertPortrait
          name={expert.displayName}
          avatarUrl={expert.avatarUrl}
          category={category}
          alt
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 38vw, 440px"
        />
      </div>
      <div className="col-span-4 min-w-0 md:col-span-5 lg:col-span-7 lg:col-start-6">
        <Kicker>{kicker}</Kicker>
        <H id={headingId} className="t-display-l mt-4">
          {expert.displayName}
        </H>
        {lead ? <p className="t-lead mt-3">{lead}</p> : null}
        {badges.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {badges.map((b) => (
              <Tag key={b} variant="case">
                {b}
              </Tag>
            ))}
          </div>
        ) : null}
        {body ? <p className="t-body mt-6 line-clamp-6 max-w-[56ch] whitespace-pre-line">{body}</p> : null}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href={localeHref(locale, `/experts/${expert.id}`)} className={buttonVariants()}>
            {t("ui.viewProfile")}
            <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
          </Link>
          <ExpertStats expert={expert} locale={locale} t={t} className="t-meta" />
        </div>
        {invite ? (
          <div className="invite mt-14 grid gap-4 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:p-8">
            <div>
              <p className="t-title-l">{t("experts.inviteTitle")}</p>
              <p className="t-body mt-2 max-w-[48ch]">{t("experts.inviteBody")}</p>
            </div>
            <Link
              href={localeHref(locale, "/register/tutor")}
              className={cn(buttonVariants({ variant: "outline" }), "w-full md:w-auto")}
            >
              {t("experts.inviteCta")}
              <ArrowRight data-go aria-hidden="true" strokeWidth={1.75} />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { Tag } from "@/components/ui/badge";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import type { ExpertSummary } from "../types";
import { ExpertAvatar } from "./ExpertAvatar";
import { ExpertStats, expertAffiliation, expertBadges } from "./ExpertSpread";

/*
 * The expert directory's index rows (/experts). An index rather than a card
 * grid: names are what people scan, and a row keeps a long name, a long
 * department and the figures legible at 390px without a wall of portraits.
 * Server components (they read the dictionary), so never import this file
 * from a "use client" module.
 */

/**
 * The row grid, shared by the expert rows and the invite row so they align.
 * At lg a fourth column holds the academic badges, as the catalogue's index
 * rows hold their facts at the right edge; 13rem fits the usual pair
 * ("Professor", "21 il təcrübə") on one line, so the rows keep one rhythm.
 */
const ROW_GRID =
  "grid items-center gap-x-4 grid-cols-[52px_minmax(0,1fr)_20px] md:grid-cols-[56px_minmax(0,1fr)_20px] md:gap-x-5 lg:grid-cols-[28px_56px_minmax(0,1fr)_minmax(0,13rem)_20px] lg:gap-x-6";

/**
 * The paper-2 hover fill of the catalogue's index rows, bleeding 14px past the
 * column so the text never touches its edge.
 */
const ROW_FILL =
  "relative isolate before:absolute before:inset-y-0 before:-inset-x-3.5 before:-z-10 before:rounded-[4px] before:bg-paper-2 before:opacity-0 before:transition-opacity before:duration-(--dur-2) hover:before:opacity-100 focus-visible:before:opacity-100";

/**
 * One expert: № (lg) · avatar · name (Fraunces) with one meta line · the
 * badges (lg) · arrow. The whole row is the link to the profile.
 *
 * At lg the academic title moves out of the meta line into the badges, so the
 * line under the name is the department and the figures, and the row stays
 * two lines tall like the home page's category rows. Below lg there is no
 * badge column: the title stays with the department and the figures take a
 * line of their own, which a 390px column needs anyway.
 */
export async function ExpertRow({
  expert,
  category,
  locale,
  number,
  className,
}: {
  expert: ExpertSummary;
  category: CategoryRef | null;
  locale: Locale;
  /** 1-based position, printed "01" at lg. */
  number: number;
  className?: string;
}) {
  const t = await getT(locale);
  const affiliation = expertAffiliation(expert);
  const department = expert.department?.trim() || "";
  const badges = expertBadges(expert, t);
  return (
    <Link
      href={localeHref(locale, `/experts/${expert.id}`)}
      className={cn(ROW_GRID, ROW_FILL, "group py-4", className)}
      {...catAttrs(category)}
    >
      <span aria-hidden="true" className="hidden font-mono text-xs tracking-[0.06em] text-ink-3 lg:block">
        {String(number).padStart(2, "0")}
      </span>
      <ExpertAvatar
        name={expert.displayName}
        avatarUrl={expert.avatarUrl}
        category={category}
        size={56}
        sizes="56px"
        className="max-md:size-[52px]!"
      />
      <span className="min-w-0">
        <span className="t-title-l block decoration-gold decoration-1 underline-offset-[0.16em] group-hover:underline">
          {expert.displayName}
        </span>
        {/* Phones and tablets: "title · department", then the figures. */}
        {affiliation ? (
          <span className="t-small mt-1 block text-ink-2 [overflow-wrap:anywhere] lg:hidden">{affiliation}</span>
        ) : null}
        <ExpertStats expert={expert} locale={locale} t={t} className="t-meta mt-1.5 block lg:hidden" />
        {/* lg: one line, "department · figures". The figures never break
            inside, so a long department wraps before them, not among them. */}
        <span className="t-meta mt-1 hidden [overflow-wrap:anywhere] lg:block">
          {department ? (
            <>
              <span className="text-ink-2">{department}</span>
              {" · "}
            </>
          ) : null}
          <ExpertStats expert={expert} locale={locale} t={t} className="whitespace-nowrap" />
        </span>
      </span>
      {/* The badge column is always rendered at lg, empty or not, so the
          arrows stay in one column down the list. */}
      <span className="hidden min-w-0 flex-wrap gap-1.5 lg:flex">
        {badges.map((b) => (
          <Tag key={b} variant="case" className="max-w-full">
            <span className="truncate">{b}</span>
          </Tag>
        ))}
      </span>
      <ArrowRight
        aria-hidden="true"
        strokeWidth={1.75}
        className="size-5 text-ink-3 transition-[transform,color] duration-(--dur-2) ease-out group-hover:translate-x-1 group-hover:text-ink"
      />
    </Link>
  );
}

/**
 * The open slot that ends the directory: "Sizin adınız? — Ekspert kimi
 * müraciət edin", in the dashed gold of the invitations.
 */
export async function ExpertInviteRow({ locale, className }: { locale: Locale; className?: string }) {
  const t = await getT(locale);
  return (
    <Link
      href={localeHref(locale, "/register/tutor")}
      className={cn(
        ROW_GRID,
        ROW_FILL,
        // An open slot rather than a box: dashed gold rules above and below,
        // on the same grid as the rows so the "+" sits under the avatars.
        "group border-y border-dashed border-gold py-4 lg:py-5",
        className,
      )}
    >
      <span aria-hidden="true" className="hidden lg:block" />
      <span
        aria-hidden="true"
        className="grid size-[52px] place-items-center rounded-full border border-dashed border-gold text-gold-ink md:size-14"
      >
        <Plus className="size-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 lg:col-span-2">
        <span className="t-title-l block text-gold-ink italic [font-variation-settings:'SOFT'_100,'WONK'_1]">
          {t("experts.slotName")}
        </span>
        <span className="t-small mt-1 block font-semibold text-ink">{t("experts.applyCta")}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        strokeWidth={1.75}
        className="size-5 text-ink-3 transition-[transform,color] duration-(--dur-2) ease-out group-hover:translate-x-1 group-hover:text-ink"
      />
    </Link>
  );
}

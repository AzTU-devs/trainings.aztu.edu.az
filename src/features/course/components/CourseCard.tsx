"use client";

import Image from "next/image";
import { Clock, MapPin, MonitorPlay, Star, Users } from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useLocale, useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import { formatCompact, formatPrice, formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { mediaSrc } from "../media";
import type { CourseLevel, CourseSummary } from "../types";

/**
 * A course without a thumbnail still needs a cover, so each card generates one.
 * The previous version hashed the slug into a random hue, which produced a
 * rainbow grid at odds with the brand; this walks a fixed set of navy
 * gradients instead, so the catalogue reads as one family while cards stay
 * distinct.
 */
const COVERS = [
  "from-navy-500 via-navy-700 to-navy-950",
  "from-navy-600 via-navy-800 to-[#0b2545]",
  "from-[#1f6d8c] via-navy-700 to-navy-950",
  "from-navy-400 via-navy-700 to-navy-950",
  "from-[#2a5f7a] via-navy-800 to-navy-950",
  "from-navy-500 via-[#123f73] to-navy-900",
] as const;

function coverFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return COVERS[Math.abs(h) % COVERS.length];
}

function initialsOf(text: string) {
  return text
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const LEVEL_KEYS: Record<CourseLevel, string> = {
  BEGINNER: "common.beginner",
  INTERMEDIATE: "common.intermediate",
  ADVANCED: "common.advanced",
  ALL: "common.allLevels",
};

/**
 * The course's language as a word in the page's language ("Azərbaycan",
 * "English") rather than a bare ISO code; unknown codes show as the code.
 *
 * From the dictionary, not Intl.DisplayNames: this card renders on the server
 * and again in the browser, and browsers without Azerbaijani locale data
 * (Chromium among them) answer "EN" where Node answers "İngilis" — a hydration
 * mismatch that made React throw away and re-render every catalogue page.
 */
function languageName(code: string | undefined, t: TFunction) {
  if (!code) return null;
  const key = `languages.${code.toLowerCase()}`;
  const name = t(key);
  return name === key ? code.toUpperCase() : name;
}

function durationLabel(seconds: number, t: TFunction) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h && m) return t("courses.durationHm", { h, m });
  if (h) return t("courses.durationH", { h });
  return t("courses.durationM", { m: Math.max(m, 1) });
}

/** Frosted pill laid over the cover image. */
const GLASS =
  "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold backdrop-blur-md";

/** Soft metadata chip in the card body. */
const CHIP =
  "inline-flex h-6 max-w-full items-center gap-1 truncate rounded-full px-2.5 text-xs font-medium";

export function CourseCard({ course }: { course: CourseSummary }) {
  const t = useT();
  const locale = useLocale();
  const thumbnail = mediaSrc(course.thumbnailUrl);
  const online = course.courseType === "ONLINE";
  const language = languageName(course.language, t);
  const rated = course.ratingCount > 0;
  const rating = formatRating(course.ratingAvg, locale);
  const levelName = t(LEVEL_KEYS[course.level] ?? "common.allLevels");

  return (
    <LocaleLink
      href={`/courses/${course.slug}`}
      prefetch
      className="@container group flex h-full flex-col rounded-3xl border border-border/80 bg-card p-2 elev-1 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:elev-3 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div
        className={cn(
          "relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gradient-to-br",
          coverFor(course.slug),
        )}
      >
        {thumbnail ? (
          // The title sits right below, so the cover is decorative; the gradient
          // stays underneath and shows through while the image loads.
          //
          // `unoptimized` makes the browser fetch the API URL itself instead of
          // going through /_next/image. The optimizer would fetch the API's
          // PUBLIC hostname from inside the server, and in production that can
          // fail: Next refuses a hostname that resolves to a private IP (split
          // DNS or /etc/hosts on the university network), and without a NAT
          // hairpin the fetch times out. Either way every card would show a
          // broken image while the API itself is fine. The cost is that the
          // original upload is sent unresized; it is still cached, because the
          // API serves it `public, max-age=86400, immutable` with a strong ETag.
          // CSP img-src in next.config.ts already allows the API origin.
          // `sizes` has no effect while unoptimized; it stays so that dropping
          // the flag brings responsive widths back.
          <Image
            src={thumbnail}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <CoverArt initials={initialsOf(course.title)} />
        )}

        {/* A light scrim keeps the pills legible on bright photos. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent"
        />
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <span className={cn(GLASS, "bg-black/30 text-white ring-1 ring-inset ring-white/20")}>
            {online ? (
              <MonitorPlay aria-hidden className="size-3.5" />
            ) : (
              <MapPin aria-hidden className="size-3.5" />
            )}
            {online ? t("common.online") : t("common.offline")}
          </span>
          <span
            className={cn(
              GLASS,
              "bg-white/90 text-navy-900 ring-1 ring-inset ring-white/60 dark:bg-navy-950/70 dark:text-white dark:ring-white/15",
            )}
          >
            {course.free ? (
              <>
                <span aria-hidden className="size-1.5 rounded-full bg-gold-500" />
                {t("common.free")}
              </>
            ) : (
              formatPrice(course.price, course.currency, locale)
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              CHIP,
              "bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100",
            )}
          >
            <span aria-hidden>{levelName}</span>
            <span className="sr-only">{t("courses.level", { level: levelName })}</span>
          </span>
          {language ? (
            <span className={cn(CHIP, "bg-muted text-muted-foreground")}>
              <span aria-hidden>{language}</span>
              <span className="sr-only">{t("courses.language", { language })}</span>
            </span>
          ) : null}
          {/* Zero seconds means "not published yet", not "an empty course". */}
          {course.totalDurationSec ? (
            <span className={cn(CHIP, "bg-muted text-muted-foreground")}>
              <Clock aria-hidden className="size-3" />
              {durationLabel(course.totalDurationSec, t)}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 line-clamp-2 font-display text-lg leading-snug text-foreground transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        {course.subtitle ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.subtitle}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-border/80 pt-3.5 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-50 text-[10px] font-bold text-navy-700 dark:bg-navy-900/60 dark:text-navy-100"
              >
                {initialsOf(course.tutorDisplayName)}
              </span>
              <span className="truncate font-medium text-foreground">
                {course.tutorDisplayName}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
              {rated ? (
                <span
                  className="flex items-center gap-1"
                  title={t("courses.ratingSummary", { rating, count: course.ratingCount })}
                >
                  <Star aria-hidden className="size-3.5 fill-gold-500 text-gold-500" />
                  <span aria-hidden className="font-semibold text-foreground">
                    {rating}
                  </span>
                  <span aria-hidden className="hidden @min-[17rem]:inline">
                    ({formatCompact(course.ratingCount, locale)})
                  </span>
                  <span className="sr-only">
                    {t("courses.ratingSummary", { rating, count: course.ratingCount })}
                  </span>
                </span>
              ) : (
                // No reviews is not a zero rating, so the card prints no score
                // at all rather than a misleading 0.0 or a bare dash that reads
                // as a broken value; the footer keeps the tutor and the
                // participant count. Screen readers still hear why.
                <span className="sr-only">{t("courses.noRatings")}</span>
              )}
              <span
                className="flex items-center gap-1"
                title={t("courses.participants", { count: course.enrolledCount })}
              >
                <Users aria-hidden className="size-3.5" />
                <span aria-hidden>{formatCompact(course.enrolledCount, locale)}</span>
                <span className="sr-only">
                  {t("courses.participants", { count: course.enrolledCount })}
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </LocaleLink>
  );
}

/**
 * The generated cover: the navy gradient from `coverFor` lit by two soft
 * washes, with the course's initials set in a frosted squircle — the same
 * shape as the icon tiles elsewhere on the site, so it reads as a designed
 * cover rather than a missing image.
 */
function CoverArt({ initials }: { initials: string }) {
  return (
    <>
      <span
        aria-hidden
        className="absolute -right-10 -top-14 size-48 rounded-full bg-[radial-gradient(circle,rgba(200,169,81,0.45)_0%,transparent_65%)] blur-2xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-20 -left-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(66,118,179,0.55)_0%,transparent_65%)] blur-2xl"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[image:var(--grain)] opacity-70 mix-blend-soft-light"
      />
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center pt-6 transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
      >
        <span className="grid size-12 place-items-center rounded-lg bg-white/10 font-display text-lg text-white @min-[17rem]:size-16 @min-[17rem]:rounded-2xl @min-[17rem]:text-2xl shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),0_16px_32px_-12px_rgb(0_6_16/0.6)] ring-1 ring-inset ring-white/20 backdrop-blur-sm">
          {initials}
        </span>
      </span>
    </>
  );
}

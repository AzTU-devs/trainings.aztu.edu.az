"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LocaleLink } from "@/i18n/LocaleLink";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import type { Enrollment, EnrollmentStatus } from "../types";
import { coverArt, hash, type ArtKind } from "@/lib/art";

const KINDS: ArtKind[] = ["it", "data", "eng", "biz", "res", "build", "trans", "energy"];

/**
 * An enrolment does not say which category its course is in, so the cover's
 * colour family is picked from the course id: the same course always gets the
 * same cover, in the same generated style as the catalogue's.
 */
function artKindFor(courseId: string): ArtKind {
  return KINDS[hash(courseId) % KINDS.length];
}

const STATUS_KEYS: Record<EnrollmentStatus, string> = {
  ACTIVE: "student.statusActive",
  COMPLETED: "student.statusCompleted",
  PENDING_PAYMENT: "student.statusPendingPayment",
  CANCELLED: "student.statusCancelled",
  REFUNDED: "student.statusRefunded",
};

/*
 * Dates are written out by hand for Azerbaijani rather than through Intl. The
 * card renders on the server (Node, full ICU data) and again in the browser,
 * and some browsers ship without Azerbaijani date data: they print
 * "2026 M09 20" where Node prints "20 sen 2026", and the two renders
 * disagree. Day.month.year is how dates are usually written in Azerbaijan and
 * reads the same everywhere; every engine carries English, so that keeps Intl.
 * Both are pinned to Baku time (UTC+4 all year) so neither side of midnight
 * can shift the day.
 */
const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;

function shortDate(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (locale === "en") {
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Baku",
    }).format(d);
  }
  const baku = new Date(d.getTime() + BAKU_OFFSET_MS);
  const dd = String(baku.getUTCDate()).padStart(2, "0");
  const mm = String(baku.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${baku.getUTCFullYear()}`;
}

/** Frosted pill laid over the cover. */
const GLASS =
  "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold backdrop-blur-md";

export function EnrollmentCard({
  enrollment,
  courseSlug,
  featured = false,
}: {
  enrollment: Enrollment;
  courseSlug?: string;
  /** The wide "pick up where you left off" card at the top of the dashboard. */
  featured?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const slug = courseSlug ?? enrollment.courseId;
  const percent = Math.min(100, Math.max(0, Math.round(enrollment.progressPercent ?? 0)));
  const completed = enrollment.status === "COMPLETED";
  const statusLabel = t(STATUS_KEYS[enrollment.status] ?? "student.statusActive");
  const lastOpened = shortDate(enrollment.lastAccessedAt, locale);
  const enrolledOn = shortDate(enrollment.enrolledAt, locale);
  const meta = lastOpened
    ? t("student.lastOpened", { date: lastOpened })
    : enrolledOn
      ? t("student.enrolledOn", { date: enrolledOn })
      : null;
  const cta = completed
    ? t("student.review")
    : percent > 0
      ? t("student.continue")
      : t("student.start");

  return (
    <LocaleLink
      href={`/learn/${slug}`}
      className={cn(
        "@container group flex h-full flex-col rounded-3xl border border-border/80 bg-card p-2 elev-1 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:elev-3 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        featured && "sm:grid sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:gap-2",
      )}
    >
      <div
        className={cn(
          "cover relative aspect-[16/10] w-full !rounded-2xl",
          `k-${artKindFor(enrollment.courseId)}`,
          featured && "sm:aspect-auto sm:h-full sm:min-h-56",
        )}
      >
        <span
          aria-hidden
          className="sx"
          dangerouslySetInnerHTML={{ __html: coverArt(artKindFor(enrollment.courseId), enrollment.courseId) }}
        />
        <div className="absolute left-2.5 top-2.5">
          <span
            className={cn(
              GLASS,
              completed
                ? "bg-white/90 text-emerald-700 ring-1 ring-inset ring-white/60 dark:bg-navy-950/70 dark:text-emerald-300 dark:ring-white/15"
                : "bg-black/30 text-white ring-1 ring-inset ring-white/20",
            )}
          >
            {completed ? (
              <CheckCircle2 aria-hidden className="size-3.5" />
            ) : (
              <span aria-hidden className="size-1.5 rounded-full bg-gold-300" />
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col px-3 pb-3 pt-4", featured && "sm:px-5 sm:py-5")}>
        {featured ? (
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-gold-500" />
            {t("student.resumeEyebrow")}
          </span>
        ) : null}
        <h3
          className={cn(
            "line-clamp-2 font-display leading-snug text-foreground transition-colors group-hover:text-primary",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {enrollment.courseTitle}
        </h3>
        {meta ? <p className="mt-1.5 text-[13px] text-muted-foreground">{meta}</p> : null}

        <div className="mt-auto pt-5">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="font-medium text-foreground">
              {t("student.progress", { percent })}
            </span>
          </div>
          <div
            aria-hidden
            className={cn(
              "mt-2 w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.08]",
              featured ? "h-2.5" : "h-2",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                completed ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-end border-t border-border/80 pt-3.5">
            <span
              className={cn(
                buttonVariants({ variant: featured ? "default" : "soft", size: "sm" }),
                "pointer-events-none",
              )}
            >
              {cta}
              <ArrowRight
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </div>
    </LocaleLink>
  );
}


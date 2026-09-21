import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Clock,
  Globe,
  MapPin,
  MonitorPlay,
  Star,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CurriculumAccordion } from "@/features/course/components/CurriculumAccordion";
import { EnrollCta } from "@/features/course/components/EnrollCta";
import { ReviewsSection } from "@/features/review/components/ReviewsSection";
import { ExpertAvatar } from "@/features/expert/components/ExpertAvatar";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseServerApi } from "@/features/course/api.server";
import { expertServerApi } from "@/features/expert/api.server";
import { mediaSrc } from "@/features/course/media";
import {
  formatCompact,
  formatPrice,
  formatRating,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import type { ApiError } from "@/types/api";
import type { Course, CourseLevel } from "@/features/course/types";
import type { ExpertProfile } from "@/features/expert/types";

type Props = { params: Promise<{ slug: string; lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  try {
    const c = await courseServerApi.bySlug(slug);
    return {
      title: c.title,
      description: c.subtitle ?? c.description?.slice(0, 160) ?? undefined,
      openGraph: {
        title: c.title,
        description: c.subtitle ?? undefined,
        type: "website",
      },
    };
  } catch {
    const t = await getT(isLocale(lang) ? lang : defaultLocale);
    return { title: t("courseDetail.fallbackTitle") };
  }
}

const LEVEL_KEYS: Record<CourseLevel, string> = {
  BEGINNER: "common.beginner",
  INTERMEDIATE: "common.intermediate",
  ADVANCED: "common.advanced",
  ALL: "common.allLevels",
};

/** One person on the teaching roster. */
type RosterEntry = { tutorId: string; displayName: string; authorized?: boolean };

/**
 * The API sends the full teaching roster as `tutors`, which the shared
 * `Course` type does not declare yet. Read it defensively and fall back to the
 * single owning tutor, so an older API response still renders one expert.
 * The tutor who owns the course leads the list; the rest keep the API's order.
 */
function rosterOf(course: Course): RosterEntry[] {
  const raw = (course as Course & { tutors?: unknown }).tutors;
  const listed = Array.isArray(raw)
    ? (raw as Partial<RosterEntry>[]).filter(
        (e): e is RosterEntry =>
          typeof e?.tutorId === "string" &&
          typeof e.displayName === "string" &&
          e.displayName.trim() !== "",
      )
    : [];
  if (!listed.length) {
    return course.tutorId && course.tutorDisplayName
      ? [{ tutorId: course.tutorId, displayName: course.tutorDisplayName }]
      : [];
  }
  return [...listed].sort(
    (a, b) => Number(b.tutorId === course.tutorId) - Number(a.tutorId === course.tutorId),
  );
}

/** "3 saat 20 dəq" / "3h 20m" — formatDuration's units are English-only. */
function durationText(seconds: number, t: TFunction) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h && m) return t("courseDetail.durationHM", { h, m });
  if (h) return t("courseDetail.durationH", { h });
  return t("courseDetail.durationM", { m: Math.max(m, 1) });
}

/** "Azərbaycan dili" / "Azerbaijani" from an ISO code such as "az". */
function languageText(code: string | null | undefined, locale: Locale, t: TFunction) {
  if (!code) return null;
  let name = code.toUpperCase();
  try {
    const shown = new Intl.DisplayNames([locale], { type: "language" }).of(code);
    if (shown && shown.toLowerCase() !== code.toLowerCase()) {
      name = shown.charAt(0).toLocaleUpperCase(locale) + shown.slice(1);
    }
  } catch {
    // An unknown or malformed code keeps its upper-cased form.
  }
  return t("courseDetail.languageName", { name });
}

/**
 * Outcomes and requirements are free text that authors usually write one item
 * per line, often with their own bullets or numbers. Split them into items so
 * they can be shown as a list; a single paragraph becomes a single item.
 */
function itemsOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•–·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

type Fact = { icon: LucideIcon; label: string; value: string };

const STICKY_TIERS = [
  [720, "lg:[@media(min-height:45rem)]:sticky"],
  [800, "lg:[@media(min-height:50rem)]:sticky"],
  [880, "lg:[@media(min-height:55rem)]:sticky"],
  [960, "lg:[@media(min-height:60rem)]:sticky"],
  [1040, "lg:[@media(min-height:65rem)]:sticky"],
  [1120, "lg:[@media(min-height:70rem)]:sticky"],
] as const;

export default async function CourseDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  let course;
  try {
    course = await courseServerApi.bySlug(slug);
  } catch (err) {
    if ((err as ApiError).status === 404) notFound();
    throw err;
  }

  const totalSeconds =
    course.onlineDetails?.totalVideoSeconds ??
    course.modules.reduce(
      (s, m) => s + m.lessons.reduce((x, l) => x + (l.durationSeconds ?? 0), 0),
      0,
    );
  const lessonCount = course.modules.reduce(
    (s, m) => s + m.lessons.length,
    0,
  );

  // The public profile adds the portrait and title to each expert card. It is
  // an enhancement only: an expert who is not (or no longer) approved answers
  // 404, and the card then falls back to the name the course already carries.
  const roster = rosterOf(course);
  const profiles = await Promise.allSettled(
    roster.map((entry) => expertServerApi.byId(entry.tutorId)),
  );
  const tutors = roster.map((entry, i) => {
    const settled = profiles[i];
    const profile: ExpertProfile | null =
      settled.status === "fulfilled" ? settled.value : null;
    return { ...entry, profile };
  });

  // The detail response carries the thumbnail's media id only (the catalogue
  // entry carries the path), so build the same anonymous media path here.
  const cover = mediaSrc(
    course.thumbnailMediaId
      ? `/api/public/media/${course.thumbnailMediaId}/content`
      : null,
  );
  const initials = course.title
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const priceLabel = course.free
    ? t("common.free")
    : formatPrice(course.price, course.currency, locale);
  const levelLabel = t(LEVEL_KEYS[course.level] ?? "common.allLevels");
  const language = languageText(course.language, locale, t);
  const numberFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const offline = course.offlineDetails;

  // What the enrolment card lists. Zero lessons or zero length means "not
  // published yet", not "an empty course", so those facts are left out rather
  // than shown as 0.
  const lengthSeconds = offline
    ? Number(offline.totalHours) * 3600 || 0
    : totalSeconds;
  const facts: Fact[] = [];
  if (lessonCount > 0) {
    facts.push({
      icon: BookOpen,
      label: t("courseDetail.factLessons"),
      value: t("courseDetail.lessons", { count: lessonCount }),
    });
  }
  if (lengthSeconds > 0) {
    facts.push({
      icon: Clock,
      label: t("courseDetail.factDuration"),
      value: durationText(lengthSeconds, t),
    });
  }
  facts.push({
    icon: ChartNoAxesColumnIncreasing,
    label: t("courseDetail.factLevel"),
    value: levelLabel,
  });
  if (language) {
    facts.push({ icon: Globe, label: t("courseDetail.factLanguage"), value: language });
  }
  if (course.onlineDetails?.hasCertificate) {
    facts.push({
      icon: Award,
      label: t("courseDetail.factCertificate"),
      value: t("courseDetail.certificate"),
    });
  }
  if (offline) {
    const place = [offline.city, offline.addressLine]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(", ");
    if (place) {
      facts.push({ icon: MapPin, label: t("courseDetail.factLocation"), value: place });
    }
    // Date-only strings parse as UTC midnight; format in UTC so the day cannot
    // shift with the server's time zone. An unparseable date is skipped, since
    // formatting an invalid Date throws.
    const start = offline.startDate ? new Date(offline.startDate) : null;
    const endDate = offline.endDate ? new Date(offline.endDate) : null;
    const end = endDate && !Number.isNaN(endDate.getTime()) && start && endDate >= start
      ? endDate
      : null;
    if (start && !Number.isNaN(start.getTime())) {
      const fmt = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      facts.push({
        icon: CalendarDays,
        label: t("courseDetail.factDates"),
        value: end ? fmt.formatRange(start, end) : fmt.format(start),
      });
    }
    const weekly = Number(offline.weeklyHours);
    if (weekly > 0) {
      facts.push({
        icon: Timer,
        label: t("courseDetail.factWeekly"),
        value: t("courseDetail.weeklyHours", { hours: numberFmt.format(weekly) }),
      });
    }
    if (offline.studentLimit) {
      facts.push({
        icon: Users,
        label: t("courseDetail.factSeats"),
        value: t("courseDetail.seats", {
          enrolled: offline.enrolledCount,
          limit: offline.studentLimit,
        }),
      });
    }
  }

  // The sidebar sticks only on screens tall enough to hold all of it: a sticky
  // block taller than the viewport keeps its lower part (the experts) out of
  // reach until the page ends. What it holds fixes its height closely enough
  // (px, measured at desktop widths), so pick the matching min-height tier.
  // The classes are spelled out because Tailwind only generates classes it can
  // find in the source.
  const sidebarPx =
    96 + 24 + // sticky offset and breathing room below
    (course.free ? 160 : 252) + // price and the call to action (+ paid hint)
    (facts.length ? 75 + facts.length * 46 : 0) +
    (tutors.length ? 20 + 99 + tutors.length * 120 : 0);
  const stickyClass = STICKY_TIERS.find(([px]) => sidebarPx <= px)?.[1];

  const outcomes = itemsOf(course.learningOutcomes);
  const requirements = itemsOf(course.requirements);
  const moduleCount = course.modules.length;
  const curriculumSummary = lessonCount
    ? [
        t("courseDetail.modules", { count: moduleCount }),
        t("courseDetail.lessons", { count: lessonCount }),
        totalSeconds > 0 ? durationText(totalSeconds, t) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <>
      {/* ---- Course header: a contained deep-navy panel ------------------ */}
      <section className="container-fluid pt-5 sm:pt-8">
        <Breadcrumbs
          className="mb-4 px-1 sm:mb-5"
          items={[
            { label: t("common.home"), href: localeHref(locale, "/") },
            { label: t("nav.courses"), href: localeHref(locale, "/courses") },
            { label: course.title },
          ]}
        />
        <div className="surface-deep relative overflow-hidden rounded-4xl elev-3">
          <div className="grid gap-8 p-5 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-center lg:gap-14 lg:p-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
            <div className="min-w-0 px-1 pb-2 sm:px-0 sm:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="onDeep" className="h-8 gap-1.5 px-3 text-xs">
                  {course.courseType === "ONLINE" ? (
                    <MonitorPlay aria-hidden className="size-3.5" />
                  ) : (
                    <MapPin aria-hidden className="size-3.5" />
                  )}
                  {course.courseType === "ONLINE"
                    ? t("common.online")
                    : t("common.offline")}
                </Badge>
                <Badge variant="onDeep" className="h-8 gap-1.5 px-3 text-xs">
                  <ChartNoAxesColumnIncreasing aria-hidden className="size-3.5" />
                  {levelLabel}
                </Badge>
                <Badge
                  className={cn(
                    "h-8 px-3 text-xs",
                    course.free
                      ? "border-transparent bg-gold-500 text-navy-950"
                      : "border-white/20 bg-white/10 text-white",
                  )}
                >
                  {priceLabel}
                </Badge>
              </div>

              <h1 className="mt-5 font-display text-balance text-[2rem] leading-[1.08] text-white sm:mt-6 sm:text-5xl">
                {course.title}
              </h1>
              {course.subtitle ? (
                <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/75 sm:mt-5 sm:text-lg">
                  {course.subtitle}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-white/75">
                {course.ratingCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Star aria-hidden className="size-4 fill-gold-400 text-gold-400" />
                    <span className="font-semibold text-white">
                      {formatRating(course.ratingAvg, locale)}
                    </span>
                    <span>
                      (
                      {t("courseDetail.ratings", {
                        count: course.ratingCount,
                        shown: formatCompact(course.ratingCount, locale),
                      })}
                      )
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Star aria-hidden className="size-4 text-gold-300" />
                    {t("courseDetail.noRatings")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users aria-hidden className="size-4 text-white/60" />
                  {t("courseDetail.participants", {
                    count: course.enrolledCount,
                    shown: formatCompact(course.enrolledCount, locale),
                  })}
                </span>
                {language ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe aria-hidden className="size-4 text-white/60" />
                    {language}
                  </span>
                ) : null}
              </div>

              {tutors.length ? (
                <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-6">
                  <div className="flex -space-x-2.5">
                    {tutors.slice(0, 3).map((tutor) => (
                      <span
                        key={tutor.tutorId}
                        className="rounded-full ring-2 ring-[#01234a]"
                      >
                        <ExpertAvatar
                          name={tutor.displayName}
                          avatarUrl={tutor.profile?.avatarUrl}
                          sizes="40px"
                          className="size-10 text-sm"
                        />
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0 text-sm">
                    <div className="text-xs text-white/60">
                      {tutors.length > 1
                        ? t("courseDetail.createdByMany")
                        : t("courseDetail.createdBy")}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-1 font-semibold text-white">
                      {tutors.map((tutor, i) => (
                        <span key={tutor.tutorId}>
                          <Link
                            href={localeHref(locale, `/experts/${tutor.tutorId}`)}
                            className="underline-offset-4 transition-colors hover:text-gold-200 hover:underline"
                          >
                            {tutor.displayName}
                          </Link>
                          {i < tutors.length - 1 ? "," : null}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* The course media. Decorative: the title sits right beside it. */}
            <div className="order-first rounded-3xl bg-white/[0.06] p-2 ring-1 ring-inset ring-white/15 lg:order-none">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-navy-400 via-navy-600 to-navy-900 sm:aspect-[16/10]">
                {cover ? (
                  // `unoptimized` for the same reason as CourseCard: the
                  // optimizer would fetch the API's public hostname from inside
                  // this server, which cannot reach it in production.
                  <Image
                    src={cover}
                    alt=""
                    fill
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 432px"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <span
                      aria-hidden
                      className="absolute -right-10 -top-16 size-56 rounded-full bg-[radial-gradient(circle,rgba(224,194,102,0.45)_0%,transparent_65%)] blur-2xl"
                    />
                    <span
                      aria-hidden
                      className="absolute -bottom-24 -left-16 size-64 rounded-full border border-white/10"
                    />
                    <span
                      aria-hidden
                      className="absolute -bottom-10 -left-4 size-40 rounded-full border border-white/10"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 grid place-items-center font-display text-6xl tracking-tight text-white/30 sm:text-7xl"
                    >
                      {initials}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Body: content column + enrolment sidebar --------------------- */}
      <div className="container-fluid mt-6 flex flex-col gap-6 pb-20 sm:mt-8 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* On phones the enrolment card has to follow the header directly,
            while the experts card waits until after the content. `contents`
            dissolves this wrapper there so `order` can interleave its children
            with the main column; from lg up it is the sticky sidebar. */}
        <div
          className={cn(
            "contents lg:col-start-2 lg:row-start-1 lg:top-24 lg:flex lg:flex-col lg:gap-5",
            stickyClass,
          )}
        >
          <section
            aria-labelledby="course-price"
            className="order-1 rounded-3xl border border-border/80 bg-card elev-2 lg:order-none"
          >
            <div className="p-6 sm:p-7">
              <div
                id="course-price"
                className="font-display text-4xl leading-none tracking-tight"
              >
                {priceLabel}
              </div>
              <div className="mt-5">
                <EnrollCta course={course} />
              </div>
            </div>
            {facts.length ? (
              <div className="border-t border-border px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
                <h2 className="text-sm font-semibold">{t("courseDetail.includes")}</h2>
                <ul className="mt-4 space-y-2.5">
                  {facts.map((fact) => (
                    <li key={fact.label} className="flex items-center gap-3.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100">
                        <fact.icon aria-hidden className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{fact.label}</div>
                        <div className="text-sm font-semibold leading-snug">{fact.value}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {tutors.length ? (
            <aside
              aria-labelledby="course-experts"
              className="order-3 rounded-3xl border border-border/80 bg-card p-6 elev-1 sm:p-7 lg:order-none"
            >
              <h2 id="course-experts" className="font-display text-lg leading-snug">
                {tutors.length > 1
                  ? t("courseDetail.aboutExperts")
                  : t("courseDetail.aboutExpert")}
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {tutors.map((tutor) => {
                  const p = tutor.profile;
                  const affiliation = [p?.academicTitle, p?.department]
                    .map((part) => part?.trim())
                    .filter(Boolean)
                    .join(" · ");
                  const href = localeHref(locale, `/experts/${tutor.tutorId}`);
                  return (
                    <li key={tutor.tutorId} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <ExpertAvatar
                        name={tutor.displayName}
                        avatarUrl={p?.avatarUrl}
                        sizes="52px"
                        className="size-13 text-base"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base leading-snug">
                          <Link href={href} className="transition-colors hover:text-primary">
                            {tutor.displayName}
                          </Link>
                        </h3>
                        {affiliation ? (
                          <p className="mt-0.5 text-sm leading-snug text-foreground/80">
                            {affiliation}
                          </p>
                        ) : null}
                        {p?.headline ? (
                          <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {p.headline}
                          </p>
                        ) : null}
                        {p?.yearsExperience ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("experts.years", { count: p.yearsExperience })}
                          </p>
                        ) : null}
                        <Link
                          href={href}
                          className="group mt-2.5 flex w-fit items-center gap-1.5 text-sm font-semibold text-primary"
                        >
                          {t("courseDetail.viewProfile")}
                          <ArrowRight
                            aria-hidden
                            className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
          ) : null}
        </div>

        <div className="order-2 min-w-0 space-y-6 lg:order-none lg:col-start-1 lg:row-start-1">
          {outcomes.length ? (
            <SectionCard title={t("courseDetail.whatYouLearn")}>
              <ul className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
                {outcomes.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                      <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          {course.description ? (
            <SectionCard title={t("courseDetail.description")}>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            </SectionCard>
          ) : null}

          <SectionCard title={t("courseDetail.curriculum")} meta={curriculumSummary}>
            <CurriculumAccordion
              modules={course.modules}
              emptyMessage={t("courseDetail.curriculumEmpty")}
              emptyHint={t("courseDetail.curriculumEmptyHint")}
            />
          </SectionCard>

          {requirements.length ? (
            <SectionCard title={t("courseDetail.requirements")}>
              <ul className="space-y-2.5">
                {requirements.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
                    <span aria-hidden className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-gold-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <ReviewsSection
            courseId={course.id}
            ratingAvg={course.ratingAvg}
            ratingCount={course.ratingCount}
          />
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.subtitle ?? course.description ?? course.title,
          inLanguage: course.language,
          provider: { "@type": "Organization", name: "EduPlatform" },
          aggregateRating:
            course.ratingCount > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: course.ratingAvg,
                  ratingCount: course.ratingCount,
                }
              : undefined,
          offers: {
            "@type": "Offer",
            price: course.free ? "0" : course.price,
            priceCurrency: course.currency,
            availability: "https://schema.org/InStock",
          },
        }}
      />
    </>
  );
}

/** A white content card in the main column, headed by its section title. */
function SectionCard({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 elev-1 sm:p-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 sm:mb-6">
        <h2 className="font-display text-xl leading-snug sm:text-2xl">{title}</h2>
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
      </div>
      {children}
    </section>
  );
}

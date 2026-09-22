import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Circle,
  CircleHelp,
  Clock,
  Eye,
  File,
  FileText,
  History,
  Languages,
  Layers,
  ListTree,
  Lock,
  MapPin,
  MessageSquare,
  MonitorPlay,
  PlayCircle,
  Radio,
  Sparkles,
  Users,
  Armchair,
} from "lucide-react";
import { CourseCard, CourseCover } from "@/features/course/components/CourseCard";
import { CourseTabs } from "@/features/course/components/CourseTabs";
import { EnrollCta } from "@/features/course/components/EnrollCta";
import { SampleEnrolCta } from "@/features/course/components/SampleEnrolCta";
import { CertificateStage } from "@/features/certificate/CertificateStage";
import { certificateDate, courseCertificate } from "@/features/certificate/course";
import { bakuDateISO } from "@/features/certificate/date";
import { ReviewsSection } from "@/features/review/components/ReviewsSection";
import { categoryOfExpert, getCatalogIndex } from "@/features/course/catalog-index.server";
import { courseLabels } from "@/features/course/labels";
import { categoryLabel } from "@/features/category/label";
import { categoryStyle } from "@/features/category/style";
import { ExpertArch, ExpertDot } from "@/features/expert/components/ExpertArch";
import { expertProfileSource, getCourse, listCourses } from "@/features/showcase/source.server";
import { mockReviews } from "@/features/showcase/data";
import { JsonLd } from "@/components/seo/JsonLd";
import { Svg } from "@/components/bright/Svg";
import { SoftEmpty, StarIcon, Stars } from "@/components/bright/bits";
import { RailControls } from "@/components/bright/RailControls";
import { mapSvg } from "@/lib/art";
import { formatCompact, formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import type { ApiError } from "@/types/api";
import type { Course, CourseSummary, LessonContentType } from "@/features/course/types";
import type { ExpertProfile } from "@/features/expert/types";

type Props = { params: Promise<{ slug: string; lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  try {
    const { course: c, sample } = await getCourse(slug);
    return {
      title: c.title,
      description: c.subtitle ?? c.description?.slice(0, 160) ?? undefined,
      openGraph: { title: c.title, description: c.subtitle ?? undefined, type: "website" },
      // Sample courses are for showing the design; search engines should not
      // list them as real courses.
      robots: sample ? { index: false, follow: true } : undefined,
    };
  } catch {
    const t = await getT(isLocale(lang) ? lang : defaultLocale);
    return { title: t("courseDetail.fallbackTitle") };
  }
}

/**
 * Outcomes and requirements are free text authors usually write one item per
 * line, often with their own bullets or numbers. Split them into items; a
 * single paragraph becomes a single item.
 */
function itemsOf(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•–·]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

/** One person on the teaching roster; the owning expert leads. */
type RosterEntry = { tutorId: string; displayName: string };

function rosterOf(course: Course): RosterEntry[] {
  const raw = (course as Course & { tutors?: unknown }).tutors;
  const listed = Array.isArray(raw)
    ? (raw as Partial<RosterEntry>[]).filter(
        (e): e is RosterEntry => typeof e?.tutorId === "string" && typeof e.displayName === "string" && e.displayName.trim() !== "",
      )
    : [];
  if (!listed.length) {
    return course.tutorId && course.tutorDisplayName ? [{ tutorId: course.tutorId, displayName: course.tutorDisplayName }] : [];
  }
  return [...listed].sort((a, b) => Number(b.tutorId === course.tutorId) - Number(a.tutorId === course.tutorId));
}

const LESSON_ICON: Record<LessonContentType, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  PDF: File,
  QUIZ: CircleHelp,
  LIVE_SESSION: Radio,
};

/** "12:40" for video lengths, "8 dəq" for reading time. */
function lessonLength(type: LessonContentType, seconds: number, t: TFunction) {
  if (!seconds) return "—";
  if (type === "VIDEO") {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return t("ui.durationM", { m: Math.max(1, Math.round(seconds / 60)) });
}

/** "6 oktyabr 2026" — Azerbaijani month names by hand, so no Intl data is needed. */
function dateText(iso: string | null | undefined, locale: Locale, t: TFunction) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const month = t(`course2.month${d.getUTCMonth() + 1}`);
  return locale === "az" ? `${d.getUTCDate()} ${month} ${d.getUTCFullYear()}` : `${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  let loaded;
  try {
    loaded = await getCourse(slug);
  } catch (err) {
    if ((err as ApiError).status === 404) notFound();
    throw err;
  }
  const { course, sample } = loaded;

  const index = await getCatalogIndex();
  const labels = courseLabels(t, locale);
  const category = index.categories.find((c) => course.categoryIds.includes(c.id)) ?? null;
  const style = categoryStyle(category);
  const catName = category ? categoryLabel(category, t, locale) : null;
  const k = style.k;

  const lessons = course.modules.flatMap((m) => m.lessons);
  const lessonCount = lessons.length;
  const totalSeconds =
    course.onlineDetails?.totalVideoSeconds || lessons.reduce((s, l) => s + (l.durationSeconds ?? 0), 0) || null;
  const off = course.offlineDetails;
  const outcomes = itemsOf(course.learningOutcomes);
  const requirements = itemsOf(course.requirements);
  const paragraphs = (course.description ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const language = t(`languages.${course.language}`) !== `languages.${course.language}` ? t(`languages.${course.language}`) : course.language.toUpperCase();

  // The roster's public profiles add titles and portraits; an expert who is
  // not (or no longer) approved just keeps the name the course carries.
  const roster = rosterOf(course);
  const profiles = await Promise.all(roster.map((r) => expertProfileSource(r.tutorId)));
  const lead = roster[0] ? { ...roster[0], profile: profiles[0] as ExpertProfile | null } : null;
  const leadK = lead ? categoryStyle(categoryOfExpert(index, lead.tutorId) ?? category).k : k;

  // Related: the same field first, then the newest others.
  const related = await listCourses({ page: 0, size: 12 })
    .then((p) => p.content.filter((c) => c.id !== course.id))
    .catch(() => [] as CourseSummary[]);
  related.sort(
    (a, b) =>
      Number(index.categoryOfCourse[b.id] === category?.id) - Number(index.categoryOfCourse[a.id] === category?.id),
  );
  const relFor = (c: CourseSummary) => {
    const id = index.categoryOfCourse[c.id];
    const cat = index.categories.find((x) => x.id === id);
    return cat ? { name: categoryLabel(cat, t, locale), style: categoryStyle(cat) } : null;
  };

  const summary = course as unknown as CourseSummary;
  const coverCourse: CourseSummary = {
    ...summary,
    thumbnailUrl:
      summary.thumbnailUrl ?? (course.thumbnailMediaId ? `/api/public/media/${course.thumbnailMediaId}/content` : null),
  };

  const facts: [React.ReactNode, string, string][] = [
    [course.courseType === "ONLINE" ? <MonitorPlay key="f" className="i" aria-hidden /> : <MapPin key="f" className="i" aria-hidden />, t("course2.format"), labels.format[course.courseType]],
    [<BarChart3 key="l" className="i" aria-hidden />, t("course2.level"), labels.level[course.level]],
  ];
  if (off) {
    const start = dateText(off.startDate, locale, t);
    const end = dateText(off.endDate, locale, t);
    if (start || end) facts.push([<Calendar key="d" className="i" aria-hidden />, t("course2.dates"), [start, end].filter(Boolean).join(" – ")]);
    facts.push([<Clock key="w" className="i" aria-hidden />, t("course2.weekly"), t("course2.weeklyValue", { h: off.weeklyHours })]);
    const left = Math.max(0, off.studentLimit - off.enrolledCount);
    facts.push([<Armchair key="s" className="i" aria-hidden />, t("course2.seats"), t("course2.seatsLeft", { count: left })]);
  } else {
    facts.push([<Clock key="c" className="i" aria-hidden />, t("course2.length"), labels.duration(totalSeconds) ?? "—"]);
    facts.push([<Layers key="n" className="i" aria-hidden />, t("course2.lessons"), lessonCount ? t("course2.lessonCount", { count: lessonCount }) : t("course2.preparing")]);
    facts.push([<Languages key="g" className="i" aria-hidden />, t("course2.language"), language]);
  }

  const tabs = [
    { id: "about", label: t("course2.tabAbout") },
    { id: "curriculum", label: t("course2.tabCurriculum"), count: lessonCount || null },
    ...(off ? [{ id: "location", label: t("course2.tabLocation") }] : []),
    ...(lead ? [{ id: "expert", label: t("course2.tabExpert") }] : []),
    ...(sample ? [{ id: "certificate", label: t("certificate.tab") }] : []),
    { id: "reviews", label: t("course2.tabReviews"), count: course.ratingCount || null },
  ];

  const cta = (compact?: boolean) =>
    sample ? <SampleEnrolCta slug={course.slug} compact={compact} /> : <EnrollCta course={course} compact={compact} />;

  const includes: [React.ReactNode, string, string][] = off
    ? [
        [<Calendar key="1" className="i" aria-hidden />, t("course2.starts"), dateText(off.startDate, locale, t) ?? "—"],
        [<Calendar key="2" className="i" aria-hidden />, t("course2.ends"), dateText(off.endDate, locale, t) ?? "—"],
        [<Clock key="3" className="i" aria-hidden />, t("course2.weekly"), t("course2.weeklyValue", { h: off.weeklyHours })],
        [<MapPin key="4" className="i" aria-hidden />, t("course2.city"), off.city ?? "—"],
      ]
    : [
        [<MonitorPlay key="1" className="i" aria-hidden />, t("course2.format"), t("course2.selfPaced")],
        [<Layers key="2" className="i" aria-hidden />, t("course2.lessons"), lessonCount ? t("course2.lessonCount", { count: lessonCount }) : t("course2.preparing")],
        [<Clock key="3" className="i" aria-hidden />, t("course2.length"), labels.duration(totalSeconds) ?? "—"],
        [<Languages key="4" className="i" aria-hidden />, t("course2.language"), language],
      ];

  const enrolCard = (
    <div className={cn("enrol p-6 sm:p-7", k)}>
      <div className="flex items-center justify-between gap-4">
        <span className="price">{labels.free}</span>
        {labels.isNewCourse(summary) ? <span className="pill pill-gold">{labels.isNew}</span> : null}
      </div>
      {off ? (
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-[13.5px]">
            <span className="text-ink-2">{t("course2.seats")}</span>
            <span className="font-semibold">
              {off.enrolledCount} / {off.studentLimit}
            </span>
          </div>
          <div className="seats">
            <i style={{ width: `${Math.min(100, (off.enrolledCount / Math.max(1, off.studentLimit)) * 100)}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-ink-3">
            {t("course2.seatsLeft", { count: Math.max(0, off.studentLimit - off.enrolledCount) })}
          </p>
        </div>
      ) : null}
      <div className="mt-6">{cta()}</div>
      <p className="mt-3 text-center text-[13.5px] text-ink-3">{t("course2.instant")}</p>
      <ul className="inc mt-6 border-t border-line pt-2">
        {includes.map(([icon, l, v]) => (
          <li key={l}>
            {icon}
            {l}
            <b>{v}</b>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <div className={cn("c-page overflow-x-clip", k)}>
        <div className="wrap grid gap-x-10 pb-20 lg:grid-cols-12 lg:pb-28">
          {/* ============ HERO: the category's colour field, full bleed ============ */}
          <section className="c-hero-row min-w-0 pb-20 pt-5 lg:col-span-8 lg:row-start-1 lg:pb-24 lg:pt-12" aria-labelledby="c-title">
            <div className="mb-6 max-w-[560px] lg:hidden">
              <CourseCover course={coverCourse} category={category ? { name: catName!, style } : null} labels={labels} pills={false} className="aspect-[16/10] !rounded-[24px]" />
            </div>
            <nav aria-label={t("ui.breadcrumb")} className="crumbs flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
              <LocaleLink href="/">{t("ui.home")}</LocaleLink>
              <span aria-hidden>/</span>
              <LocaleLink href="/courses">{t("ui.navCourses")}</LocaleLink>
              {category ? (
                <>
                  <span aria-hidden>/</span>
                  <LocaleLink href={`/courses?categoryId=${category.id}`}>{catName}</LocaleLink>
                </>
              ) : null}
            </nav>
            {catName ? (
              <div className="mt-6 lg:mt-8">
                <span className="cat-label">{catName}</span>
              </div>
            ) : null}
            <h1 id="c-title" className="d-lg mt-3 max-w-[48rem]">
              {course.title}
            </h1>
            {course.subtitle ? (
              <p className="sub mt-5 max-w-[44rem] text-[17px] leading-relaxed lg:text-[19px]">{course.subtitle}</p>
            ) : null}
            <div className="meta mt-6 !gap-x-5 !gap-y-2.5 !text-[14.5px]">
              {course.ratingCount > 0 ? (
                <span className="rate">
                  <Stars value={Number(course.ratingAvg)} label={labels.starsLabel(course.ratingAvg)} />
                  <b className="ml-1">{formatRating(course.ratingAvg, locale)}</b>
                  <small className="!text-[14px] !text-[inherit]">({t("course2.ratingsCount", { count: course.ratingCount })})</small>
                </span>
              ) : (
                <span className="fresh !text-[inherit]">
                  <Sparkles className="i" aria-hidden />
                  {t("course2.noRatings")}
                </span>
              )}
              <span>
                <Users className="i" aria-hidden />
                {t("landing.participants", { count: course.enrolledCount })}
              </span>
              <span>
                <Languages className="i" aria-hidden />
                {language}
              </span>
              {course.publishedAt ? (
                <span>
                  <Calendar className="i" aria-hidden />
                  {t("course2.published", { date: dateText(course.publishedAt, locale, t) ?? "" })}
                </span>
              ) : null}
            </div>
            {lead ? (
              <div className="mt-8">
                <a href="#expert" className="group/e flex items-center gap-3">
                  <ExpertDot name={lead.displayName} avatarUrl={lead.profile?.avatarUrl} k={leadK} className="ring-4 ring-[var(--k-50)]" />
                  <span className="leading-tight">
                    <span className="block text-[13px] opacity-75">{labels.expert}</span>
                    <span className="block text-[16px] font-semibold underline-offset-4 group-hover/e:underline">
                      {lead.displayName}
                      {roster.length > 1 ? ` +${roster.length - 1}` : ""}
                    </span>
                  </span>
                </a>
              </div>
            ) : null}
          </section>

          {/* ============ ENROL: starts in the hero, stays beside the content ============ */}
          <aside className="relative z-20 hidden pt-12 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:block" aria-label={t("course2.enrol")}>
            <div className="sticky top-[84px]">
              <div className="rounded-[32px] bg-surface p-2 shadow-[0_0_0_1px_var(--line),var(--shadow-lg)]">
                <CourseCover course={coverCourse} category={category ? { name: catName!, style } : null} labels={labels} pills={false} className="aspect-[16/10] !rounded-[24px]" />
                <div className="[&_.enrol]:!shadow-none">{enrolCard}</div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-8 lg:col-start-1 lg:row-start-2">
            <div className="facts relative z-10 -mt-12" style={{ "--n": facts.length } as React.CSSProperties}>
              {facts.map(([icon, l, v]) => (
                <div key={l} className="fact">
                  <span className="l">
                    {icon}
                    {l}
                  </span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>

            <CourseTabs tabs={tabs} label={t("course2.sections")} />

            {/* About */}
            <section id="about" className="scroll-mt-[150px] pt-12" aria-labelledby="learn-t">
              {outcomes.length ? (
                <div className="outcomes p-6 sm:p-9">
                  <h2 id="learn-t" className="d-md">
                    {t("course2.outcomes")}
                  </h2>
                  <ul className="mt-7 grid gap-x-8 gap-y-4 text-[16px] leading-snug sm:grid-cols-2">
                    {outcomes.map((o) => (
                      <li key={o}>
                        <span className="ck">
                          <Check className="i" aria-hidden />
                        </span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <h2 id="learn-t" className="sr-only">
                  {t("course2.outcomes")}
                </h2>
              )}
              {paragraphs.length || requirements.length ? (
                <div className="mt-12 grid gap-10 md:grid-cols-[1fr_280px]">
                  <div>
                    <h2 className="t-lg">{t("course2.about")}</h2>
                    <div className="prose-b mt-4 max-w-[40rem] text-[16.5px] leading-[1.7] text-ink-2">
                      {paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>
                  {requirements.length ? (
                    <div>
                      <h2 className="t-lg">{t("course2.requirements")}</h2>
                      <ul className="mt-4 grid gap-3 text-[15.5px] text-ink-2">
                        {requirements.map((r) => (
                          <li key={r} className="flex items-start gap-3">
                            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--k-500)]" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            {/* Curriculum */}
            <section id="curriculum" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="cur-t">
              <div>
                <h2 id="cur-t" className="d-md">
                  {t("course2.curriculum")}
                </h2>
                {lessonCount ? (
                  <p className="mt-2 text-[15px] text-ink-3">
                    {t("course2.curriculumSummary", {
                      modules: course.modules.length,
                      lessons: lessonCount,
                    })}
                    {labels.duration(totalSeconds) ? ` · ${labels.duration(totalSeconds)}` : ""}
                  </p>
                ) : null}
              </div>
              <div className="mt-7">
                {lessonCount ? (
                  course.modules.map((m, i) => (
                    <details key={m.id} className="mod acc" open={i === 0}>
                      <summary>
                        <span className="num">{String(i + 1).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[16.5px] font-semibold leading-snug">{m.title}</span>
                          <span className="mt-0.5 block text-[13.5px] text-ink-3">
                            {t("course2.lessonCount", { count: m.lessons.length })}
                          </span>
                        </span>
                        <span className="chev text-ink-3">
                          <ChevronDown className="i" aria-hidden />
                        </span>
                      </summary>
                      <ul>
                        {m.lessons.map((l) => {
                          const Icon = LESSON_ICON[l.contentType] ?? Circle;
                          return (
                            <li key={l.id} className="lesson">
                              <span className="ti" title={t(`course2.type_${l.contentType}`)}>
                                <Icon className="i" aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-ink">{l.title}</span>
                                <span className="block text-[12.5px] text-ink-3 sm:hidden">{t(`course2.type_${l.contentType}`)}</span>
                              </span>
                              {l.preview ? (
                                <span className="pv">
                                  <Eye className="i" aria-hidden />
                                  <span className="t">{t("course2.preview")}</span>
                                </span>
                              ) : l.contentType !== "LIVE_SESSION" ? (
                                <span className="hidden text-ink-3 sm:inline" title={t("course2.lockedHint")}>
                                  <Lock className="i !size-4" aria-hidden />
                                </span>
                              ) : null}
                              <span className="du">{lessonLength(l.contentType, l.durationSeconds, t)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ))
                ) : (
                  <SoftEmpty icon={<ListTree className="i" aria-hidden />} title={t("course2.noCurriculum")} hint={t("course2.noCurriculumHint")} />
                )}
              </div>
            </section>

            {/* Location (in person) */}
            {off ? (
              <section id="location" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="loc-t">
                <h2 id="loc-t" className="d-md">
                  {t("course2.location")}
                </h2>
                <div className="mt-7 grid overflow-hidden rounded-[30px] bg-surface shadow-[0_0_0_1px_var(--line)] sm:grid-cols-[1.1fr_1fr]">
                  <div className={cn("relative aspect-[5/3] sm:aspect-auto sm:min-h-[240px]", k)}>
                    <Svg markup={mapSvg(4)} className="[&>svg]:absolute [&>svg]:inset-0 [&>svg]:size-full" />
                  </div>
                  <div className="flex flex-col gap-4 p-6 sm:p-8">
                    <p className="font-display text-[21px] font-bold leading-snug tracking-tight">{off.addressLine ?? off.city}</p>
                    <p className="text-ink-2">
                      {[off.city, [dateText(off.startDate, locale, t), dateText(off.endDate, locale, t)].filter(Boolean).join(" – ")]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {off.addressLine || off.city ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([off.addressLine, off.city].filter(Boolean).join(", "))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link mt-auto"
                      >
                        {t("course2.openMap")} <ArrowUpRight className="i" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {/* Expert */}
            {lead ? (
              <section id="expert" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="exp-t">
                <h2 id="exp-t" className="d-md">
                  {labels.expert}
                </h2>
                <div className="mt-7 rounded-[36px] bg-paper-2 p-6 sm:p-9">
                  <article className="xcard group relative grid items-start gap-6 sm:grid-cols-[200px_1fr] sm:gap-9">
                    <ExpertArch id={lead.tutorId} name={lead.displayName} avatarUrl={lead.profile?.avatarUrl} k={leadK} className="w-[160px] sm:w-full" />
                    <div>
                      <h3 className="t-lg">
                        <LocaleLink href={`/experts/${lead.tutorId}`} className="underline-offset-4 hover:underline">
                          {lead.displayName}
                        </LocaleLink>
                      </h3>
                      {lead.profile ? (
                        <p className="mt-1.5 text-ink-2">
                          {[lead.profile.academicTitle, lead.profile.department ?? lead.profile.headline].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      <div className="meta mt-4 text-[14px]">
                        {lead.profile && lead.profile.ratingCount > 0 ? (
                          <span className="rate">
                            <StarIcon />
                            {formatRating(lead.profile.ratingAvg, locale)}
                          </span>
                        ) : null}
                        {lead.profile?.yearsExperience ? (
                          <span>
                            <History className="i" aria-hidden />
                            {t("course2.years", { count: lead.profile.yearsExperience })}
                          </span>
                        ) : null}
                      </div>
                      {lead.profile?.bio ? <p className="mt-5 max-w-2xl leading-relaxed text-ink-2">{lead.profile.bio}</p> : null}
                      {lead.profile?.languages ? (
                        <p className="mt-4 text-[14px] text-ink-3">{t("course2.expertLanguages", { value: lead.profile.languages })}</p>
                      ) : null}
                      <LocaleLink href={`/experts/${lead.tutorId}`} className="link mt-6">
                        {t("course2.expertProfile")} <ArrowUpRight className="i" aria-hidden />
                      </LocaleLink>
                    </div>
                  </article>
                </div>
                {roster.length > 1 ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {roster.slice(1).map((r, i) => (
                      <LocaleLink key={r.tutorId} href={`/experts/${r.tutorId}`} className="chip">
                        <ExpertDot name={r.displayName} avatarUrl={profiles[i + 1]?.avatarUrl} k={leadK} className="!size-8 text-[12px]" />
                        {r.displayName}
                      </LocaleLink>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Certificate: sample courses only — the platform does not issue
                certificates yet, so a real course promises none. */}
            {sample ? (
              <section id="certificate" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="cert-t">
                <h2 id="cert-t" className="d-md">
                  {t("certificate.courseTitle")}
                </h2>
                <p className="mt-2 max-w-[40rem] text-[15.5px] text-ink-2">{t("certificate.courseLine")}</p>
                <CertificateStage
                  className="mt-7"
                  k={k}
                  {...courseCertificate({
                    t,
                    locale,
                    today: bakuDateISO(),
                    // An in-person course that has not ended yet is dated its last day.
                    dateISO: certificateDate(bakuDateISO(), off?.endDate),
                    courseId: course.id,
                    title: course.title,
                    categoryName: catName,
                    expertName: lead?.displayName ?? course.tutorDisplayName,
                    totalHours: off?.totalHours,
                    seconds: totalSeconds,
                  })}
                />
              </section>
            ) : null}

            {/* Reviews */}
            <section id="reviews" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="rev-t">
              <h2 id="rev-t" className="d-md">
                {t("course2.reviews")}
              </h2>
              <div className="mt-7">
                {sample ? (
                  <SampleReviews course={course} t={t} locale={locale} />
                ) : (
                  <ReviewsSection courseId={course.id} ratingAvg={course.ratingAvg} ratingCount={course.ratingCount} />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ============ RELATED: same field first ============ */}
      {related.length ? (
        <section className="overflow-x-clip pb-20 lg:pb-28" aria-labelledby="rel-t">
          <div className="wrap">
            <div className="mb-8 flex items-end justify-between gap-6">
              <h2 id="rel-t" className="d-md">
                {t("course2.related")}
              </h2>
              <RailControls target="rail-rel" prev={t("ui.prev")} next={t("ui.next")} />
            </div>
            <div className="scroller bleed pad-y" id="rail-rel" tabIndex={0} aria-label={t("course2.related")}>
              {related.slice(0, 8).map((c) => (
                <div key={c.id} className="w-[80%] max-w-[330px] sm:w-[44%] lg:w-[calc((1360px-80px-72px)/4)] lg:max-w-none">
                  <CourseCard course={c} category={relFor(c)} labels={labels} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Phones and tablets: the enrol action is always one thumb away. Sticky,
          not fixed, and placed before the footer, so it parks above it. */}
      <div className="actionbar">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="shrink-0 leading-tight">
            <p className="font-display text-[22px] font-extrabold tracking-tight">{labels.free}</p>
            <p className="text-[12.5px] text-ink-3">
              {off
                ? t("course2.seatsLeft", { count: Math.max(0, off.studentLimit - off.enrolledCount) })
                : labels.duration(totalSeconds) ?? labels.format[course.courseType]}
            </p>
          </div>
          <div className="flex-1">{cta(true)}</div>
        </div>
      </div>

      {!sample ? (
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
                ? { "@type": "AggregateRating", ratingValue: course.ratingAvg, ratingCount: course.ratingCount }
                : undefined,
            offers: {
              "@type": "Offer",
              price: course.free ? "0" : course.price,
              priceCurrency: course.currency,
              availability: "https://schema.org/InStock",
            },
          }}
        />
      ) : null}
    </>
  );
}

/** Reviews for a sample course: a summary panel beside the review cards. */
function SampleReviews({ course, t, locale }: { course: Course; t: TFunction; locale: Locale }) {
  const { histogram, reviews } = mockReviews(course.id, Number(course.ratingAvg), course.ratingCount);
  const total = histogram.reduce((a, b) => a + b, 0);
  if (!total) {
    return <SoftEmpty icon={<MessageSquare className="i" aria-hidden />} title={t("course2.noReviews")} hint={t("course2.noReviewsHint")} />;
  }
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
      <div className="rounded-[28px] bg-paper-2 p-7 lg:sticky lg:top-[150px]">
        <div className="flex items-end gap-3">
          <span className="font-display text-[64px] font-extrabold leading-[.85] tracking-[-.04em]">
            {formatRating(course.ratingAvg, locale)}
          </span>
          <span className="pb-1">
            <Stars value={Number(course.ratingAvg)} label={t("ui.starsLabel", { value: formatRating(course.ratingAvg, locale) })} large />
          </span>
        </div>
        <p className="mt-3 text-[14px] text-ink-3">{t("course2.basedOn", { count: formatCompact(total, locale) })}</p>
        <ul className="mt-6 grid gap-2.5" aria-label={t("course2.distribution")}>
          {histogram.map((n, i) => (
            <li key={i} className="grid grid-cols-[34px_1fr_44px] items-center gap-3 text-[14px]">
              <span className="inline-flex items-center gap-1 font-medium text-ink-2">
                {5 - i}
                <StarIcon className="size-3.5 fill-[var(--gold)]" />
              </span>
              <span className="hbar">
                <i style={{ width: `${((n / total) * 100).toFixed(1)}%` }} />
              </span>
              <span className="mono text-right text-[12.5px] text-ink-3">{n}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-4">
        {reviews.map((r) => (
          <article key={r.name} className="review">
            <div className="flex items-center gap-3">
              <span className={cn("av round size-10 bg-[var(--k-200)] text-[14px]", r.k)}>
                <span className="ini">{r.initials}</span>
              </span>
              <div className="leading-tight">
                <p className="font-semibold">{r.name}</p>
                <p className="mt-0.5 text-[13px] text-ink-3">{r.month}</p>
              </div>
              <span className="ml-auto">
                <Stars value={r.stars} label={t("ui.starsLabel", { value: String(r.stars) })} />
              </span>
            </div>
            <p className="mt-4 leading-relaxed text-ink-2">{r.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

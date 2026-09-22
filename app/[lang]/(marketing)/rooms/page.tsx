import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowUpRight, Building2, CalendarDays, DoorOpen, FlaskConical, Info, LayoutGrid, Send, Users, X } from "lucide-react";
import { listRooms } from "@/features/rooms/source.server";
import { nowInBaku } from "@/features/rooms/data";
import { ROOM_KINDS, type Room, type RoomKind } from "@/features/rooms/types";
import { KIND_STYLE, RoomCard } from "@/features/rooms/components/RoomCard";
import { RoomFilters } from "@/features/rooms/components/RoomFilters";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils/cn";
import "@/features/rooms/rooms-list.css";

/*
 * "Our classrooms": the university's rooms that experts (tutors — the only
 * role with room:book) can book for their trainings, filterable by kind,
 * building and capacity.
 *
 * Rendered per request. Every card shows how its room's day looks *now*
 * (Baku time), and the filters live in the query string; a cached or
 * prerendered page would freeze "today" at build time. `searchParams` alone
 * already makes the route dynamic — connection() says so explicitly, so the
 * clock stays safe even if the filters ever move client-side. The generated
 * schedule is pure and cheap (a dozen rooms, one day each), so nothing needs
 * caching.
 *
 * The rooms are sample content while SHOWCASE is on (see
 * src/features/rooms/source.server.ts); with it off the list is empty and the
 * page says the catalogue is coming, pointing experts to the dashboard where
 * real rooms are booked. While they are samples the page says so where it
 * makes its claims: a "Sample" pill beside the kicker, on top of the head
 * with the campus figures, and a one-line note right above the cards, whose
 * "free today" lines would otherwise read as live availability.
 */

type SP = Promise<Record<string, string | string[] | undefined>>;
type Props = { params: Promise<{ lang: string }>; searchParams: SP };

/** Capacity floors the filter offers; anything else in `cap` is ignored. */
const CAP_STEPS = ["20", "50", "100"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = await getT(locale);
  const title = t("roomsList.metaTitle");
  const description = t("roomsList.metaDescription");
  // Filtered views are the same page; they all point search engines here.
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/rooms`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/rooms`])),
    },
    openGraph: { title, description, url: `/${locale}/rooms` },
  };
}

/** The list URL with one parameter changed (the others kept). */
function withParam(raw: Record<string, string | undefined>, key: string, value: string | null) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) if (v && k !== key) u.set(k, v);
  if (value) u.set(key, value);
  const qs = u.toString();
  return `/rooms${qs ? `?${qs}` : ""}`;
}

type Filters = { kind: RoomKind | null; building: string | null; cap: number | null };

function parseFilters(raw: Record<string, string | undefined>, codes: Set<string>): Filters {
  const kind = raw.kind?.toUpperCase() as RoomKind | undefined;
  const building = raw.building?.toUpperCase();
  const cap = raw.cap;
  return {
    kind: kind && ROOM_KINDS.includes(kind) ? kind : null,
    building: building && codes.has(building) ? building : null,
    cap: cap && (CAP_STEPS as readonly string[]).includes(cap) ? Number(cap) : null,
  };
}

function matches(room: Room, f: Filters, skip?: keyof Filters) {
  return (
    (skip === "kind" || !f.kind || room.kind === f.kind) &&
    (skip === "building" || !f.building || room.buildingCode === f.building) &&
    (skip === "cap" || !f.cap || room.capacity >= f.cap)
  );
}

export default async function RoomsPage({ params, searchParams }: Props) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(lang)) notFound();
  // A repeated key (?kind=a&kind=b) arrives as an array; the first one wins.
  const raw = Object.fromEntries(Object.entries(query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const locale = lang as Locale;
  await connection();
  const [t, rooms] = await Promise.all([getT(locale), listRooms()]);
  // Baku's clock, read once, so every card describes the same moment.
  const now = nowInBaku();

  const buildings = [...new Map(rooms.map((r) => [r.buildingCode, { code: r.buildingCode, name: r.building }])).values()].sort(
    (a, b) => a.code.localeCompare(b.code),
  );
  const f = parseFilters(raw, new Set(buildings.map((b) => b.code)));
  const results = rooms.filter((r) => matches(r, f));
  const portalRooms = `${env.NEXT_PUBLIC_PORTAL_URL.replace(/\/+$/, "")}/tutor/rooms`;

  // The kind rail counts rooms under the other two filters, so a kind that
  // has nothing in the chosen building reads as empty before it is clicked.
  const kinds = ROOM_KINDS.filter((k) => rooms.some((r) => r.kind === k)).map((k) => ({
    kind: k,
    count: rooms.filter((r) => r.kind === k && matches(r, f, "kind")).length,
  }));
  const allCount = rooms.filter((r) => matches(r, f, "kind")).length;

  // Chips for the active filters, each a link that removes just that one.
  const chips: { label: string; href: string }[] = [];
  if (f.kind) chips.push({ label: t(`rooms.kind_${f.kind}`), href: withParam(raw, "kind", null) });
  if (f.building) {
    const b = buildings.find((x) => x.code === f.building);
    chips.push({ label: `${f.building} · ${b?.name ?? ""}`, href: withParam(raw, "building", null) });
  }
  if (f.cap) chips.push({ label: t("roomsList.capChip", { n: f.cap }), href: withParam(raw, "cap", null) });

  return (
    <>
      {/* ============ 1. HEAD ============ */}
      <section className="relative isolate overflow-x-clip" aria-labelledby="rooms-h1">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden">
          <div className="absolute -top-72 right-[-8%] size-[760px] rounded-full bg-[radial-gradient(closest-side,var(--gold-tint),transparent)]" />
        </div>
        <div className="wrap pt-8 lg:pt-14">
          <nav aria-label={t("ui.breadcrumb")} className="flex items-center gap-2 text-[13.5px] text-ink-3">
            <LocaleLink href="/" className="hover:text-ink">
              {t("ui.home")}
            </LocaleLink>
            <span aria-hidden>/</span>
            <span className="text-ink-2" aria-current="page">
              {t("ui.navRooms")}
            </span>
          </nav>
          <div className="mt-5 grid items-end gap-x-10 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="kicker">
                  <span className="rule" />
                  {t("roomsList.kicker")}
                </p>
                {rooms.length ? <span className="pill pill-gold">{t("roomCard.sample")}</span> : null}
              </div>
              <h1 id="rooms-h1" className="d-lg mt-4">
                {t("roomsList.title")}
              </h1>
              {/* Without rooms the page cannot promise to show them. */}
              <p className="lead mt-4 max-w-[34rem]">{t(rooms.length ? "roomsList.lede" : "roomsList.ledeSoon")}</p>
            </div>
            {rooms.length ? <Stats rooms={rooms} buildings={buildings.length} t={t} /> : null}
          </div>
        </div>

        {rooms.length ? (
          <div className="wrap mt-9 lg:mt-12">
            <div className="scroller bleed pad-y" role="group" aria-label={t("roomsList.kindFilter")}>
              {/* Links, so the active one is marked with aria-current, not
                  aria-pressed (which the link role does not take). */}
              <Link
                href={localeHref(locale, withParam(raw, "kind", null))}
                className="cat-mini k-navy"
                aria-current={!f.kind ? "true" : undefined}
                scroll={false}
              >
                <span className="sw grid place-items-center !bg-[var(--brand-navy)] text-white">
                  <LayoutGrid className="i" aria-hidden />
                </span>
                <span>
                  <b>{t("roomsList.allRooms")}</b>
                  <small>{t("roomsList.roomCount", { count: allCount })}</small>
                </span>
              </Link>
              {kinds.map(({ kind, count }) => {
                const { icon: Icon, k } = KIND_STYLE[kind];
                return (
                  <Link
                    key={kind}
                    href={localeHref(locale, withParam(raw, "kind", f.kind === kind ? null : kind.toLowerCase()))}
                    className={cn("cat-mini", k, !count && "dim")}
                    aria-current={f.kind === kind ? "true" : undefined}
                    scroll={false}
                  >
                    <span className="sw ico">
                      <Icon className="i" aria-hidden />
                    </span>
                    <span>
                      <b>{t(`rooms.kind_${kind}`)}</b>
                      <small>{t("roomsList.roomCount", { count })}</small>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {rooms.length ? (
        <>
          {/* ============ 2. RESULTS ============ */}
          <section className="rm-list wrap pb-20 pt-6 lg:pb-28 lg:pt-8" aria-labelledby="rooms-count">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <h2 id="rooms-count" className="mr-auto font-display text-[20px] font-bold tracking-tight lg:text-[22px]">
                {t("roomsList.roomCount", { count: results.length })}
              </h2>
              <RoomFilters buildings={buildings} capSteps={CAP_STEPS} />
              {chips.length ? (
                <div className="flex w-full flex-wrap items-center gap-2">
                  {chips.map((c) => (
                    <Link key={c.label} href={localeHref(locale, c.href)} className="chip sm plain" scroll={false}>
                      {c.label} <X className="x" aria-label={t("catalog.remove")} />
                    </Link>
                  ))}
                  <LocaleLink
                    href="/rooms"
                    scroll={false}
                    className="ml-1 text-[13.5px] font-semibold text-ink-2 underline decoration-line-2 underline-offset-4 hover:decoration-gold"
                  >
                    {t("catalog.clear")}
                  </LocaleLink>
                </div>
              ) : null}
            </div>
            <p className="note mb-8 mt-5 w-fit max-w-full lg:mb-10">
              <Info className="i shrink-0" aria-hidden />
              <span>{t("roomsList.sampleNote")}</span>
            </p>

            {results.length ? (
              <div className="rm-grid grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-14">
                {results.map((room) => (
                  <RoomCard key={room.id} room={room} locale={locale} now={now} />
                ))}
              </div>
            ) : (
              <EmptyResult t={t} />
            )}
          </section>

          {/* ============ 3. HOW BOOKING WORKS ============ */}
          <HowBooking t={t} portalRooms={portalRooms} />
        </>
      ) : (
        <ComingSoon t={t} portalRooms={portalRooms} />
      )}
    </>
  );
}

/*
 * The figures describe the sample rooms, so their label says so to screen
 * readers too. The box is a size container: whether the four figures fit in
 * one row depends on the card's own width (half the head from 1024px), not
 * on the viewport's (see rooms-list.css).
 */
function Stats({ rooms, buildings, t }: { rooms: Room[]; buildings: number; t: TFunction }) {
  const items = [
    { icon: DoorOpen, label: t("roomsList.statRooms"), value: rooms.length },
    { icon: Users, label: t("roomsList.statSeats"), value: rooms.reduce((s, r) => s + r.capacity, 0) },
    { icon: Building2, label: t("roomsList.statBuildings"), value: buildings },
    {
      icon: FlaskConical,
      label: t("roomsList.statLabs"),
      value: rooms.filter((r) => r.kind === "COMPUTER_LAB" || r.kind === "ENGINEERING_LAB").length,
    },
  ];
  return (
    <div className="rm-stats-box lg:col-span-6">
      <dl className="rm-stats" aria-label={`${t("roomsList.stats")} (${t("roomCard.sample")})`}>
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <dt>
              <Icon className="i" aria-hidden />
              {label}
            </dt>
            <dd className="tnum">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EmptyResult({ t }: { t: TFunction }) {
  return (
    <div className="empty k-build relative overflow-hidden px-6 py-14 sm:py-20">
      {/* an empty floor plan, measured */}
      <svg viewBox="0 0 240 150" className="mx-auto w-[220px]" aria-hidden>
        <circle cx="120" cy="75" r="70" className="f100" />
        <path
          className="grid"
          d="M60 20V130M80 20V130M100 20V130M120 20V130M140 20V130M160 20V130M180 20V130M60 40H180M60 60H180M60 80H180M60 100H180M60 120H180"
          opacity=".7"
        />
        <rect x="66" y="38" width="108" height="72" className="f0" />
        <path d="M140 110H66V38H174V110H158" className="s900 fnone" strokeWidth="5" strokeLinejoin="round" />
        <path d="M140 110V94" className="s700" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M140 94A16 16 0 0 1 156 110" className="dimline" strokeDasharray="3 4" />
        <path d="M100 66L140 82M140 66L100 82" className="s500 rnd" strokeWidth="6" />
        <circle cx="186" cy="30" r="7" className="fg" />
      </svg>
      <h3 className="t-lg mt-6">{t("roomsList.emptyTitle")}</h3>
      <p className="mx-auto mt-2 max-w-md text-ink-2">{t("roomsList.emptyText")}</p>
      <LocaleLink href="/rooms" scroll={false} className="btn btn-primary mt-7">
        {t("catalog.clearFilters")}
      </LocaleLink>
    </div>
  );
}

function PanelLink({ href, t, className }: { href: string; t: TFunction; className?: string }) {
  return (
    <a href={href} className={cn("btn btn-primary", className)}>
      {t("roomsList.ctaPanel")} <ArrowUpRight className="i i-arrow" aria-hidden />
    </a>
  );
}

function HowBooking({ t, portalRooms }: { t: TFunction; portalRooms: string }) {
  const steps = [
    { icon: DoorOpen, title: t("roomsList.step1Title"), text: t("roomsList.step1Text") },
    { icon: CalendarDays, title: t("roomsList.step2Title"), text: t("roomsList.step2Text") },
    { icon: Send, title: t("roomsList.step3Title"), text: t("roomsList.step3Text") },
  ];
  return (
    <section className="pb-20 lg:pb-28" aria-labelledby="how-t">
      <div className="wrap">
        <div className="rm-how k-navy grid gap-8 p-5 sm:gap-10 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
          <div className="flex flex-col lg:col-span-5">
            <p className="kicker">
              <span className="rule" />
              {t("roomsList.howKicker")}
            </p>
            <h2 id="how-t" className="d-md mt-4">
              {t("roomsList.howTitle")}
            </h2>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-2">{t("roomsList.howSub")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PanelLink href={portalRooms} t={t} />
              <LocaleLink href="/register/tutor" className="btn btn-ghost">
                {t("catalog.applyExpert")}
              </LocaleLink>
            </div>
          </div>
          <ol className="rm-steps lg:col-span-7">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <span className="n" aria-hidden>
                  <Icon className="i" />
                </span>
                <div>
                  <p className="mono text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1">{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** SHOWCASE off: no rooms to show, and no pretend ones. */
function ComingSoon({ t, portalRooms }: { t: TFunction; portalRooms: string }) {
  return (
    <section className="wrap pb-20 pt-10 lg:pb-28 lg:pt-14" aria-labelledby="soon-t">
      <div className="soft-empty flex-col items-start !gap-5 !p-7 sm:flex-row sm:items-center sm:!p-9">
        <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-surface text-ink-3 shadow-[0_0_0_1px_var(--line)]">
          <DoorOpen className="i !size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="soon-t" className="t-lg">
            {t("roomsList.soonTitle")}
          </h2>
          <p className="mt-1.5 max-w-2xl text-ink-2">{t("roomsList.soonText")}</p>
        </div>
        <PanelLink href={portalRooms} t={t} className="shrink-0" />
      </div>
    </section>
  );
}

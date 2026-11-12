import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowUpRight, Building2, DoorOpen, FlaskConical, Info, SearchX, Users, X } from "lucide-react";
import { listRooms } from "@/features/rooms/source.server";
import { nowInBaku } from "@/features/rooms/data";
import { ROOM_KINDS, type Room, type RoomKind } from "@/features/rooms/types";
import { RoomCard } from "@/features/rooms/components/RoomCard";
import { RoomFilters } from "@/features/rooms/components/RoomFilters";
import { PageHeader } from "@/components/layout/PageHeader";
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
 * makes its claims: a "Sample" pill above the title, beside the campus
 * figures, and a one-line note right above the cards, whose "free today"
 * lines would otherwise read as live availability.
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
      <PageHeader
        id="rooms-h1"
        title={t("roomsList.title")}
        // Without rooms the page cannot promise to show them.
        lead={t(rooms.length ? "roomsList.lede" : "roomsList.ledeSoon")}
        crumbs={[{ label: t("ui.home"), href: "/" }, { label: t("ui.navRooms") }]}
        crumbsLabel={t("ui.breadcrumb")}
        above={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="kicker">{t("roomsList.kicker")}</p>
            {rooms.length ? <span className="pill pill-gold">{t("roomCard.sample")}</span> : null}
          </div>
        }
        aside={rooms.length ? <Stats rooms={rooms} buildings={buildings.length} t={t} /> : undefined}
      >
        {rooms.length ? (
          <div className="chip-row scroll mt-8" role="group" aria-label={t("roomsList.kindFilter")}>
            {/* Links, so the active one is marked with aria-current, not
                aria-pressed (which the link role does not take). */}
            <Link
              href={localeHref(locale, withParam(raw, "kind", null))}
              className="chip"
              aria-current={!f.kind ? "true" : undefined}
              scroll={false}
            >
              {t("roomsList.allRooms")} <span className="n">{allCount}</span>
            </Link>
            {kinds.map(({ kind, count }) => (
              <Link
                key={kind}
                href={localeHref(locale, withParam(raw, "kind", f.kind === kind ? null : kind.toLowerCase()))}
                className={cn("chip", !count && "dim")}
                aria-current={f.kind === kind ? "true" : undefined}
                scroll={false}
              >
                {t(`rooms.kind_${kind}`)} <span className="n">{count}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </PageHeader>

      {rooms.length ? (
        <>
          {/* ============ 2. RESULTS ============ */}
          <section className="rm-list wrap pb-16 lg:pb-24" aria-labelledby="rooms-count">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-6 lg:pt-10">
              <h2 id="rooms-count" className="t-lg mr-auto">
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
              <div className="rm-grid grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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
    <div className="rm-stats-box">
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
    <div className="empty px-6 py-14 sm:py-20">
      <span className="empty-ic">
        <SearchX className="i" aria-hidden />
      </span>
      <h3 className="t-lg mt-5">{t("roomsList.emptyTitle")}</h3>
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
  return (
    <section className="section band" aria-labelledby="how-t">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="kicker">{t("roomsList.howKicker")}</p>
          <h2 id="how-t" className="d-lg mt-3">
            {t("roomsList.howTitle")}
          </h2>
          <p className="lead mt-3">{t("roomsList.howSub")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PanelLink href={portalRooms} t={t} />
            <LocaleLink href="/register/tutor" className="btn btn-ghost">
              {t("catalog.applyExpert")}
            </LocaleLink>
          </div>
        </div>
        <ol className="steps self-start lg:col-span-8">
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <span className="n" aria-hidden>
                {String(n).padStart(2, "0")}
              </span>
              <h3>{t(`roomsList.step${n}Title`)}</h3>
              <p>{t(`roomsList.step${n}Text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** SHOWCASE off: no rooms to show, and no pretend ones. */
function ComingSoon({ t, portalRooms }: { t: TFunction; portalRooms: string }) {
  return (
    <section className="wrap pb-16 pt-2 lg:pb-24" aria-labelledby="soon-t">
      <div className="soft-empty flex-col items-start !gap-5 !p-6 sm:flex-row sm:items-center sm:!p-8">
        <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-surface text-ink-3 shadow-[0_0_0_1px_var(--line)]">
          <DoorOpen className="i" aria-hidden />
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

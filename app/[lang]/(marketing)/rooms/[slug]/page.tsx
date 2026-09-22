import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  Check,
  Clock,
  DoorOpen,
  Info,
  Layers,
  LayoutGrid,
  MapPin,
  Ruler,
  Users,
} from "lucide-react";
import { getRoom, listRooms } from "@/features/rooms/source.server";
import { busySlots, dayStatus, dayUtilisation, nowInBaku, scheduleRange } from "@/features/rooms/data";
import { AMENITY_ICON, RoomCard, RoomCover } from "@/features/rooms/components/RoomCard";
import {
  NextBookableBar,
  NextBookableCard,
  NextBookableLine,
  ReserveButton,
  RoomBooking,
  type BookingRoom,
} from "@/features/rooms/components/RoomBooking";
import { RoomCalendar } from "@/features/rooms/components/RoomCalendar";
import { CourseTabs } from "@/features/course/components/CourseTabs";
import { Svg } from "@/components/bright/Svg";
import { RailControls } from "@/components/bright/RailControls";
import { hash, mapSvg } from "@/lib/art";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils/cn";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import "@/features/rooms/rooms-detail.css";

/*
 * One university room, in the course page's layout: the room's colour field
 * as the hero, a sticky card with today's availability and the reserve
 * button, the facts strip on the hero's edge, in-page tabs, and the busy
 * calendar with its reserve dialog.
 *
 * "Next free" on this page means the first time the visitor could book: it
 * follows the room's printed rules (requests 2 working days ahead) and the
 * visitor's own sample requests, so it is worked out in the browser by
 * RoomBooking from the same strings the server rendered.
 *
 * Rooms are SAMPLE content (src/features/rooms/source.server.ts); with the
 * sample content switched off there is no room to show, so every slug is a
 * 404. The reserve flow never sends anything — see RoomBooking.
 *
 * Rendered per request: "today", the busy calendar's window and the next
 * free hour all depend on the clock in Baku, and a prerendered or cached page
 * would freeze them at build time. connection() makes the route wait for a
 * real request (node_modules/next/dist/docs/.../functions/connection.md).
 */

type Props = { params: Promise<{ slug: string; lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  const t = await getT(isLocale(lang) ? lang : defaultLocale);
  const room = await getRoom(slug);
  if (!room) return { title: t("roomPage.metaFallback") };
  return {
    title: t("roomPage.metaTitle", { name: room.name }),
    description: room.summary,
    openGraph: { title: room.name, description: room.summary, type: "website" },
    // Sample rooms show the design; search engines should not list them.
    robots: { index: false, follow: true },
  };
}

function floorText(n: number, t: TFunction) {
  return n >= 1 && n <= 6 ? t(`roomPage.floor${n}`) : t("roomPage.floorN", { n });
}

/** "23 sentyabr" / "September 23" from translation keys (no Intl with az). */
function dayText(iso: string, t: TFunction) {
  return t("roomPage.dateDM", { day: Number(iso.slice(8)), month: t(`course2.month${Number(iso.slice(5, 7))}`) });
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug, lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  await connection();

  const room = await getRoom(slug);
  if (!room) notFound();
  const t = await getT(locale);
  const k = `k-${room.hue}`;

  // Baku's clock, read once; everything below derives from these strings.
  const now = nowInBaku();
  const today = now.date;
  const range = scheduleRange(today);
  const slots = busySlots(room, range.from, range.to);
  const todayStatus = dayStatus(room, today, slots);
  const todayPct = Math.round(dayUtilisation(room, today, slots) * 100);
  // Only what the booking UI reads crosses to the browser; the texts
  // (description, equipment, rules) are already in the HTML.
  const bookingRoom: BookingRoom = {
    id: room.id,
    slug: room.slug,
    name: room.name,
    kind: room.kind,
    buildingCode: room.buildingCode,
    capacity: room.capacity,
    openHours: room.openHours,
    hue: room.hue,
    layout: room.layout,
  };

  const kind = t(`rooms.kind_${room.kind}`);
  const floor = floorText(room.floor, t);
  const hoursWeekday = room.openHours.weekday.join("–");
  const hoursSaturday = room.openHours.saturday ? room.openHours.saturday.join("–") : t("roomPage.closed");

  // Other rooms: the same kind first, then the same building.
  const others = (await listRooms())
    .filter((r) => r.id !== room.id)
    .map((r) => ({ r, score: Number(r.kind === room.kind) * 2 + Number(r.buildingCode === room.buildingCode) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.r);

  const facts: [React.ReactNode, string, React.ReactNode][] = [
    [<Users key="c" className="i" aria-hidden />, t("roomPage.capacity"), t("roomPage.seats", { count: room.capacity })],
    [<Ruler key="a" className="i" aria-hidden />, t("roomPage.area"), t("roomPage.areaValue", { n: room.areaM2 })],
    [<Layers key="f" className="i" aria-hidden />, t("roomPage.floor"), floor],
    [<LayoutGrid key="l" className="i" aria-hidden />, t("roomPage.layout"), t(`rooms.layout_${room.layout}`)],
    [<Clock key="h" className="i" aria-hidden />, t("roomPage.hours"), <span key="hv" className="nw">{hoursWeekday}</span>],
    [<DoorOpen key="n" className="i" aria-hidden />, t("roomPage.roomNo"), `${room.buildingCode}-${room.roomNumber}`],
  ];

  const tabs = [
    { id: "about", label: t("roomPage.tabAbout") },
    { id: "calendar", label: t("roomPage.tabCalendar") },
    { id: "equipment", label: t("roomPage.tabEquipment"), count: room.equipment.length || null },
    { id: "rules", label: t("roomPage.tabRules"), count: room.rules.length || null },
    { id: "location", label: t("roomPage.tabLocation") },
  ];

  const panelUrl = `${env.NEXT_PUBLIC_PORTAL_URL.replace(/\/+$/, "")}/tutor/rooms`;

  const statusPill = (
    <span className={cn("rc-status k-navy", `s-${todayStatus}`)}>
      <i aria-hidden />
      {t(`rooms.status_${todayStatus}`)}
    </span>
  );

  const reserveCard = (
    <div className={cn("enrol p-6 sm:p-7", k)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13.5px] font-semibold text-ink-2">{t("roomPage.todayDate", { date: dayText(today, t) })}</span>
        {statusPill}
      </div>
      <div className="mt-5">
        <NextBookableCard />
      </div>
      {todayStatus !== "CLOSED" ? (
        <div className="mt-5">
          <div className="seats">
            <i style={{ width: `${todayPct}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-ink-3">{t("roomPage.bookedToday", { pct: todayPct })}</p>
        </div>
      ) : null}
      <div className="mt-6 grid gap-2.5">
        <ReserveButton className="btn btn-primary btn-lg btn-block">
          <CalendarPlus className="i" aria-hidden />
          {t("roomPage.reserve")}
        </ReserveButton>
        <a href="#calendar" className="btn btn-ghost btn-block">
          <CalendarDays className="i" aria-hidden />
          {t("roomPage.seeCalendar")}
        </a>
      </div>
      <p className="note mt-4">
        <Info className="i shrink-0" aria-hidden />
        <span>{t("roomPage.reviewNote")}</span>
      </p>
      <ul className="inc mt-5 border-t border-line pt-2">
        <li>
          <Clock className="i" aria-hidden />
          {t("roomPage.hoursWeekdays")}
          <b>{hoursWeekday}</b>
        </li>
        <li>
          <Clock className="i" aria-hidden />
          {t("rooms.wdLong6")}
          <b>{hoursSaturday}</b>
        </li>
        <li>
          <CalendarOff className="i" aria-hidden />
          {t("rooms.wdLong7")}
          <b>{t("roomPage.closed")}</b>
        </li>
        <li>
          <Users className="i" aria-hidden />
          {t("roomPage.capacity")}
          <b>{t("roomPage.seats", { count: room.capacity })}</b>
        </li>
      </ul>
    </div>
  );

  return (
    <RoomBooking room={bookingRoom} slots={slots} now={now} range={range} portalUrl={env.NEXT_PUBLIC_PORTAL_URL}>
      <div className={cn("c-page overflow-x-clip", k)}>
        <div className="wrap grid gap-x-10 pb-20 lg:grid-cols-12 lg:pb-28">
          {/* ============ HERO: the room's colour field, full bleed ============ */}
          <section className="c-hero-row min-w-0 pb-20 pt-5 lg:col-span-8 lg:row-start-1 lg:pb-24 lg:pt-12" aria-labelledby="r-title">
            <div className="mb-6 max-w-[560px] lg:hidden">
              <RoomCover room={room} className="aspect-[16/10] !rounded-[24px]" />
            </div>
            <nav aria-label={t("ui.breadcrumb")} className="crumbs flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
              <LocaleLink href="/">{t("ui.home")}</LocaleLink>
              <span aria-hidden>/</span>
              <LocaleLink href="/rooms">{t("ui.navRooms")}</LocaleLink>
              <span aria-hidden>/</span>
              <LocaleLink href={`/rooms?building=${room.buildingCode.toLowerCase()}`}>{room.building}</LocaleLink>
            </nav>
            <div className="mt-6 flex flex-wrap items-center gap-2.5 lg:mt-8">
              <span className="cat-label">{kind}</span>
              {/* Phones have no side card and its sample note, so say it here too. */}
              <span className="pill pill-gold">{t("roomCard.sample")}</span>
            </div>
            <h1 id="r-title" className="d-lg mt-3 max-w-[48rem]">
              {room.name}
            </h1>
            <p className="sub mt-5 max-w-[44rem] text-[17px] leading-relaxed lg:text-[19px]">{room.summary}</p>
            <div className="meta mt-6 !gap-x-5 !gap-y-2.5 !text-[14.5px]">
              <span>
                <Users className="i" aria-hidden />
                {t("roomPage.seats", { count: room.capacity })}
              </span>
              <span>
                <Building2 className="i" aria-hidden />
                {room.building} · {room.buildingCode}
              </span>
              <span>
                <Layers className="i" aria-hidden />
                {floor}
              </span>
              <span>
                <Clock className="i" aria-hidden />
                {hoursWeekday}
              </span>
            </div>
            {/* Phones and tablets have no side card: today's state sits here. */}
            <div className="mt-8 inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[22px] bg-surface p-1.5 pr-4 text-ink shadow-[0_0_0_1px_var(--line),var(--shadow-sm)] lg:hidden">
              {statusPill}
              <NextBookableLine className="py-0.5 pl-1 text-[14px] font-medium sm:pl-0" />
            </div>
          </section>

          {/* ============ RESERVE: starts in the hero, stays beside the content ============ */}
          <aside className="relative z-20 hidden pt-12 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:block" aria-label={t("roomPage.reserve")}>
            <div className="sticky top-[84px]">
              <div className="rounded-[32px] bg-surface p-2 shadow-[0_0_0_1px_var(--line),var(--shadow-lg)]">
                <RoomCover room={room} className="aspect-[16/10] !rounded-[24px]" />
                <div className="[&_.enrol]:!shadow-none">{reserveCard}</div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-8 lg:col-start-1 lg:row-start-2">
            <div className="facts rd-facts relative z-10 -mt-12" style={{ "--n": facts.length } as React.CSSProperties}>
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

            <CourseTabs tabs={tabs} label={t("roomPage.sections")} />

            {/* About */}
            <section id="about" className="scroll-mt-[150px] pt-12" aria-labelledby="about-t">
              <h2 id="about-t" className="d-md">
                {t("roomPage.aboutTitle")}
              </h2>
              <div className="prose-b mt-5 max-w-[44rem] text-[16.5px] leading-[1.7] text-ink-2">
                {room.description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {room.amenities.length ? (
                <div className="outcomes mt-10 p-5 sm:p-8">
                  <h3 className="t-lg">{t("roomPage.amenitiesTitle")}</h3>
                  <ul className="rd-amen mt-5">
                    {room.amenities.map((a) => {
                      const Icon = AMENITY_ICON[a];
                      return (
                        <li key={a}>
                          <span className="ic">
                            <Icon className="i" aria-hidden />
                          </span>
                          {t(`rooms.amenity_${a}`)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </section>

            {/* Calendar */}
            <section id="calendar" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="cal-t">
              <h2 id="cal-t" className="d-md">
                {t("roomPage.calendarTitle")}
              </h2>
              <p className="mt-2 max-w-[42rem] text-[15.5px] text-ink-2">{t("roomPage.calendarLead")}</p>
              <div className="mt-7">
                <RoomCalendar />
              </div>
            </section>

            {/* Equipment */}
            <section id="equipment" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="eq-t">
              <h2 id="eq-t" className="d-md">
                {t("roomPage.equipmentTitle")}
              </h2>
              <ul className="rd-list cols mt-7">
                {room.equipment.map((e) => (
                  <li key={e}>
                    <span className="dot">
                      <Check className="i" aria-hidden />
                    </span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Rules */}
            <section id="rules" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="rules-t">
              <h2 id="rules-t" className="d-md">
                {t("roomPage.rulesTitle")}
              </h2>
              <ol className="rd-list mt-7">
                {room.rules.map((r, i) => (
                  <li key={r}>
                    <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
              <div className="note mt-4 !p-4">
                <Info className="i shrink-0" aria-hidden />
                <span>
                  {t("roomPage.rulesSample")}{" "}
                  <a href={panelUrl} target="_blank" rel="noopener noreferrer" className="link !inline-flex text-[13.5px]">
                    {t("roomPage.panelLink")}
                    <ArrowUpRight className="i" aria-hidden />
                  </a>
                </span>
              </div>
            </section>

            {/* Location */}
            <section id="location" className="scroll-mt-[150px] pt-16 lg:pt-20" aria-labelledby="loc-t">
              <h2 id="loc-t" className="d-md">
                {t("roomPage.locationTitle")}
              </h2>
              <div className="mt-7 grid overflow-hidden rounded-[30px] bg-surface shadow-[0_0_0_1px_var(--line)] sm:grid-cols-[1.1fr_1fr]">
                <div className={cn("relative aspect-[5/3] sm:aspect-auto sm:min-h-[240px]", k)}>
                  <Svg markup={mapSvg(hash(room.buildingCode))} className="[&>svg]:absolute [&>svg]:inset-0 [&>svg]:size-full" />
                </div>
                <div className="flex flex-col gap-4 p-6 sm:p-8">
                  <p className="font-display text-[21px] font-bold leading-snug tracking-tight">
                    {t("roomPage.roomAt", { building: room.building, code: room.buildingCode, floor, room: room.roomNumber })}
                  </p>
                  <p className="flex items-start gap-2 text-ink-2">
                    <MapPin className="i mt-0.5 !size-[18px] text-ink-3" aria-hidden />
                    {t("roomPage.address")}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${room.coords.lat},${room.coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link mt-auto"
                  >
                    {t("course2.openMap")} <ArrowUpRight className="i" aria-hidden />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ============ OTHER ROOMS ============ */}
      {others.length ? (
        <section className="overflow-x-clip pb-20 lg:pb-28" aria-labelledby="rel-t">
          <div className="wrap">
            <div className="mb-8 flex items-end justify-between gap-6">
              <h2 id="rel-t" className="d-md">
                {t("roomPage.related")}
              </h2>
              <div className="flex items-center gap-4">
                <LocaleLink href="/rooms" className="link hidden text-[15px] sm:inline-flex">
                  {t("roomPage.allRooms")} <ArrowUpRight className="i" aria-hidden />
                </LocaleLink>
                <RailControls target="rail-rooms" prev={t("ui.prev")} next={t("ui.next")} />
              </div>
            </div>
            <div className="scroller bleed pad-y" id="rail-rooms" tabIndex={0} aria-label={t("roomPage.related")}>
              {others.map((r) => (
                <div key={r.id} className="w-[84%] max-w-[340px] sm:w-[46%] lg:w-[calc((1360px-80px-72px)/4)] lg:max-w-none">
                  <RoomCard room={r} locale={locale} now={now} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Phones and tablets: the reserve action is always one thumb away.
          Sticky, not fixed, and placed before the footer, so it parks above it. */}
      <div className="actionbar">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 shrink leading-tight">
            <NextBookableBar fallback={t(`rooms.status_${todayStatus}`)} />
          </div>
          <div className="ml-auto shrink-0">
            {/* the short label leaves the time room on a 320px phone */}
            <ReserveButton className="btn btn-primary">
              <CalendarPlus className="i" aria-hidden />
              {t("roomPage.reserveShort")}
            </ReserveButton>
          </div>
        </div>
      </div>
    </RoomBooking>
  );
}

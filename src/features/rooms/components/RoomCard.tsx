import Image from "next/image";
import type { ReactNode } from "react";
import {
  Accessibility,
  AirVent,
  CircuitBoard,
  Clapperboard,
  FlaskConical,
  Landmark,
  MapPin,
  MessagesSquare,
  Monitor,
  PenLine,
  Presentation,
  Projector,
  Ruler,
  Tv,
  Users,
  Video,
  Volume2,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { LocaleLink } from "@/i18n/LocaleLink";
import { getT } from "@/i18n/server";
import type { TFunction } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { hash } from "@/lib/art";
import { cn } from "@/lib/utils/cn";
import { nowInBaku } from "../data";
import {
  busySlots,
  closedReason,
  dayUtilisation,
  daysBetween,
  freeWindows,
  isoWeekday,
  nextFreeSlot,
  openHoursOn,
  toMinutes,
} from "../schedule";
import type { Room, RoomAmenity, RoomKind } from "../types";
import "../rooms-list.css";

/*
 * The room card of the "Our classrooms" pages: the /rooms grid and the
 * "other rooms" rail on a room's own page.
 *
 * An async server component, like the course cards it is modelled on, so the
 * busy calendar is read on the server and the card ships no JavaScript. The
 * "today" strip therefore reads the clock: it must only be rendered in a
 * route that renders per request (both rooms pages do), or "today" would be
 * frozen at build time.
 *
 * The whole card is one link — the room name's, stretched over the card — so
 * it is a single tab stop and nothing interactive is nested inside it.
 */

// ---------------------------------------------------------------- shared look

/** One icon and one colour family per room kind (the kind rail, card chips). */
export const KIND_STYLE: Record<RoomKind, { icon: LucideIcon; k: string }> = {
  LECTURE: { icon: Presentation, k: "k-build" },
  COMPUTER_LAB: { icon: Monitor, k: "k-it" },
  ENGINEERING_LAB: { icon: CircuitBoard, k: "k-eng" },
  SEMINAR: { icon: MessagesSquare, k: "k-biz" },
  CONFERENCE: { icon: Landmark, k: "k-navy" },
  STUDIO: { icon: Clapperboard, k: "k-gold" },
};

export const AMENITY_ICON: Record<RoomAmenity, LucideIcon> = {
  PROJECTOR: Projector,
  SMART_BOARD: Tv,
  COMPUTERS: Monitor,
  AUDIO: Volume2,
  VIDEO_CONF: Video,
  AIR_CON: AirVent,
  ACCESSIBLE: Accessibility,
  WIFI: Wifi,
  LAB_BENCHES: FlaskConical,
  WHITEBOARD: PenLine,
};

/*
 * A card has room for four amenity icons. The ones that tell rooms apart
 * (computers, lab benches, video conferencing) come first; Wi-Fi and air
 * conditioning, which nearly every room has, come last.
 */
const AMENITY_ORDER: RoomAmenity[] = [
  "COMPUTERS", "LAB_BENCHES", "VIDEO_CONF", "SMART_BOARD", "PROJECTOR",
  "AUDIO", "ACCESSIBLE", "WHITEBOARD", "AIR_CON", "WIFI",
];
const CARD_AMENITIES = 4;

/*
 * Azerbaijani writes ordinals with a suffix that follows the vowel harmony of
 * the number's last spoken word: 1-ci, 3-cü, 6-cı, 9-cu, 10-cu, 40-cı…
 */
const AZ_UNITS = ["", "ci", "ci", "cü", "cü", "ci", "cı", "ci", "ci", "cu"];
const AZ_TENS = ["", "cu", "ci", "cu", "cı", "ci", "cı", "ci", "ci", "cı"];
function azOrdinalSuffix(n: number): string {
  const a = Math.abs(n);
  if (a % 10) return AZ_UNITS[a % 10];
  if (a % 100) return AZ_TENS[(a % 100) / 10];
  return a === 0 ? "cı" : "cü"; // sıfırıncı, yüzüncü (no building has a 200th floor)
}

/** "Əsas bina · 2-ci mərtəbə · otaq 214" / "Main building · Floor 2 · Room 214". */
function roomPlace(room: Room, t: TFunction): string {
  return [
    room.building,
    t("roomCard.floor", { n: room.floor, sfx: azOrdinalSuffix(room.floor) }),
    t("roomCard.roomNo", { n: room.roomNumber }),
  ].join(" · ");
}

// ---------------------------------------------------------------- cover art

/*
 * A room without a photo gets its floor plan as its cover, drawn in the same
 * engineering-drawing language as the course covers (grid paper, dimension
 * line, one gold accent) but showing something true about the room: its
 * furniture layout, door and windows, its area on the dimension line and its
 * building and number on the drawing's label. A course motif (a tram, a pie
 * chart) would say nothing about a lecture hall.
 *
 * Shapes paint only with the role classes of globals.css (f0, f300, s700…),
 * so the plan takes the room's hue and re-themes itself for dark mode.
 * viewBox 320×200 — the course covers' — so `.cover` sizes it the same way.
 */

const X0 = 40, X1 = 280, Y0 = 42, Y1 = 164; // the walls
const DOOR = [232, 256] as const; // the door opening in the bottom wall
const f1 = (n: number) => n.toFixed(1);

function gridLines(): string {
  let d = "";
  for (let x = 20; x < 320; x += 20) d += `M${x} 0V200`;
  for (let y = 20; y < 200; y += 20) d += `M0 ${y}H320`;
  return d;
}
const GRID = gridLines();

/** Tiered, curved desks facing a stage, in three blocks with two aisles. */
function theatrePlan(room: Room): ReactNode[] {
  const rows = room.capacity >= 150 ? 5 : 4;
  const cx = 160, cy = 30;
  const at = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const out: ReactNode[] = [
    <rect key="stage" x="124" y="44" width="72" height="11" rx="5.5" className="f300" />,
    <circle key="lectern" cx="160" cy="49.5" r="4" className="fg" />,
  ];
  const blocks: [number, number][] = [[30, 64], [72, 108], [116, 150]];
  for (let i = 0; i < rows; i++) {
    const r = 56 + i * 15;
    for (const [a1, a2] of blocks) {
      const [x1, y1] = at(r, a1), [x2, y2] = at(r, a2);
      out.push(
        <path key={`d${i}-${a1}`} d={`M${f1(x1)} ${f1(y1)}A${r} ${r} 0 0 1 ${f1(x2)} ${f1(y2)}`} className="s300 rnd fnone" strokeWidth="5" />,
      );
      // seats behind each desk, about 9 units apart along the arc
      const n = Math.max(2, Math.floor((((a2 - a1) * Math.PI) / 180) * (r + 6) / 9));
      for (let k = 0; k < n; k++) {
        const [x, y] = at(r + 6.5, a1 + ((k + 0.5) * (a2 - a1)) / n);
        out.push(<circle key={`s${i}-${a1}-${k}`} cx={f1(x)} cy={f1(y)} r="2.8" className="f500" />);
      }
    }
  }
  return out;
}

/** Rows of two-seat desks facing the board. */
function classroomPlan(): ReactNode[] {
  const out: ReactNode[] = [
    <path key="board" d="M112 50H208" className="s900 rnd" strokeWidth="4" />,
    <rect key="desk" x="144" y="58" width="32" height="9" rx="3" className="f500" />,
    <circle key="teacher" cx="160" cy="73" r="3.4" className="fg" />,
  ];
  for (const x of [58, 108, 182, 232])
    for (const y of [84, 102, 120, 138]) {
      if (x === 232 && y === 138) continue; // the way to the door
      out.push(<rect key={`d${x}-${y}`} x={x} y={y} width="30" height="8" rx="2.5" className="f300" />);
      out.push(<circle key={`a${x}-${y}`} cx={x + 8} cy={y + 13} r="3" className="f500" />);
      out.push(<circle key={`b${x}-${y}`} cx={x + 22} cy={y + 13} r="3" className="f500" />);
    }
  return out;
}

/** Tables in a U around the screen (seminar rooms). */
function uShapePlan(): ReactNode[] {
  const out: ReactNode[] = [
    <path key="screen" d="M124 50H196" className="s900 rnd" strokeWidth="4" />,
    <circle key="host" cx="160" cy="66" r="4" className="fg" />,
    <rect key="l" x="74" y="74" width="12" height="66" rx="3" className="f300" />,
    <rect key="r" x="234" y="74" width="12" height="66" rx="3" className="f300" />,
    <rect key="b" x="74" y="128" width="172" height="12" rx="3" className="f300" />,
  ];
  for (const y of [82, 96, 110, 124]) {
    out.push(<circle key={`l${y}`} cx="65" cy={y} r="3" className="f500" />);
    out.push(<circle key={`r${y}`} cx="255" cy={y} r="3" className="f500" />);
  }
  for (let x = 94; x <= 226; x += 18) out.push(<circle key={`b${x}`} cx={x} cy="149" r="3" className="f500" />);
  return out;
}

/** Long benches with workstations (computers) or instruments (bench labs). */
function labPlan(room: Room): ReactNode[] {
  const computers = room.amenities.includes("COMPUTERS");
  const out: ReactNode[] = [
    <path key="board" d="M150 50H250" className="s900 rnd" strokeWidth="4" />,
    <rect key="desk" x="58" y="52" width="56" height="10" rx="3" className="f500" />,
    <circle key="teacher" cx="86" cy="68" r="3.4" className="fg" />,
  ];
  // The benches stop short of the right wall, leaving the aisle to the door.
  for (const y of [80, 106, 132]) {
    out.push(<rect key={`bench${y}`} x="58" y={y} width="172" height="11" rx="3" className="f300" />);
    for (let k = 0; k < 6; k++) {
      const x = 66 + k * 29;
      out.push(
        computers ? (
          <rect key={`w${y}-${k}`} x={x} y={y + 2.5} width="13" height="6" rx="1.5" className="f700" />
        ) : (
          <circle key={`w${y}-${k}`} cx={x + 6.5} cy={y + 5.5} r="3" className="f0 s700" strokeWidth="1.6" />
        ),
      );
      out.push(<circle key={`c${y}-${k}`} cx={x + 6.5} cy={y + 18} r="3" className="f500" />);
    }
  }
  return out;
}

/** One long table with a screen on the end wall. */
function boardroomPlan(): ReactNode[] {
  const out: ReactNode[] = [
    <path key="screen" d="M52 78V122" className="s900 rnd" strokeWidth="4" />,
    <rect key="table" x="92" y="80" width="136" height="40" rx="20" className="f300" />,
    <circle key="end" cx="82" cy="100" r="3.2" className="f500" />,
    <circle key="head" cx="238" cy="100" r="4" className="fg" />,
  ];
  for (let i = 0; i < 7; i++) {
    const x = f1(108 + i * 17.3);
    out.push(<circle key={`t${i}`} cx={x} cy="71" r="3.2" className="f500" />);
    out.push(<circle key={`b${i}`} cx={x} cy="129" r="3.2" className="f500" />);
  }
  return out;
}

/** A recording set: backdrop, table, two softboxes and the camera's view. */
function studioPlan(): ReactNode[] {
  return [
    <rect key="cyc" x="70" y="52" width="180" height="8" rx="4" className="f300" />,
    <rect key="table" x="122" y="78" width="76" height="26" rx="13" className="f300" />,
    ...[140, 160, 180].map((x) => <circle key={`c${x}`} cx={x} cy="70" r="3.2" className="f500" />),
    ...[78, 242].map((x) => (
      <g key={`light${x}`}>
        <path d={`M${x} 82L${x < 160 ? x + 14 : x - 14} 96`} className="s700 rnd" strokeWidth="2" />
        <circle cx={x} cy="80" r="9" className="f0 s500" strokeWidth="2.5" />
      </g>
    )),
    <path key="view" d="M152 136L128 108M168 136L192 108" className="dimline" strokeDasharray="3 4" />,
    <rect key="cam" x="148" y="136" width="24" height="13" rx="3" className="f700" />,
    <circle key="rec" cx="180" cy="142" r="3.5" className="fg" />,
  ];
}

function furniture(room: Room): ReactNode[] {
  if (room.kind === "STUDIO") return studioPlan();
  switch (room.layout) {
    case "THEATRE":
      return theatrePlan(room);
    case "CLASSROOM":
      return classroomPlan();
    case "U_SHAPE":
      return uShapePlan();
    case "LAB":
      return labPlan(room);
    case "BOARDROOM":
      return boardroomPlan();
  }
}

/* where the big soft shape behind the plan sits, picked by the room's id */
const BLOBS = [
  { cx: 44, cy: 178, r: 58 },
  { cx: 290, cy: 28, r: 60 },
  { cx: 300, cy: 176, r: 64 },
];

/** The generated floor-plan cover (320×200, sliced to fill the box). */
function RoomPlanArt({ room }: { room: Room }) {
  const blob = BLOBS[hash(room.id) % BLOBS.length];
  const [d0, d1] = DOOR;
  return (
    <svg className="art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="320" height="200" className="f100" />
      <path className="grid" d={GRID} />
      <g className="pa">
        <circle cx={blob.cx} cy={blob.cy} r={blob.r} className="f300" />
      </g>
      <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} className="f0" />
      <g className="pb">{furniture(room)}</g>
      {/* walls with the door opening, the door leaf and its swing */}
      <path d={`M${d0} ${Y1}H${X0}V${Y0}H${X1}V${Y1}H${d1}`} className="s700 fnone" strokeWidth="5" strokeLinejoin="round" />
      <path d={`M72 ${Y0}H110M142 ${Y0}H178M210 ${Y0}H248`} className="s100" strokeWidth="2" />
      <path d={`M${d0} ${Y1}V${Y1 - 24}`} className="s700" strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M${d0} ${Y1 - 24}A24 24 0 0 1 ${d1} ${Y1}`} className="dimline" strokeDasharray="3 4" />
      {/* the drawing's label (a narrow card hides it to make room for the kind
          chip, see rooms-list.css) and the width dimension, carrying the area */}
      <text className="dim lbl" x={X1} y="31" textAnchor="end">
        {`${room.buildingCode} · ${room.roomNumber}`}
      </text>
      <path className="dimline" d={`M${X0} 186H${X1}M${X0} 181V191M${X1} 181V191`} />
      <text className="dim" x="160" y="180" textAnchor="middle">
        {`${room.areaM2} m²`}
      </text>
    </svg>
  );
}

/**
 * The card's cover: the room's photo when it has one (with the hue "tab" the
 * course photo covers carry), otherwise its floor plan. `children` are
 * overlays such as the kind chip.
 */
export function RoomCover({ room, className, children }: { room: Room; className?: string; children?: ReactNode }) {
  return (
    <div className={cn("cover", room.photo && "photo", className)}>
      {room.photo ? (
        <Image src={room.photo} alt="" fill unoptimized sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" />
      ) : (
        <RoomPlanArt room={room} />
      )}
      {children}
      {room.photo ? <span className="ktab" aria-hidden /> : null}
    </div>
  );
}

// ---------------------------------------------------------------- today

/** Baku's date and time, as nowInBaku (../data) reads them on the server. */
type BakuNow = { date: string; time: string };

type TodayInfo = {
  /** Opening hours today; null when the room is closed. */
  hours: [string, string] | null;
  closed: ReturnType<typeof closedReason>;
  util: number;
  /** Busy spans as [left, width] percentages of the opening hours. */
  spans: [number, number][];
  /** How much of the day is over, as a percentage; null before opening. */
  pastPct: number | null;
  /** Free minutes left today, counting only windows of an hour or more. */
  freeLeft: number;
  next: ReturnType<typeof nextFreeSlot>;
};

/** Today at a glance for one room, at Baku's `now` (today is now.date). */
function todayInfo(room: Room, now: BakuNow): TodayInfo {
  const today = now.date;
  const nowMin = toMinutes(now.time);
  const hours = openHoursOn(room, today);
  const slots = busySlots(room, today, today);

  let spans: [number, number][] = [];
  let pastPct: number | null = null;
  let freeLeft = 0;
  if (hours) {
    const open = toMinutes(hours[0]), close = toMinutes(hours[1]), span = close - open;
    const pct = (m: number) => (Math.min(close, Math.max(open, m)) - open) / span * 100;
    spans = slots
      .map((s) => [pct(toMinutes(s.start)), pct(toMinutes(s.end))] as const)
      .filter(([a, b]) => b > a)
      .map(([a, b]) => [a, b - a]);
    if (nowMin > open) pastPct = pct(nowMin);
    // What is still bookable: from the next quarter hour on, the free windows
    // of an hour or more — exactly what nextFreeSlot and the room's page look
    // for, so the card never says "free today" while the page's next free
    // hour is tomorrow. Two half hours around a class are not a bookable hour.
    const from = Math.ceil(nowMin / 15) * 15;
    for (const w of freeWindows(room, today, slots, 60)) {
      const len = toMinutes(w.end) - Math.max(toMinutes(w.start), from);
      if (len >= 60) freeLeft += len;
    }
  }
  return {
    hours,
    closed: closedReason(room, today),
    util: dayUtilisation(room, today, slots),
    spans,
    pastPct,
    freeLeft,
    next: freeLeft ? null : nextFreeSlot(room, today, now.time),
  };
}

/*
 * "bu gün, 18:30" · "sabah, 09:00" · "bazar ertəsi, 14:00" · "5 oktyabr, 09:00".
 * The weekday comes from rooms.wdText*, not the capitalised wdLong* names the
 * calendar uses as labels: Azerbaijani writes weekdays in lower case inside a
 * sentence ("Növbəti boş vaxt: bazar ertəsi, 10:30").
 */
function whenLabel(t: TFunction, today: string, at: { date: string; start: string }): string {
  const days = daysBetween(today, at.date);
  const time = at.start;
  if (days <= 0) return t("roomCard.whenToday", { time });
  if (days === 1) return t("roomCard.whenTomorrow", { time });
  if (days < 7) return t("roomCard.whenDay", { day: t(`rooms.wdText${isoWeekday(at.date)}`), time });
  return t("roomCard.whenDate", {
    d: Number(at.date.slice(8, 10)),
    month: t(`course2.month${Number(at.date.slice(5, 7))}`),
    time,
  });
}

/** Half-hour precision, with the locale's decimal mark: "5", "1,5" / "1.5". */
function hoursLabel(minutes: number, locale: Locale): { h: string; count: number } {
  const count = Math.floor(minutes / 30) / 2;
  return { h: String(count).replace(".", locale === "az" ? "," : "."), count };
}

function TodayStrip({ info, t, locale, today }: { info: TodayInfo; t: TFunction; locale: Locale; today: string }) {
  let tone: "ok" | "later" | "none";
  let message: string;
  if (info.freeLeft >= 60) {
    tone = "ok";
    message = t("roomCard.freeToday", hoursLabel(info.freeLeft, locale));
  } else if (info.next) {
    tone = "later";
    message = t("roomCard.nextFree", { when: whenLabel(t, today, info.next) });
  } else {
    tone = "none";
    message = t("roomCard.noFree");
  }
  // A room is shut exactly when it has a closedReason (openHoursOn).
  const aside = info.closed
    ? t(`rooms.closed_${info.closed}`)
    : t("roomCard.busyPct", { pct: Math.round(info.util * 100) });
  const nowPct = info.pastPct !== null && info.pastPct < 100 ? info.pastPct : null;

  return (
    <div className="rm-today">
      <div className="top">
        <p className={cn("state", tone)}>
          <i className="dot" aria-hidden />
          {message}
        </p>
        <span className="aside">{aside}</span>
      </div>
      <div className={cn("rm-day", !info.hours && "closed")} aria-hidden>
        <div className="track">
          {info.spans.map(([left, width], i) => (
            <i key={i} className="b" style={{ left: `${left}%`, width: `${width}%` }} />
          ))}
          {info.pastPct !== null ? <i className="past" style={{ width: `${info.pastPct}%` }} /> : null}
        </div>
        {nowPct !== null ? <i className="now" style={{ left: `${nowPct}%` }} /> : null}
      </div>
      {info.hours ? (
        <div className="scale" aria-hidden>
          <span>{info.hours[0]}</span>
          <span>{info.hours[1]}</span>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- the card

/**
 * One room: cover with its kind, name, where it is, seats and area, its most
 * telling amenities, and how today looks (a timeline of the opening hours
 * with the busy spans and "now", and how much is still free).
 *
 * `now` is Baku's clock as the page read it once (nowInBaku in ../data), so
 * every card on a page describes the same moment. A page that does not pass
 * it gets the clock read here.
 */
export async function RoomCard({
  room,
  locale,
  now,
}: {
  room: Room;
  locale: Locale;
  now?: BakuNow;
}) {
  const t = await getT(locale);
  const clock = now ?? nowInBaku();
  const info = todayInfo(room, clock);
  const { icon: KindIcon } = KIND_STYLE[room.kind];
  const amenities = AMENITY_ORDER.filter((a) => room.amenities.includes(a));
  const shown = amenities.slice(0, CARD_AMENITIES);

  return (
    <article className={cn("rm-card group", `k-${room.hue}`)}>
      <RoomCover room={room}>
        <div className="ov kind left-3 top-3">
          <span className="pill pill-glass">
            <KindIcon className="i" aria-hidden />
            <span className="min-w-0 truncate">{t(`rooms.kind_${room.kind}`)}</span>
          </span>
        </div>
      </RoomCover>
      <div className="body">
        <h3 className="title clamp-2">
          <LocaleLink className="stretched" href={`/rooms/${room.slug}`}>
            {room.name}
          </LocaleLink>
        </h3>
        <p className="place">
          <MapPin className="i" aria-hidden />
          <span>{roomPlace(room, t)}</span>
        </p>
        <div className="facts-row">
          <div className="meta">
            <span className="seats-m">
              <Users className="i" aria-hidden />
              {t("roomCard.seats", { count: room.capacity })}
            </span>
            <span>
              <Ruler className="i" aria-hidden />
              <span className="sr-only">{t("roomCard.areaLabel")}: </span>
              {t("roomCard.area", { n: room.areaM2 })}
            </span>
          </div>
          {/* The icons alone do not say "lab benches" or "smart board", so each
              tile names itself on hover too (title); rooms-list.css lifts the
              list above the card's stretched link for that. */}
          <ul className="amen" aria-label={t("roomCard.amenities")}>
            {shown.map((a) => {
              const Icon = AMENITY_ICON[a];
              const name = t(`rooms.amenity_${a}`);
              return (
                <li key={a} title={name}>
                  <Icon className="i" aria-hidden />
                  <span className="sr-only">{name}</span>
                </li>
              );
            })}
            {/* Two "+N" tiles: a narrow card shows one icon fewer (see
                rooms-list.css), and its count has to include that icon. */}
            {[CARD_AMENITIES, CARD_AMENITIES - 1].map((from) =>
              amenities.length > from ? (
                <li
                  key={from}
                  className={cn("more", from === CARD_AMENITIES ? "m-wide" : "m-narrow")}
                  title={amenities.slice(from).map((a) => t(`rooms.amenity_${a}`)).join(", ")}
                >
                  <span aria-hidden>+{amenities.length - from}</span>
                  <span className="sr-only">
                    {t("roomCard.moreAmenities", { count: amenities.length - from })}:{" "}
                    {amenities.slice(from).map((a) => t(`rooms.amenity_${a}`)).join(", ")}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
        <TodayStrip info={info} t={t} locale={locale} today={clock.date} />
      </div>
    </article>
  );
}

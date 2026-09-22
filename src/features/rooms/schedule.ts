import type { BusySlot, ClosedReason, DayStatus, FreeWindow, ReservationProblem, Room, RoomKind, SlotKind } from "./types";

/*
 * The busy calendar of the SAMPLE rooms, and the date/time helpers the room
 * pages share.
 *
 * There is no public bookings API, so the calendar is generated: a seeded PRNG
 * keyed by the room id and the date draws a believable day (the term's weekly
 * timetable, evening training groups, exams in January and June, one-off
 * events, maintenance, quiet summer weeks). The same room and date give the
 * same slots on every machine and on every request, so the server can render
 * it and the browser receives identical data — no hydration mismatch.
 *
 * Everything here is pure: no Date.now, no local clock, no Intl/locale data
 * (browsers lack `az` data). Dates are "YYYY-MM-DD" strings, times "HH:MM",
 * and weekdays come from Date.UTC arithmetic. "Today" is computed on the
 * server (todayISO in ./data.ts) and passed in.
 */

// ---------------------------------------------------------------- dates & times

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** True for a "YYYY-MM-DD" string that names a real calendar date. */
export function isISODate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** True for a 24-hour "HH:MM" string. */
export const isHHMM = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/* whole days since 1970-01-01 (a Thursday) */
function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}
function fromDayNumber(n: number): string {
  const t = new Date(n * DAY_MS);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export const addDays = (iso: string, n: number): string => fromDayNumber(dayNumber(iso) + n);

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export const daysBetween = (a: string, b: string): number => dayNumber(b) - dayNumber(a);

/** ISO weekday: 1 = Monday … 6 = Saturday, 7 = Sunday. */
export function isoWeekday(iso: string): number {
  return ((((dayNumber(iso) + 3) % 7) + 7) % 7) + 1;
}

/** The Monday of the week `iso` falls in. */
export const weekStart = (iso: string): string => addDays(iso, 1 - isoWeekday(iso));

/** Days in a month (month is 1–12). */
export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** "YYYY-MM-01" of the month `iso` falls in, and its last day. */
export const monthStart = (iso: string): string => `${iso.slice(0, 7)}-01`;
export const monthEnd = (iso: string): string =>
  `${iso.slice(0, 7)}-${pad(daysInMonth(Number(iso.slice(0, 4)), Number(iso.slice(5, 7))))}`;

/** The month `n` months after the one `iso` falls in, as "YYYY-MM-01". */
export function addMonths(iso: string, n: number): string {
  const idx = Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1 + n;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}-01`;
}

/**
 * A month as calendar rows, Monday first: each row has 7 cells holding the
 * ISO date, or null for the padding days of the neighbouring months.
 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = `${year}-${pad(month)}-01`;
  const lead = isoWeekday(first) - 1;
  const total = daysInMonth(year, month);
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export const toMinutes = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
export const fromMinutes = (min: number): string => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

// ---------------------------------------------------------------- open days

/*
 * Fixed-date public holidays of Azerbaijan (Novruz is 20–24 March). The
 * moving ones — Ramazan and Qurban bayramı — and weekend carry-overs are left
 * out on purpose: this is sample data, and a wrong guess would be worse than
 * a missing day.
 */
const HOLIDAYS = new Set([
  "01-01", "01-02", "03-08", "03-20", "03-21", "03-22", "03-23", "03-24",
  "05-09", "05-28", "06-15", "06-26", "11-08", "11-09", "12-31",
]);

/** Why the room takes no bookings that day, or null when it is open. */
export function closedReason(room: Room, dateISO: string): ClosedReason | null {
  const wd = isoWeekday(dateISO);
  if (wd === 7) return "SUNDAY";
  if (HOLIDAYS.has(dateISO.slice(5))) return "HOLIDAY";
  if (wd === 6 && !room.openHours.saturday) return "SATURDAY";
  return null;
}

/** The room's opening hours on a date, or null when it is closed. */
export function openHoursOn(room: Room, dateISO: string): [string, string] | null {
  if (!isISODate(dateISO) || closedReason(room, dateISO)) return null;
  return isoWeekday(dateISO) === 6 ? room.openHours.saturday : room.openHours.weekday;
}

/*
 * The academic year the generator follows: autumn term from 15 September,
 * winter exam session from late December through January, a short break,
 * spring term from mid-February, summer session in June, then the summer
 * break (only maintenance, summer schools and the evening training groups).
 */
type Season = "TERM" | "EXAMS" | "BREAK";
function season(dateISO: string): Season {
  const md = dateISO.slice(5);
  if (md >= "09-15" && md <= "12-24") return "TERM";
  if (md >= "12-25" || md <= "01-31") return "EXAMS";
  if (md >= "02-15" && md <= "05-31") return "TERM";
  if (md >= "06-01" && md <= "06-30") return "EXAMS";
  return "BREAK";
}

// ---------------------------------------------------------------- seeded randomness

/* FNV-1a, the same hash src/lib/art.ts uses — repeated here so the client
   bundle of a calendar does not pull in the whole art module. */
function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/* mulberry32: tiny, fast, and identical in every JS engine */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
function shuffled<T>(r: () => number, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------- how busy each kind of room is

type Profile = {
  block: number;      // share of weekday teaching blocks in the term timetable
  evening: number;    // share of weekdays with an evening training group (18:00)
  full: number;       // chance a weekday is booked end to end
  free: number;       // chance a term weekday has nothing on at all
  exam: number;       // chance a term class is a midterm exam instead
  examSeason: number; // chance of each exam sitting in the January / June sessions
  event: number;      // chance of a one-off event on a weekday
  booking: number;    // chance of a one-off booking (meeting, recording, consultation)
  saturday: number;   // chance of each Saturday group
  maintenance: number;
};

/* Lecture halls follow the timetable closely, the conference hall lives on
   events, labs sit in between, the studio is mostly booked ad hoc. */
const PROFILE: Record<RoomKind, Profile> = {
  LECTURE:         { block: .74, evening: .30, full: .15, free: .04, exam: .05, examSeason: .70, event: .10, booking: .10, saturday: .35, maintenance: .02 },
  COMPUTER_LAB:    { block: .58, evening: .50, full: .10, free: .07, exam: .06, examSeason: .55, event: .06, booking: .12, saturday: .45, maintenance: .04 },
  ENGINEERING_LAB: { block: .50, evening: .10, full: .07, free: .12, exam: .03, examSeason: .30, event: .06, booking: .15, saturday: .25, maintenance: .05 },
  SEMINAR:         { block: .45, evening: .35, full: .08, free: .12, exam: .03, examSeason: .30, event: .15, booking: .22, saturday: .35, maintenance: .02 },
  CONFERENCE:      { block: .08, evening: 0,   full: .09, free: .30, exam: 0,   examSeason: .20, event: .55, booking: .15, saturday: .25, maintenance: .04 },
  STUDIO:          { block: .30, evening: .25, full: .06, free: .15, exam: 0,   examSeason: .05, event: .08, booking: .40, saturday: .30, maintenance: .04 },
};

type Span = readonly [string, string];
const BLOCKS: Span[] = [["09:00", "10:30"], ["11:00", "12:30"], ["14:00", "15:30"], ["16:00", "17:30"]];
const STUDIO_BLOCKS: Span[] = [["10:00", "12:00"], ["12:30", "14:30"], ["15:00", "17:00"]];
const SATURDAY_BLOCKS: Span[] = [["10:00", "12:00"], ["12:30", "14:30"], ["15:00", "17:00"]];
const EXAM_SITTINGS: Span[] = [["10:00", "13:00"], ["14:00", "17:00"]];
const EVENING: Span = ["18:00", "20:00"];
const ONE_OFF: Span[] = [["12:40", "13:50"], ["11:00", "12:30"], ["14:00", "15:30"], ["16:00", "17:30"], ["09:00", "10:30"], ["15:00", "17:00"], ["10:00", "12:00"]];
const LONG_EVENTS: Span[] = [["10:00", "12:00"], ["10:00", "13:00"], ["11:00", "13:30"], ["14:00", "16:00"], ["14:00", "17:00"], ["15:00", "18:00"]];
const MAINTENANCE_SLOTS: Span[] = [["14:00", "17:30"], ["16:00", "18:00"], ["12:40", "13:50"], ["09:00", "12:30"]];
const BREAK_MAINTENANCE: Span[] = [["09:00", "17:00"], ["09:00", "13:00"], ["14:00", "18:00"]];

// ---------------------------------------------------------------- titles (content, Azerbaijani in both locales)

/* Degree-programme subjects, by room kind and — for labs — by the lab's field. */
const SUBJECTS: Record<RoomKind, string[]> = {
  LECTURE: ["Ali riyaziyyat", "Fizika", "Nəzəri mexanika", "Elektrotexnikanın nəzəri əsasları", "Mühəndis qrafikası",
    "Materiallar müqaviməti", "İqtisadiyyat nəzəriyyəsi", "Azərbaycan tarixi", "Ehtimal nəzəriyyəsi və riyazi statistika"],
  COMPUTER_LAB: ["Proqramlaşdırmanın əsasları", "Alqoritmlər və verilənlər strukturları", "Kompüter şəbəkələri",
    "Verilənlər bazaları", "Əməliyyat sistemləri", "Veb texnologiyaları"],
  ENGINEERING_LAB: ["Mexatronika", "Robototexnika sistemləri", "Avtomatik idarəetmə nəzəriyyəsi", "Mikroprosessor sistemləri",
    "Sənaye avtomatlaşdırılması (PLC)"],
  SEMINAR: ["Seminar", "Seminar: menecment", "Seminar: mühəndis etikası", "Seminar: akademik yazı", "Seminar: layihə idarəetməsi"],
  CONFERENCE: ["Azərbaycan tarixi", "Mühəndisliyə giriş", "Fəlsəfə"],
  STUDIO: ["Rəqəmsal media", "Video montaj", "Qrafik dizayn", "Multimedia texnologiyaları"],
};
/* keyed "KIND:hue" — the lab's field decides what is taught in it */
const LAB_SUBJECTS: Record<string, string[]> = {
  "COMPUTER_LAB:data": ["Maşın öyrənməsi", "Məlumatların vizuallaşdırılması", "Süni intellekt sistemləri", "Kompüter görməsi", "Böyük verilənlərin emalı"],
  "COMPUTER_LAB:eng": ["Mühəndis qrafikası", "Kompüter qrafikası", "3D modelləşdirmə (SolidWorks)", "Maşın hissələrinin layihələndirilməsi"],
  "ENGINEERING_LAB:energy": ["Elektrik dövrələri", "Elektrik maşınları", "Elektronika", "Ölçmə texnikası", "Rele mühafizəsi və avtomatika"],
};

/* Evening and Saturday groups of the training centre: the sample courses of
   src/features/showcase/data.ts, matched to the room's field. */
const TRAININGS: Record<Room["hue"], string[]> = {
  it: ["Praktiki məşğələ: Veb proqramlaşdırmanın əsasları", "Praktiki məşğələ: Kibertəhlükəsizliyin əsasları", "Praktiki məşğələ: SQL və verilənlər bazalarının əsasları"],
  data: ["Praktiki məşğələ: Python ilə məlumat analizi", "Praktiki məşğələ: Maşın öyrənməsi", "Süni intellektə giriş"],
  eng: ["AutoCAD ilə mühəndis çertyojları", "Materiallar müqaviməti"],
  build: ["AutoCAD ilə mühəndis çertyojları", "BIM və Revit ilə memarlıq modelləşdirməsi"],
  energy: ["Günəş enerjisi sistemlərinin layihələndirilməsi", "Binalarda enerji səmərəliliyi"],
  biz: ["Layihə idarəetməsinin əsasları", "Maliyyə savadlılığı və büdcələmə"],
  res: ["Elmi məqalə yazmaq: strukturdan nəşrə", "Tədqiqat metodologiyası və statistika"],
  trans: ["Şəhər nəqliyyatının planlaşdırılması", "Təchizat zəncirinin idarə edilməsi"],
  navy: ["Layihə idarəetməsinin əsasları", "Süni intellektə giriş"],
  gold: ["Onlayn kurs çəkilişi: Süni intellektə giriş", "Onlayn kurs çəkilişi: Kibertəhlükəsizliyin əsasları"],
};

const EVENTS: Record<RoomKind, string[]> = {
  LECTURE: ["Açıq mühazirə", "Ustad dərsi", "Tədbir", "Tələbə elmi konfransı"],
  COMPUTER_LAB: ["Proqramlaşdırma olimpiadası", "Ustad dərsi", "Tələbə hakatonu", "Tədbir"],
  ENGINEERING_LAB: ["Laboratoriya nümayişi", "Məktəblilər üçün açıq dərs", "Ustad dərsi", "Tədbir"],
  SEMINAR: ["Elmi seminar", "Dəyirmi masa", "Ustad dərsi", "Tədbir"],
  CONFERENCE: ["Elmi-praktiki konfrans", "Açıq mühazirə", "Elmi Şuranın iclası", "Karyera günü", "Dissertasiya müdafiəsi",
    "Tələbə elmi konfransı", "Məzunlarla görüş", "Tədbir"],
  STUDIO: ["Ustad dərsi: mobil video", "Tədbir"],
};
const FULL_DAY_EVENTS = ["Beynəlxalq elmi-praktiki konfrans", "Tələbə hakatonu", "Karyera sərgisi"];
/* the big hall hosts no training groups; its evenings are events */
const CONFERENCE_EVENING = ["Açıq mühazirə", "Tələbə klublarının tədbiri", "Film nümayişi və müzakirə"];

/* A boardroom-style conference room hosts councils and defences, not fairs. */
const BOARDROOM_SUBJECTS = ["Doktorantura seminarı", "Magistr seminarı"];
const BOARDROOM_EVENTS = ["Elmi Şuranın iclası", "Dissertasiya müdafiəsi", "Beynəlxalq videokonfrans", "Dəyirmi masa",
  "Tərəfdaşlarla görüş", "Tədbir"];
const BOARDROOM_FULL_DAY = ["Dissertasiya şurasının iclası", "Beynəlxalq layihə seminarı"];

const BOOKINGS: Record<RoomKind, string[]> = {
  LECTURE: ["Kafedra iclası", "Məsləhət saatı", "Tələbə elmi cəmiyyəti"],
  COMPUTER_LAB: ["Məsləhət saatı", "Diplom işi üzərində iş", "Layihə görüşü"],
  ENGINEERING_LAB: ["Tədqiqat qrupu", "Diplom işi üzərində iş", "Əlavə laboratoriya işi"],
  SEMINAR: ["Kafedra iclası", "Layihə görüşü", "Məsləhət saatı", "Tələbə elmi cəmiyyəti"],
  CONFERENCE: ["Rektoratda görüş", "Tədbirə hazırlıq", "Kafedra iclası"],
  STUDIO: ["Onlayn kurs çəkilişi: Süni intellektə giriş", "Onlayn kurs çəkilişi: Kibertəhlükəsizliyin əsasları", "Podkast yazısı", "Müsahibə çəkilişi"],
};

const MAINTENANCE: Record<RoomKind, string[]> = {
  LECTURE: ["Texniki xidmət"],
  COMPUTER_LAB: ["Texniki xidmət", "Proqram təminatının yenilənməsi"],
  ENGINEERING_LAB: ["Texniki xidmət", "Avadanlığın profilaktikası"],
  SEMINAR: ["Texniki xidmət"],
  CONFERENCE: ["Texniki xidmət", "Səs sisteminin yoxlanışı"],
  STUDIO: ["Texniki xidmət", "Avadanlığın kalibrlənməsi"],
};

/* the robotics lab's own weekend groups (the sample catalogue has no course for it) */
const LAB_TRAININGS: Record<string, string[]> = {
  "ENGINEERING_LAB:eng": ["Robototexnika dərnəyi", "Arduino ilə prototipləşdirmə"],
  "ENGINEERING_LAB:energy": ["Günəş enerjisi sistemlərinin layihələndirilməsi"],
};

const boardroom = (room: Room) => room.kind === "CONFERENCE" && room.layout === "BOARDROOM";
const subjectsOf = (room: Room) =>
  boardroom(room) ? BOARDROOM_SUBJECTS : LAB_SUBJECTS[`${room.kind}:${room.hue}`] ?? SUBJECTS[room.kind];
const eventsOf = (room: Room) => (boardroom(room) ? BOARDROOM_EVENTS : EVENTS[room.kind]);
const trainingsOf = (room: Room) => LAB_TRAININGS[`${room.kind}:${room.hue}`] ?? TRAININGS[room.hue];

// ---------------------------------------------------------------- the generator

type Draft = { a: number; b: number; title: string; kind: SlotKind };

/* Monday-aligned week counter: the timetable alternates between odd and even
   ("üst" / "alt") weeks, as AzTU's does. */
const weekParity = (dateISO: string) => Math.floor((dayNumber(dateISO) + 3) / 7) % 2;
/* a new timetable each term */
const termKey = (dateISO: string) => `${dateISO.slice(0, 4)}-${Number(dateISO.slice(5, 7)) >= 8 ? "autumn" : "spring"}`;

/** One day of one room's calendar, sorted by start time. */
function daySlots(room: Room, dateISO: string): BusySlot[] {
  const hours = openHoursOn(room, dateISO);
  if (!hours) return [];
  const open = toMinutes(hours[0]);
  const close = toMinutes(hours[1]);
  const p = PROFILE[room.kind];
  const wd = isoWeekday(dateISO);
  const s = season(dateISO);
  // Day-level randomness (one-offs, full and quiet days) is keyed by the date;
  // the weekly timetable by term, weekday and week parity, so "Monday 09:00"
  // is the same class every other week, like a real timetable.
  const r = mulberry32(fnv1a(`${room.id}|${dateISO}`));
  const tt = mulberry32(fnv1a(`${room.id}|${termKey(dateISO)}|${wd}|${weekParity(dateISO)}`));
  const subjects = subjectsOf(room);
  const trainings = trainingsOf(room);
  const out: Draft[] = [];

  const add = ([from, to]: Span, title: string, kind: SlotKind): boolean => {
    const a = toMinutes(from), b = toMinutes(to);
    if (a < open || b > close || b - a < 30 || out.some((o) => a < o.b && o.a < b)) return false;
    out.push({ a, b, title, kind });
    return true;
  };
  const addOneOf = (spans: Span[], title: string, kind: SlotKind) => {
    for (const span of shuffled(r, spans)) if (add(span, title, kind)) return;
  };
  // A fully booked day: every remaining gap of an hour or more is taken, with
  // ten minutes' changeover next to other slots, so no bookable hour is left.
  // Evening gaps go to what evenings are used for (groups, or events in the
  // hall) rather than to a daytime meeting.
  const fillGaps = () => {
    const taken = out.map((o) => [o.a, o.b] as const).sort((x, y) => x[0] - y[0]);
    let cursor = open;
    const gaps: [number, number][] = [];
    for (const [a, b] of taken) { if (a - cursor >= 60) gaps.push([cursor, a]); cursor = Math.max(cursor, b); }
    if (close - cursor >= 60) gaps.push([cursor, close]);
    const six = 18 * 60;
    // a long gap across 18:00 becomes a late-afternoon booking and an evening slot
    const split = gaps.flatMap(([a, b]): [number, number][] =>
      a < six && six - a >= 60 && b - six >= 60 ? [[a, six], [six, b]] : [[a, b]]);
    for (const [a, b] of split) {
      const span: Span = [fromMinutes(a === open ? a : a + 10), fromMinutes(b === close ? b : b - 10)];
      if (a < 17 * 60 + 30) add(span, pick(r, BOOKINGS[room.kind]), "BOOKING");
      else if (room.kind === "CONFERENCE") add(span, pick(r, CONFERENCE_EVENING), "EVENT");
      else add(span, pick(r, trainings), "CLASS");
    }
  };
  const oneOffs = (scale: number) => {
    if (r() < p.event * scale) addOneOf(room.kind === "CONFERENCE" ? LONG_EVENTS : ONE_OFF, pick(r, eventsOf(room)), "EVENT");
    if (room.kind === "CONFERENCE" && r() < p.event * scale * 0.4) addOneOf(LONG_EVENTS, pick(r, eventsOf(room)), "EVENT");
    if (r() < p.booking * scale) addOneOf(ONE_OFF, pick(r, BOOKINGS[room.kind]), "BOOKING");
  };
  const blocks = room.kind === "STUDIO" ? STUDIO_BLOCKS : BLOCKS;

  if (room.kind === "CONFERENCE" && !boardroom(room) && dateISO.slice(5) === "09-15") {
    add(["10:00", "13:00"], "Bilik günü: tədris ilinin açılışı", "EVENT");
  }

  // ---- Saturday: part-time groups and the training centre's weekend groups
  if (wd === 6) {
    const quiet = s === "BREAK" ? 0.6 : 0.3;
    if (r() < quiet) return finish(out, dateISO);
    const packed = r() < 0.04;
    if (room.kind === "CONFERENCE") {
      // the hall's Saturdays are events (olympiads, school visits, conferences), not classes
      if (packed && !boardroom(room)) add(["10:00", hours[1]], "Tələbə hakatonu", "EVENT");
      else if (r() < 0.6) addOneOf(LONG_EVENTS, pick(r, eventsOf(room)), "EVENT");
    } else {
      for (const span of SATURDAY_BLOCKS) {
        const title = r() < 0.5 ? pick(r, trainings) : pick(r, subjects);
        if (s === "EXAMS" && r() < p.examSeason * 0.4) add(span, `İmtahan: ${pick(r, subjects)}`, "EXAM");
        else if (r() < p.saturday * (s === "BREAK" ? 0.4 : 1)) add(span, title, "CLASS");
      }
    }
    oneOffs(0.5);
    if (packed) fillGaps();
    return finish(out, dateISO);
  }

  // ---- summer and winter break: maintenance, summer schools, evening groups
  if (s === "BREAK") {
    const school = dateISO.slice(5, 7) === "02" ? "Qış məktəbi" : "Yay məktəbi";
    // "Yay məktəbi: Python ilə məlumat analizi", not "…: Praktiki məşğələ: …"
    const plain = (title: string) => title.replace(/^(Praktiki məşğələ|Onlayn kurs çəkilişi): /, "");
    for (const span of blocks) if (r() < p.block * 0.2) add(span, `${school}: ${plain(pick(r, trainings))}`, "CLASS");
    if (r() < 0.12) addOneOf(BREAK_MAINTENANCE, pick(r, MAINTENANCE[room.kind]), "MAINTENANCE");
    if (tt() < p.evening * 0.7) add(EVENING, pick(tt, trainings), "CLASS");
    oneOffs(0.5);
    return finish(out, dateISO);
  }

  // ---- term and exam-session weekdays
  const roll = r();
  const free = p.free * (s === "EXAMS" ? 1.5 : 1);
  if (roll < free) return finish(out, dateISO);
  const full = roll < free + p.full;

  if (full && room.kind === "CONFERENCE") {
    add(["09:30", "18:00"], pick(r, boardroom(room) ? BOARDROOM_FULL_DAY : FULL_DAY_EVENTS), "EVENT");
  } else if (s === "EXAMS") {
    for (const span of EXAM_SITTINGS) if (full || r() < p.examSeason) add(span, `İmtahan: ${pick(r, subjects)}`, "EXAM");
  } else {
    const load = 0.5 + tt() * 0.8; // some weekdays are heavier in this room's timetable
    for (const span of blocks) {
      const inTimetable = tt() < p.block * load;
      const subject = pick(tt, subjects);
      const exam = r() < p.exam;
      const cancelled = r() < 0.05;
      if (full || (inTimetable && !cancelled)) add(span, exam ? `İmtahan: ${subject}` : subject, exam ? "EXAM" : "CLASS");
    }
  }
  // the training centre's evening groups meet on fixed weekdays
  const evening = tt() < p.evening;
  const course = pick(tt, trainings);
  if ((full && room.kind !== "CONFERENCE") || evening) add(EVENING, course, "CLASS");
  if (room.kind === "CONFERENCE" && r() < 0.12) add(["18:30", "20:30"], pick(r, CONFERENCE_EVENING), "EVENT");
  if (r() < p.maintenance) addOneOf(MAINTENANCE_SLOTS, pick(r, MAINTENANCE[room.kind]), "MAINTENANCE");
  oneOffs(1);
  if (full) fillGaps();
  return finish(out, dateISO);
}

function finish(out: Draft[], date: string): BusySlot[] {
  return out
    .sort((x, y) => x.a - y.a)
    .map((o) => ({ date, start: fromMinutes(o.a), end: fromMinutes(o.b), title: o.title, kind: o.kind }));
}

/* a year and a bit — a guard against a runaway range from a bad query string */
const MAX_RANGE_DAYS = 400;

/**
 * The room's busy slots from `fromISO` to `toISO`, both inclusive, sorted by
 * date and start. Deterministic: same room and dates, same slots, anywhere.
 * Invalid or reversed dates give [].
 */
export function busySlots(room: Room, fromISO: string, toISO: string): BusySlot[] {
  if (!isISODate(fromISO) || !isISODate(toISO)) return [];
  const n = Math.min(daysBetween(fromISO, toISO), MAX_RANGE_DAYS);
  const out: BusySlot[] = [];
  for (let i = 0; i <= n; i++) out.push(...daySlots(room, addDays(fromISO, i)));
  return out;
}

// ---------------------------------------------------------------- questions the pages ask
// Each takes an optional `slots` list (e.g. the ISO data a server component
// passed to a client calendar) and falls back to generating the day, so the
// browser never has to regenerate what the server already sent.

/* the day's busy intervals in minutes, clipped to opening hours and merged */
function busyIntervals(room: Room, dateISO: string, slots?: BusySlot[]): [number, number][] {
  const hours = openHoursOn(room, dateISO);
  if (!hours) return [];
  const open = toMinutes(hours[0]), close = toMinutes(hours[1]);
  const day = (slots ?? daySlots(room, dateISO)).filter((x) => x.date === dateISO);
  const spans = day
    .map((x) => [Math.max(open, toMinutes(x.start)), Math.min(close, toMinutes(x.end))] as [number, number])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const [a, b] of spans) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  return merged;
}

/** Free windows of at least `minMinutes` within the day's opening hours ([] when closed). */
export function freeWindows(room: Room, dateISO: string, slots?: BusySlot[], minMinutes = 30): FreeWindow[] {
  const hours = openHoursOn(room, dateISO);
  if (!hours) return [];
  const close = toMinutes(hours[1]);
  let cursor = toMinutes(hours[0]);
  const out: FreeWindow[] = [];
  for (const [a, b] of busyIntervals(room, dateISO, slots)) {
    if (a - cursor >= minMinutes) out.push({ start: fromMinutes(cursor), end: fromMinutes(a) });
    cursor = Math.max(cursor, b);
  }
  if (close - cursor >= minMinutes) out.push({ start: fromMinutes(cursor), end: fromMinutes(close) });
  return out;
}

/** Share (0–1) of the day's opening hours that is taken; 0 when the room is closed. */
export function dayUtilisation(room: Room, dateISO: string, slots?: BusySlot[]): number {
  const hours = openHoursOn(room, dateISO);
  if (!hours) return 0;
  const span = toMinutes(hours[1]) - toMinutes(hours[0]);
  const busy = busyIntervals(room, dateISO, slots).reduce((sum, [a, b]) => sum + (b - a), 0);
  return span > 0 ? Math.min(1, busy / span) : 0;
}

/**
 * A day at a glance: CLOSED (Sunday, holiday, shut Saturday), FREE (nothing
 * booked), FULL (no free hour left), BUSY (half the hours or more taken),
 * otherwise PARTIAL.
 */
export function dayStatus(room: Room, dateISO: string, slots?: BusySlot[]): DayStatus {
  if (!openHoursOn(room, dateISO)) return "CLOSED";
  const busy = busyIntervals(room, dateISO, slots);
  if (!busy.length) return "FREE";
  if (!freeWindows(room, dateISO, slots, 60).length) return "FULL";
  return dayUtilisation(room, dateISO, slots) >= 0.5 ? "BUSY" : "PARTIAL";
}

/** How far ahead nextFreeSlot looks, in days (today included). */
export const NEXT_FREE_DAYS = 14;

/**
 * The first free window of at least an hour from `fromISO` at `nowHHMM`
 * (Baku time, from the server), within 14 days. On the first day the window
 * starts no earlier than now, rounded up to the next quarter hour. `end` is
 * where that free window ends, so the page can say "14:00–16:00".
 */
export function nextFreeSlot(room: Room, fromISO: string, nowHHMM: string): { date: string; start: string; end: string } | null {
  if (!isISODate(fromISO)) return null;
  const now = isHHMM(nowHHMM) ? Math.ceil(toMinutes(nowHHMM) / 15) * 15 : 0;
  for (let i = 0; i < NEXT_FREE_DAYS; i++) {
    const date = addDays(fromISO, i);
    for (const w of freeWindows(room, date, undefined, 60)) {
      const start = i === 0 ? Math.max(toMinutes(w.start), now) : toMinutes(w.start);
      const end = toMinutes(w.end);
      if (end - start >= 60) return { date, start: fromMinutes(start), end: w.end };
    }
  }
  return null;
}

/** The first busy slot overlapping [start, end) on the date, or null. Touching ends do not overlap. */
export function findConflict(slots: BusySlot[], dateISO: string, start: string, end: string): BusySlot | null {
  const a = toMinutes(start), b = toMinutes(end);
  return slots.find((x) => x.date === dateISO && a < toMinutes(x.end) && toMinutes(x.start) < b) ?? null;
}

/** How far ahead the sample calendar shows and accepts requests, in days. */
export const SCHEDULE_DAYS = 56;

/**
 * The span of dates a room page should generate and show: whole months,
 * from the month eight weeks before today to the month eight weeks after.
 */
export function scheduleRange(todayISO: string): { from: string; to: string } {
  return { from: monthStart(addDays(todayISO, -SCHEDULE_DAYS)), to: monthEnd(addDays(todayISO, SCHEDULE_DAYS)) };
}

export type ReservationRequest = { date: string; start: string; end: string; attendees: number };

/**
 * Checks a reservation request against the room: the first problem found, or
 * null when it could be booked. `slots` must cover the requested date (the
 * page's scheduleRange does); `now` is Baku time from the server.
 *
 * There is deliberately no minimum notice: the portal's real booking service
 * has none either (a request waits for the university's approval), and the
 * rules printed on the room pages (BASE_RULES in ./data.ts) say only that.
 */
export function reservationProblem(
  room: Room,
  slots: BusySlot[],
  req: ReservationRequest,
  now: { date: string; time: string },
): ReservationProblem | null {
  const { date, start, end, attendees } = req;
  if (!isISODate(date) || !isHHMM(start) || !isHHMM(end) || !Number.isInteger(attendees) || attendees < 1) return "INVALID";
  if (date < now.date || (date === now.date && start < now.time)) return "PAST";
  // bookable exactly as far as the calendar shows busy data (scheduleRange)
  if (date > scheduleRange(now.date).to) return "TOO_FAR";
  const hours = openHoursOn(room, date);
  if (!hours) return "CLOSED";
  const length = toMinutes(end) - toMinutes(start);
  if (length < 30) return "TOO_SHORT";
  if (length > 8 * 60) return "TOO_LONG";
  if (start < hours[0] || end > hours[1]) return "OUTSIDE_HOURS";
  if (findConflict(slots, date, start, end)) return "CONFLICT";
  if (attendees > room.capacity) return "CAPACITY";
  return null;
}

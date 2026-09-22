"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useT } from "@/i18n/client";
import type { TFunction } from "@/i18n/format";
import type { BusySlot, ClosedReason, DayStatus, FreeWindow, ReservationProblem, Room } from "../types";
import * as S from "../schedule";
import { addDays, fromMinutes, isoWeekday, monthStart, toMinutes, type ReservationRequest } from "../schedule";
import { ReserveDialog } from "./ReserveDialog";
import "../rooms-detail.css";

/*
 * The room page's shared booking state: which day the calendar shows, the
 * one reserve dialog every "Reserve" button opens, and the sample requests
 * the visitor made during this visit.
 *
 * The rooms are SAMPLE content (see ../source.server.ts): a completed request
 * is never sent anywhere. It lives in this component's state only, so the
 * calendar can show it as "your request (sample)" until the page is reloaded,
 * and the dialog's confirmation says plainly that nothing was reserved.
 *
 * Everything time-related comes from the server as strings (`now` is Baku
 * time, `slots` the generated busy calendar), so the first render is the same
 * in Node and in the browser.
 */

/** The fields of a room the booking UI needs; its texts stay in the server HTML. */
export type BookingRoom = Pick<
  Room,
  "id" | "slug" | "name" | "kind" | "buildingCode" | "capacity" | "openHours" | "hue" | "layout"
>;

/* The schedule helpers are typed for a whole Room, but once they are given
   the day's slots they read only its opening hours (and capacity). `slots`
   is required here, so the browser never regenerates a day the server sent. */
const whole = (r: BookingRoom) => r as Room;
export const openHoursOn = (r: BookingRoom, date: string): [string, string] | null => S.openHoursOn(whole(r), date);
export const closedReason = (r: BookingRoom, date: string): ClosedReason | null => S.closedReason(whole(r), date);
export const dayStatus = (r: BookingRoom, date: string, slots: BusySlot[]): DayStatus => S.dayStatus(whole(r), date, slots);
export const dayUtilisation = (r: BookingRoom, date: string, slots: BusySlot[]): number =>
  S.dayUtilisation(whole(r), date, slots);
export const freeWindows = (r: BookingRoom, date: string, slots: BusySlot[], min: number): FreeWindow[] =>
  S.freeWindows(whole(r), date, slots, min);
export const reservationProblem = (r: BookingRoom, slots: BusySlot[], req: ReservationRequest, now: Now): ReservationProblem | null =>
  S.reservationProblem(whole(r), slots, req, now);

export type Purpose = "TRAINING" | "SEMINAR" | "EXAM" | "EVENT" | "OTHER";
export const PURPOSES: Purpose[] = ["TRAINING", "SEMINAR", "EXAM", "EVENT", "OTHER"];

/** A request the visitor completed in the dialog (kept in memory only). */
export type SampleRequest = {
  id: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  purpose: Purpose;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

export type Prefill = { date?: string; start?: string; end?: string };

export type Now = { date: string; time: string };
type Range = { from: string; to: string };

/** The first time a request can be made for: prefilled times, and where that free window ends. */
export type NextBookable = { date: string; start: string; end: string; until: string };

/* ---------------------------------------------------------------- the rules the page prints
   Every sample room's first rule (BASE_RULES in ../data.ts) reads: requests
   at least 2 working days ahead, events and conferences at least 10. The
   dialog, the free gaps and the "earliest" times all follow it, so the page
   never offers a time its own rules forbid. */

export const LEAD_WORKDAYS = 2;
export const EVENT_LEAD_WORKDAYS = 10;
export const leadWorkdays = (purpose?: Purpose) => (purpose === "EVENT" ? EVENT_LEAD_WORKDAYS : LEAD_WORKDAYS);

/** The first date a request can be for: `workdays` working days (Monday–Friday, not a holiday) after today. */
export function earliestDate(room: BookingRoom, today: string, workdays = LEAD_WORKDAYS): string {
  let d = today;
  for (let left = workdays; left > 0; ) {
    d = addDays(d, 1);
    if (isoWeekday(d) <= 5 && !closedReason(room, d)) left -= 1;
  }
  return d;
}

/*
 * One definition of "free" for the whole page: a window of an hour or more,
 * the same as the day status (FULL = no free hour left) and the room cards.
 * Shorter gaps are shown on the timeline but not offered; the dialog still
 * accepts a 30-minute request typed in by hand (the data layer's minimum).
 */
export const MIN_OFFER_MINUTES = 60;

/** Prefilled requests default to at most this long; the visitor can extend them. */
const PREFILL_MINUTES = 120;

/**
 * A free window turned into select-able times: 30-minute steps (the dialog's
 * time lists), starting no earlier than `notBefore`, at most two hours long.
 * Null when less than an hour of those steps remains.
 */
export function prefillFrom(w: FreeWindow, notBefore?: string): { start: string; end: string } | null {
  const from = Math.max(toMinutes(w.start), notBefore ? toMinutes(notBefore) : 0);
  const start = Math.ceil(from / 30) * 30;
  const end = Math.min(Math.floor(toMinutes(w.end) / 30) * 30, start + PREFILL_MINUTES);
  return end - start >= MIN_OFFER_MINUTES ? { start: fromMinutes(start), end: fromMinutes(end) } : null;
}

/** The windows of a day the page offers for booking ([] before the earliest date, or when closed). */
export function bookableWindows(room: BookingRoom, date: string, taken: BusySlot[], now: Now): FreeWindow[] {
  if (date < earliestDate(room, now.date) || !openHoursOn(room, date)) return [];
  const notBefore = date === now.date ? now.time : undefined;
  return freeWindows(room, date, taken, MIN_OFFER_MINUTES).filter((w) => prefillFrom(w, notBefore) !== null);
}

/** The first bookable window on or after `from` (never before the earliest date), up to `until`. */
export function nextBookable(room: BookingRoom, taken: BusySlot[], now: Now, until: string, from?: string): NextBookable | null {
  const first = earliestDate(room, now.date);
  for (let d = from && from > first ? from : first; d <= until; d = addDays(d, 1)) {
    const w = bookableWindows(room, d, taken, now)[0];
    const p = w ? prefillFrom(w, d === now.date ? now.time : undefined) : null;
    if (w && p) return { date: d, ...p, until: w.end };
  }
  return null;
}

/* ---------------------------------------------------------------- labels
   Dates are written from translation keys, never Intl with "az" (browsers
   lack its data, so server and browser text would differ). */

export function dateText(iso: string, t: TFunction, withYear = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  return t(withYear ? "roomPage.dateDMY" : "roomPage.dateDM", { day: d, month: t(`course2.month${m}`), year: y });
}

/** "today" / "tomorrow" / "Thursday, 24 September" (or just "24 September"). */
export function whenText(iso: string, now: Now, t: TFunction, weekday = true): string {
  if (iso === now.date) return t("roomPage.whenToday");
  if (iso === addDays(now.date, 1)) return t("roomPage.whenTomorrow");
  if (!weekday) return dateText(iso, t);
  const [, m, d] = iso.split("-").map(Number);
  return t("roomPage.dayTitle", { weekday: t(`rooms.wdLong${isoWeekday(iso)}`), day: d, month: t(`course2.month${m}`) });
}

export function durationText(minutes: number, t: TFunction): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return t("roomPage.durM", { m });
  return m ? t("roomPage.durHM", { h, m }) : t("roomPage.durH", { h });
}

/* ---------------------------------------------------------------- context */

type Ctx = {
  room: BookingRoom;
  /** The generated busy calendar for `range`. */
  slots: BusySlot[];
  now: Now;
  range: Range;
  portalUrl: string;
  requests: SampleRequest[];
  /** `slots` plus the visitor's requests, for conflict checks. */
  taken: BusySlot[];
  /** The first date a request can be for (the general lead time). */
  earliest: string;
  /** The first bookable time given `taken`, so it moves on after each sample request. */
  next: NextBookable | null;
  selected: string;
  /** "YYYY-MM-01" of the month the calendar shows. */
  view: string;
  select: (date: string) => void;
  setView: (month: string) => void;
  openReserve: (prefill?: Prefill) => void;
};

const BookingContext = createContext<Ctx | null>(null);

export function useRoomBooking(): Ctx {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useRoomBooking must be used inside <RoomBooking>");
  return ctx;
}

/* ---------------------------------------------------------------- provider */

export function RoomBooking({
  room,
  slots,
  now,
  range,
  portalUrl,
  children,
}: {
  room: BookingRoom;
  slots: BusySlot[];
  now: Now;
  range: Range;
  /** The expert panel's origin (NEXT_PUBLIC_PORTAL_URL), where real rooms are booked. */
  portalUrl: string;
  children: ReactNode;
}) {
  const t = useT();
  const [requests, setRequests] = useState<SampleRequest[]>([]);
  const [selected, setSelected] = useState(now.date);
  const [view, setView] = useState(monthStart(now.date));
  const [dialog, setDialog] = useState<{ key: number; prefill: Required<Prefill> } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const seq = useRef(0);

  const taken = useMemo<BusySlot[]>(
    () => [
      ...slots,
      ...requests.map((r) => ({ date: r.date, start: r.start, end: r.end, title: t("roomPage.yourRequest"), kind: "BOOKING" as const })),
    ],
    [slots, requests, t],
  );
  const earliest = useMemo(() => earliestDate(room, now.date), [room, now.date]);
  const next = useMemo(() => nextBookable(room, taken, now, range.to), [room, taken, now, range.to]);

  const select = useCallback((date: string) => {
    setSelected(date);
    setView(monthStart(date));
  }, []);

  const openReserve = useCallback(
    (prefill?: Prefill) => {
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      let p: Required<Prefill> | null = null;
      if (prefill?.date && prefill.start && prefill.end) {
        p = { date: prefill.date, start: prefill.start, end: prefill.end };
      } else {
        // The day the visitor is looking at, when it can still be booked;
        // otherwise the first bookable time (after their own requests).
        const date = prefill?.date ?? selected;
        const w = bookableWindows(room, date, taken, now)[0];
        const times = w ? prefillFrom(w, date === now.date ? now.time : undefined) : null;
        if (times) p = { date, ...times };
        else if (next) p = { date: next.date, start: next.start, end: next.end };
        else {
          const open = (openHoursOn(room, earliest) ?? room.openHours.weekday)[0];
          p = { date: earliest, start: open, end: fromMinutes(toMinutes(open) + 90) };
        }
      }
      seq.current += 1;
      setDialog({ key: seq.current, prefill: p });
    },
    [room, selected, taken, now, next, earliest],
  );

  const close = useCallback(() => {
    setDialog(null);
    // Back to the button that opened the dialog, once it is gone.
    // A free-gap button that the new request just filled is gone; the
    // day's heading is the nearest sensible place then.
    const el = trigger.current;
    requestAnimationFrame(() => {
      const target = el?.isConnected ? el : document.getElementById("rc-timeline-title");
      target?.focus({ preventScroll: true });
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ room, slots, now, range, portalUrl, requests, taken, earliest, next, selected, view, select, setView, openReserve }),
    [room, slots, now, range, portalUrl, requests, taken, earliest, next, selected, view, select, openReserve],
  );

  return (
    <BookingContext.Provider value={value}>
      {children}
      {dialog
        ? createPortal(
            <ReserveDialog
              key={dialog.key}
              prefill={dialog.prefill}
              onClose={close}
              onDone={(r) => setRequests((list) => [...list, r])}
              onShow={(date) => {
                setDialog(null);
                select(date);
                // Bring the day's timeline (which now shows the request) into view.
                requestAnimationFrame(() => {
                  const title = document.getElementById("rc-timeline-title");
                  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  title?.closest("section")?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
                  title?.focus({ preventScroll: true });
                });
              }}
            />,
            document.body,
          )
        : null}
    </BookingContext.Provider>
  );
}

/**
 * Any "Reserve" button on the page: opens the shared dialog, prefilled with
 * `prefill` or with the first bookable time. Children come from the server.
 */
export function ReserveButton({
  prefill,
  children,
  ...rest
}: { prefill?: Prefill; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">) {
  const { openReserve } = useRoomBooking();
  return (
    <button type="button" aria-haspopup="dialog" {...rest} onClick={() => openReserve(prefill)}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- "earliest you can book"
   Client components so they follow the visitor's sample requests: a time
   the visitor has just asked for is no longer offered as free. Their first
   render uses only the server's strings, so it matches the server HTML. */

/** The reserve card's big time, with the day under it. */
export function NextBookableCard() {
  const t = useT();
  const { next, now } = useRoomBooking();
  if (!next) return <p className="text-[15px] font-semibold text-ink-2">{t("roomPage.noFree")}</p>;
  return (
    <>
      <p className="text-[13px] text-ink-3">{t("roomPage.nextBookable")}</p>
      <p className="rd-next mt-1.5">
        {next.start}
        <small>–{next.until}</small>
      </p>
      <p className="mt-1 text-[14px] font-medium text-ink-2">{whenText(next.date, now, t)}</p>
    </>
  );
}

/** One line for the phone hero, beside today's status. */
export function NextBookableLine({ className }: { className?: string }) {
  const t = useT();
  const { next, now } = useRoomBooking();
  if (!next) return null;
  return (
    <span className={className}>{t("roomPage.heroNext", { when: `${whenText(next.date, now, t)}, ${next.start}–${next.until}` })}</span>
  );
}

/** The action bar's two lines: the time first (what fits on a 320px phone), then the day. */
export function NextBookableBar({ fallback }: { fallback: string }) {
  const t = useT();
  const { next, now } = useRoomBooking();
  return (
    <>
      <p className="truncate font-display text-[17px] font-extrabold tracking-tight">
        {next ? (
          <>
            <span className="sr-only">{t("roomPage.nextBookable")}: </span>
            {next.start}–{next.until}
          </>
        ) : (
          fallback
        )}
      </p>
      <p className="truncate text-[12.5px] text-ink-3">{next ? whenText(next.date, now, t, false) : t("roomPage.noFree")}</p>
    </>
  );
}

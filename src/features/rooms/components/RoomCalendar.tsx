"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CalendarOff, CalendarPlus, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import type { BusySlot, DayStatus, SlotKind } from "../types";
import { addDays, addMonths, isoWeekday, monthGrid, monthStart, toMinutes, weekStart } from "../schedule";
import {
  MIN_OFFER_MINUTES,
  LEAD_WORKDAYS,
  bookableWindows,
  closedReason,
  dateText,
  dayStatus,
  dayUtilisation,
  freeWindows,
  openHoursOn,
  prefillFrom,
  useRoomBooking,
  type SampleRequest,
} from "./RoomBooking";
import "../rooms-detail.css";

/*
 * The room's busy calendar: a month grid (how full each day is) beside the
 * selected day's timeline (what is booked when, and the free gaps, which open
 * the reserve dialog prefilled with that time).
 *
 * Reads everything from <RoomBooking>: the busy slots and "now" were computed
 * on the server, so the first render here matches the server HTML exactly.
 * No Intl — month and weekday names come from translation keys.
 *
 * Keyboard: the grid has one tab stop (roving tabindex). Arrow keys move a
 * day or a week, Home/End go to the week's ends, PageUp/PageDown a month;
 * moving past the month's edge turns the page. Enter or Space selects.
 */

/* Busy blocks by kind. None of them is green: green is free time on this
   page (the dashed gaps, "Free", the dialog's free chips), and the visitor's
   own requests are gold. */
const KIND_HUE: Record<SlotKind, string> = {
  CLASS: "k-navy",
  EXAM: "k-trans",
  EVENT: "k-res",
  BOOKING: "k-eng",
  MAINTENANCE: "maint",
};
const KINDS: SlotKind[] = ["CLASS", "EXAM", "EVENT", "BOOKING", "MAINTENANCE"];

/* 0–4 filled segments, one step per status, so the legend (built from the
   same statuses as the day pills) names every cell: FREE 0, PARTIAL 1–2 by
   the share taken, BUSY 3, FULL 4. */
function level(status: DayStatus, util: number): number {
  if (status === "FREE" || status === "CLOSED") return 0;
  if (status === "PARTIAL") return util < 0.25 ? 1 : 2;
  return status === "BUSY" ? 3 : 4;
}
const LEGEND: [DayStatus, number][] = [["FREE", 0], ["PARTIAL", 2], ["BUSY", 3], ["FULL", 4]];

function groupByDate<T extends { date: string }>(list: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of list) {
    const day = m.get(x.date);
    if (day) day.push(x);
    else m.set(x.date, [x]);
  }
  return m;
}

const asSlot = (r: SampleRequest, title: string): BusySlot => ({ date: r.date, start: r.start, end: r.end, title, kind: "BOOKING" });

export function RoomCalendar() {
  const t = useT();
  const { room, slots, now, range, requests, selected, view, select, setView } = useRoomBooking();
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const wantFocus = useRef(false);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const byDate = useMemo(() => groupByDate(slots), [slots]);
  const reqByDate = useMemo(() => groupByDate(requests), [requests]);
  const mine = t("roomPage.yourRequest");
  const dayTaken = (date: string): BusySlot[] => [
    ...(byDate.get(date) ?? []),
    ...(reqByDate.get(date) ?? []).map((r) => asSlot(r, mine)),
  ];

  const year = Number(view.slice(0, 4));
  const month = Number(view.slice(5, 7));
  const rows = monthGrid(year, month);
  const canPrev = view > monthStart(range.from);
  const canNext = view < monthStart(range.to);
  const inView = (d: string | null): d is string => !!d && d.slice(0, 7) === view.slice(0, 7);
  const tabStop = [focusDate, selected, now.date].find(inView) ?? view;

  // After a keyboard move re-renders the grid, put focus on the new day.
  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    buttons.current.get(tabStop)?.focus();
  });

  function moveTo(target: string) {
    const to = target < range.from ? range.from : target > range.to ? range.to : target;
    setFocusDate(to);
    if (!inView(to)) setView(monthStart(to));
    wantFocus.current = true;
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, date: string) {
    let to: string | null = null;
    if (e.key === "ArrowLeft") to = addDays(date, -1);
    else if (e.key === "ArrowRight") to = addDays(date, 1);
    else if (e.key === "ArrowUp") to = addDays(date, -7);
    else if (e.key === "ArrowDown") to = addDays(date, 7);
    else if (e.key === "Home") to = weekStart(date);
    else if (e.key === "End") to = addDays(weekStart(date), 6);
    else if (e.key === "PageUp" || e.key === "PageDown") {
      const m = addMonths(date, e.key === "PageUp" ? -1 : 1);
      const last = Number(addDays(addMonths(m, 1), -1).slice(8));
      to = `${m.slice(0, 8)}${String(Math.min(Number(date.slice(8)), last)).padStart(2, "0")}`;
    }
    if (!to) return;
    e.preventDefault();
    moveTo(to);
  }

  const monthTitle = t("roomPage.monthYear", { month: t(`rooms.monthTitle${month}`), year });

  // Each day of the month once: the cells and the month's summary share it.
  const days = new Map(
    rows.flat().filter((d): d is string => !!d).map((date) => {
      const taken = dayTaken(date);
      const util = dayUtilisation(room, date, taken);
      return [date, { count: taken.length, reason: closedReason(room, date), status: dayStatus(room, date, taken), util }] as const;
    }),
  );
  // The summary counts the days still ahead (today on): a free day that has
  // already gone is no help to someone looking for one. A month that is
  // wholly past gets no summary.
  const ahead = [...days].filter(([d, x]) => d >= now.date && !x.reason).map(([, x]) => x);
  const lastDay = rows.flat().filter((d): d is string => !!d).at(-1)!;
  const stats =
    lastDay < now.date
      ? null
      : {
          free: ahead.filter((d) => d.status === "FREE").length,
          full: ahead.filter((d) => d.status === "FULL").length,
          avg: ahead.length ? Math.round((ahead.reduce((sum, d) => sum + d.util, 0) / ahead.length) * 100) : 0,
        };
  const firstAhead = view > now.date ? view : now.date;
  const period =
    firstAhead === view
      ? monthTitle
      : firstAhead === lastDay
        ? dateText(lastDay, t)
        : t("roomPage.dateRangeDM", { from: Number(firstAhead.slice(8)), to: Number(lastDay.slice(8)), month: t(`course2.month${month}`) });

  return (
    // One busy scale for every room (the navy family), so "how full" reads
    // the same on every page and never blends with the green free slots.
    <div className="rc k-navy">
      <div className="rc-in">
        <div className="rc-month">
          <div className="rc-head">
            <h3 id="rc-month-title" className="t-md" aria-live="polite">
              {monthTitle}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="btn btn-ghost btn-sm !h-9 !px-3.5"
                onClick={() => {
                  setFocusDate(null);
                  select(now.date);
                }}
              >
                {t("roomPage.today")}
              </button>
              <button
                type="button"
                className="btn-icon line !size-9"
                disabled={!canPrev}
                aria-label={t("roomPage.prevMonth")}
                onClick={() => setView(addMonths(view, -1))}
              >
                <ChevronLeft className="i" aria-hidden />
              </button>
              <button
                type="button"
                className="btn-icon line !size-9"
                disabled={!canNext}
                aria-label={t("roomPage.nextMonth")}
                onClick={() => setView(addMonths(view, 1))}
              >
                <ChevronRight className="i" aria-hidden />
              </button>
            </div>
          </div>

          <div role="grid" aria-labelledby="rc-month-title" className="rc-grid">
            <div role="row" className="rc-row rc-wd">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div role="columnheader" key={i} aria-label={t(`rooms.wdLong${i}`)} className={cn(i > 5 && "we")}>
                  <span aria-hidden>{t(`rooms.wd${i}`)}</span>
                </div>
              ))}
            </div>
            {rows.map((row, ri) => (
              <div role="row" className="rc-row" key={ri}>
                {row.map((date, ci) => {
                  if (!date) return <div role="gridcell" key={ci} className="rc-pad" />;
                  const { count, reason, status, util } = days.get(date)!;
                  const lv = level(status, util);
                  const day = Number(date.slice(8));
                  const isToday = date === now.date;
                  const isSel = date === selected;
                  const hasMine = reqByDate.has(date);
                  const pct = Math.round(util * 100);
                  const state = reason
                    ? t(`rooms.closed_${reason}`)
                    : count
                      ? t("roomPage.cellBusy", { count, pct }) +
                        (status === "FULL" ? ` — ${t("rooms.status_FULL")}` : "")
                      : t("roomPage.cellFree");
                  const label = t("roomPage.cellAria", {
                    date: t("roomPage.dateDM", { day, month: t(`course2.month${month}`) }),
                    weekday: t(`rooms.wdLong${isoWeekday(date)}`),
                    status: [state, isToday && t("roomPage.cellToday"), hasMine && t("roomPage.cellYours")].filter(Boolean).join(", "),
                  });
                  return (
                    <div role="gridcell" key={date} aria-selected={isSel}>
                      <button
                        ref={(el) => {
                          if (el) buttons.current.set(date, el);
                          else buttons.current.delete(date);
                        }}
                        type="button"
                        tabIndex={date === tabStop ? 0 : -1}
                        aria-label={label}
                        aria-current={isToday ? "date" : undefined}
                        className={cn(
                          "rc-day",
                          `l${lv}`,
                          reason && "closed",
                          date < now.date && "past",
                          isToday && "today",
                          isSel && "sel",
                        )}
                        onClick={() => {
                          setFocusDate(date);
                          select(date);
                        }}
                        onKeyDown={(e) => onKey(e, date)}
                      >
                        <span className="n">{day}</span>
                        {reason ? (
                          <span className="cl">{t("roomPage.closed")}</span>
                        ) : (
                          <span className="bar" aria-hidden>
                            <i />
                            <i />
                            <i />
                            <i />
                          </span>
                        )}
                        {hasMine ? <span className="mine" aria-hidden /> : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <ul className="rc-legend" aria-label={t("roomPage.legend")}>
            {LEGEND.map(([status, lv]) => (
              <li key={status}>
                <span className={cn("rc-sw", `l${lv}`)} aria-hidden>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                {t(`rooms.status_${status}`)}
              </li>
            ))}
            <li>
              <span className="rc-sw closed" aria-hidden />
              {t("rooms.status_CLOSED")}
            </li>
            {requests.length ? (
              <li>
                <span className="rc-sw mine" aria-hidden />
                {t("roomPage.legendYours")}
              </li>
            ) : null}
          </ul>

          {stats ? (
            <>
              <h4 className="rc-stats-t">{t("roomPage.statsLabel", { month: period })}</h4>
              <dl className="rc-stats">
                <div>
                  <dt>{t("roomPage.statFree")}</dt>
                  <dd>{stats.free}</dd>
                </div>
                <div>
                  <dt>{t("roomPage.statFull")}</dt>
                  <dd>{stats.full}</dd>
                </div>
                <div>
                  <dt>{t("roomPage.statAvg")}</dt>
                  <dd>{stats.avg}%</dd>
                </div>
              </dl>
            </>
          ) : null}
        </div>

        <DayTimeline date={selected} busy={byDate.get(selected) ?? []} mine={reqByDate.get(selected) ?? []} />
      </div>
    </div>
  );
}

/**
 * One day, hour by hour: busy blocks coloured by kind, the visitor's sample
 * requests, and the free gaps — each free hour or more a button that opens
 * the reserve dialog with that time. Past days, the days before the earliest
 * date the booking rules allow, and gaps under an hour are shown but cannot
 * be booked.
 */
function DayTimeline({ date, busy, mine }: { date: string; busy: BusySlot[]; mine: SampleRequest[] }) {
  const t = useT();
  const { room, now, range, earliest, requests, select, openReserve } = useRoomBooking();
  const mineTitle = t("roomPage.yourRequest");
  const taken = [...busy, ...mine.map((r) => asSlot(r, mineTitle))];
  const hours = openHoursOn(room, date);
  const reason = closedReason(room, date);
  const status = dayStatus(room, date, taken);
  const util = dayUtilisation(room, date, taken);
  const month = Number(date.slice(5, 7));
  const title = t("roomPage.dayTitle", {
    weekday: t(`rooms.wdLong${isoWeekday(date)}`),
    day: Number(date.slice(8)),
    month: t(`course2.month${month}`),
  });
  const past = date < now.date;
  // Still ahead, but inside the lead time the rules ask for.
  const early = !past && date < earliest;
  const isToday = date === now.date;
  const nowMin = toMinutes(now.time);

  // One scale for every day of this room, so days compare at a glance.
  const spans = [room.openHours.weekday, room.openHours.saturday].filter((h): h is [string, string] => !!h);
  const base = Math.floor(Math.min(...spans.map((h) => toMinutes(h[0]))) / 60) * 60;
  const top = Math.ceil(Math.max(...spans.map((h) => toMinutes(h[1]))) / 60) * 60;
  const rows = (top - base) / 60;
  const at = (a: number) => `calc(var(--hh) * ${(a - base) / 60})`;
  // 1px of air between touching blocks.
  const box = (a: number, b: number) => ({
    top: `calc(var(--hh) * ${(a - base) / 60} + 1px)`,
    height: `calc(var(--hh) * ${(b - a) / 60} - 2px)`,
  });

  // Overlapping slots sit side by side in lanes.
  const items = [
    ...busy.map((slot) => ({ slot, req: null as SampleRequest | null })),
    ...mine.map((r) => ({ slot: asSlot(r, mineTitle), req: r })),
  ]
    .map((x) => ({ ...x, a: toMinutes(x.slot.start), b: toMinutes(x.slot.end), lane: 0 }))
    .sort((p, q) => p.a - q.a || q.b - p.b);
  const laneEnds: number[] = [];
  for (const it of items) {
    let lane = laneEnds.findIndex((e) => e <= it.a);
    if (lane === -1) lane = laneEnds.push(it.b) - 1;
    else laneEnds[lane] = it.b;
    it.lane = lane;
  }
  const lanes = Math.max(1, laneEnds.length);

  // Free gaps: an hour or more from the earliest bookable date on is a
  // button; the rest is muted — gone, inside the lead time, or too short to
  // offer (the same hour that makes a day "fully booked").
  type Gap = { a: number; b: number; book: { start: string; end: string } | null; label: [string, string]; short: boolean };
  const gaps: Gap[] = [];
  const muted = (a: number, b: number, label: [string, string]): Gap => ({ a, b, book: null, label, short: b - a < MIN_OFFER_MINUTES });
  for (const w of hours ? freeWindows(room, date, taken, 30) : []) {
    const a = toMinutes(w.start);
    const b = toMinutes(w.end);
    const p = past || early ? null : prefillFrom(w, isToday ? now.time : undefined);
    if (!p) {
      gaps.push(muted(a, b, [w.start, w.end]));
      continue;
    }
    const from = toMinutes(p.start);
    if (from > a) gaps.push(muted(a, from, [w.start, p.start]));
    gaps.push({ a: from, b, book: p, label: [p.start, w.end], short: false });
  }

  const bookable = !past && !reason && bookableWindows(room, date, taken, now).length > 0;

  return (
    <section className="rc-dayp" aria-labelledby="rc-timeline-title">
      <div className="rc-dhead">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rc-status", `s-${status}`)}>
              <i aria-hidden />
              {t(`rooms.status_${status}`)}
            </span>
            {isToday ? <span className="pill pill-navy !h-6">{t("roomPage.today")}</span> : null}
          </div>
          <h3 id="rc-timeline-title" tabIndex={-1} className="t-md mt-2.5 outline-none">
            {title}
          </h3>
          <p className="mt-1 text-[13.5px] text-ink-3">
            {hours ? (
              <>
                <span className="whitespace-nowrap">{t("roomPage.openFromTo", { start: hours[0], end: hours[1] })}</span>
                {" · "}
                <span className="whitespace-nowrap">
                  {taken.length
                    ? t("roomPage.dayCount", { count: taken.length, pct: Math.round(util * 100) })
                    : t("roomPage.dayFree")}
                </span>
              </>
            ) : (
              t(`rooms.closed_${reason ?? "SUNDAY"}`)
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            className="btn-icon line !size-9"
            disabled={date <= range.from}
            aria-label={t("roomPage.prevDay")}
            onClick={() => select(addDays(date, -1))}
          >
            <ChevronLeft className="i" aria-hidden />
          </button>
          <button
            type="button"
            className="btn-icon line !size-9"
            disabled={date >= range.to}
            aria-label={t("roomPage.nextDay")}
            onClick={() => select(addDays(date, 1))}
          >
            <ChevronRight className="i" aria-hidden />
          </button>
        </div>
      </div>

      {reason || !hours ? (
        <div className="rc-closed">
          <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-surface text-ink-3 shadow-[0_0_0_1px_var(--line)]">
            <CalendarOff className="i" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">{t(`rooms.closed_${reason ?? "SUNDAY"}`)}</p>
            <p className="mt-0.5 text-[14px] text-ink-2">{t("roomPage.closedHint")}</p>
          </div>
        </div>
      ) : (
        <>
          {past ? <p className="rc-pastnote">{t("roomPage.pastDay")}</p> : null}
          {early ? (
            <p className="rc-pastnote">
              {t("roomPage.leadNote", { n: LEAD_WORKDAYS })}{" "}
              <button type="button" className="link text-[13px]" onClick={() => select(earliest)}>
                {t("roomPage.goEarliest", { date: dateText(earliest, t) })}
              </button>
            </p>
          ) : null}
          <div className="rc-tl" style={{ "--rows": rows } as React.CSSProperties}>
            <div className="rc-hours" aria-hidden>
              {Array.from({ length: rows + 1 }, (_, i) => (
                // The "now" label takes the gutter's place near its hour.
                <span
                  key={i}
                  style={{ top: at(base + i * 60) }}
                  className={cn(isToday && Math.abs(nowMin - (base + i * 60)) < 15 && "hide")}
                >
                  {String(base / 60 + i).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            <div className="rc-bg" aria-hidden>
              {toMinutes(hours[0]) > base ? <i className="off" style={box(base, toMinutes(hours[0]))} /> : null}
              {toMinutes(hours[1]) < top ? <i className="off" style={box(toMinutes(hours[1]), top)} /> : null}
            </div>
            <ol className="rc-col" aria-label={t("roomPage.timeline", { date: title })}>
              {items.map(({ slot, req, a, b, lane }) => (
                <li
                  key={req ? req.id : `${slot.start}-${slot.end}-${slot.title}-${lane}`}
                  // Two lines need about 45px: an hour is 44px, so an hour or less is one line.
                  className={cn("rc-blk", req ? "mine" : KIND_HUE[slot.kind], b - a < 65 && "short")}
                  style={{
                    ...box(a, b),
                    left: `calc(${lane} * 100% / ${lanes})`,
                    width: `calc(100% / ${lanes} - ${lanes > 1 ? 4 : 0}px)`,
                  }}
                >
                  <b className="tt">{slot.title}</b>
                  <span className="tm">
                    {slot.start}–{slot.end} · {req ? t(`roomPage.purpose_${req.purpose}`) : t(`rooms.slot_${slot.kind}`)}
                  </span>
                </li>
              ))}
              {gaps.map((g) =>
                g.book ? (
                  <li key={`g${g.a}`} className="rc-gapli" style={box(g.a, g.b)}>
                    <button
                      type="button"
                      className={cn("rc-gap", g.b - g.a < 50 && "short")}
                      aria-haspopup="dialog"
                      aria-label={t("roomPage.freeGapAria", { start: g.label[0], end: g.label[1] })}
                      onClick={() => openReserve({ date, ...g.book! })}
                    >
                      <Plus className="i" aria-hidden />
                      <span>{t("roomPage.freeGap", { start: g.label[0], end: g.label[1] })}</span>
                    </button>
                  </li>
                ) : (
                  <li key={`g${g.a}`} className={cn("rc-gap gone", g.b - g.a < 50 && "short")} style={box(g.a, g.b)}>
                    {/* Under an hour it is not "free" in this page's sense
                        (see MIN_OFFER_MINUTES): just the times on screen. */}
                    {g.short ? (
                      <span>
                        <span className="sr-only">{t("roomPage.shortGapSr")} </span>
                        {g.label[0]}–{g.label[1]}
                      </span>
                    ) : (
                      <span>{t("roomPage.freeGap", { start: g.label[0], end: g.label[1] })}</span>
                    )}
                  </li>
                ),
              )}
            </ol>
            {isToday && nowMin >= base && nowMin <= top ? (
              <div className="rc-now" style={{ top: at(nowMin) }}>
                <span aria-hidden>{now.time}</span>
                <b className="sr-only">{t("roomPage.now", { time: now.time })}</b>
              </div>
            ) : null}
          </div>
          <ul className="rc-key" aria-label={t("roomPage.kindsLegend")}>
            {KINDS.map((k) => (
              <li key={k}>
                <span className={cn("rc-ksw", KIND_HUE[k])} aria-hidden />
                {t(`rooms.slot_${k}`)}
              </li>
            ))}
            {requests.length ? (
              <li>
                <span className="rc-ksw mine" aria-hidden />
                {t("roomPage.legendYours")}
              </li>
            ) : null}
            <li>
              <span className="rc-ksw free" aria-hidden />
              {t("roomPage.legendFreeGap")}
            </li>
          </ul>
          {bookable ? (
            <button type="button" className="btn btn-ghost btn-block mt-4" aria-haspopup="dialog" onClick={() => openReserve({ date })}>
              <CalendarPlus className="i" aria-hidden />
              {t("roomPage.reserveDay")}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

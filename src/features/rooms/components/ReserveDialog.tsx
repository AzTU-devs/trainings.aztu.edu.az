"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, CalendarCheck, CircleAlert, Info, X } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { findConflict, fromMinutes, isHHMM, isISODate, toMinutes } from "../schedule";
import {
  PURPOSES,
  bookableWindows,
  closedReason,
  dateText,
  durationText,
  earliestDate,
  leadWorkdays,
  nextBookable,
  openHoursOn,
  prefillFrom,
  reservationProblem,
  useRoomBooking,
  type Purpose,
  type SampleRequest,
} from "./RoomBooking";
import "../rooms-detail.css";

/*
 * The reserve dialog of a SAMPLE room. Fully interactive — the date, times,
 * attendees and contact details are checked against the room's opening
 * hours, capacity and busy calendar as the visitor types — but completing it
 * sends nothing: the confirmation says so and points experts to the dashboard,
 * where the university's real rooms are booked.
 *
 * Rendered by <RoomBooking> (in a portal) only while open, so every opening
 * starts from a fresh form, and nothing here is part of the server HTML.
 */

type Field = "date" | "start" | "end" | "attendees" | "name" | "email" | "phone";
const ORDER: Field[] = ["date", "start", "end", "attendees", "name", "email", "phone"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ids for the visit's sample requests (they never leave this page) */
let requestSeq = 0;

/* Keeps Tab inside the dialog: from the last control back to the first and
   the other way round (the heading, focused on open, counts as the start). */
function trapTab(e: KeyboardEvent, root: HTMLElement) {
  const els = Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    ),
  ).filter((el) => el.getClientRects().length > 0);
  if (!els.length) return;
  const i = els.indexOf(document.activeElement as HTMLElement);
  if (e.shiftKey && i <= 0) {
    e.preventDefault();
    els[els.length - 1].focus();
  } else if (!e.shiftKey && i === els.length - 1) {
    e.preventDefault();
    els[0].focus();
  }
}

/* 30-minute steps from `a` to `b` (minutes), plus the current value when it
   lies outside them, so a time kept from another day stays visible (and is
   flagged) instead of silently changing. */
function steps(a: number, b: number, current: string): string[] {
  const out: string[] = [];
  for (let m = a; m <= b; m += 30) out.push(fromMinutes(m));
  if (isHHMM(current) && !out.includes(current)) out.push(current);
  return out.sort();
}

export function ReserveDialog({
  prefill,
  onClose,
  onDone,
  onShow,
}: {
  prefill: { date: string; start: string; end: string };
  onClose: () => void;
  /** Called once with the completed (sample) request. */
  onDone: (r: SampleRequest) => void;
  /** "See it on the calendar": close and select that day. */
  onShow: (date: string) => void;
}) {
  const t = useT();
  const { room, now, range, taken, portalUrl } = useRoomBooking();
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;

  const [date, setDate] = useState(prefill.date);
  const [start, setStart] = useState(prefill.start);
  const [end, setEnd] = useState(prefill.end);
  const [attendees, setAttendees] = useState(String(Math.min(room.capacity, 12)));
  const [purpose, setPurpose] = useState<Purpose>("TRAINING");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState<Set<Field>>(() => new Set());
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState<SampleRequest | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // Focus, Escape, Tab trap and a still page behind — like the filter sheet.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && panelRef.current) trapTab(e, panelRef.current);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    const target = done ? doneRef.current : null;
    if (!target) return;
    panelRef.current?.scrollTo({ top: 0 });
    target.focus({ preventScroll: true });
  }, [done]);

  const touch = (f: Field) => setTouched((s) => (s.has(f) ? s : new Set(s).add(f)));

  const validDate = isISODate(date);
  const hours = validDate ? openHoursOn(room, date) : null;
  const [openAt, closeAt] = (hours ?? room.openHours.weekday).map(toMinutes);

  // The room's printed rule: requests at least 2 working days ahead, events 10.
  const earliest = earliestDate(room, now.date, leadWorkdays(purpose));

  /* The schedule problem, if any, and the field it belongs to. After the
     lead time, the rule order is reservationProblem's (the data layer's),
     with the details the visitor needs to fix it: which day is closed and
     why, the day's hours, and the slot the request clashes with. */
  const sched = useMemo((): { field: Field; msg: string } | null => {
    if (!validDate) return { field: "date", msg: t("rooms.problem_INVALID") };
    if (date < now.date) return { field: "date", msg: t("roomPage.errPastDate") };
    if (date < earliest) {
      const key = purpose === "EVENT" ? "roomPage.errLeadEvent" : "roomPage.errLead";
      return { field: "date", msg: t(key, { n: leadWorkdays(purpose), date: dateText(earliest, t) }) };
    }
    if (isHHMM(start) && isHHMM(end) && end <= start && date <= range.to && !closedReason(room, date)) {
      return { field: "end", msg: t("roomPage.errEndBeforeStart") };
    }
    const problem = reservationProblem(room, taken, { date, start, end, attendees: 1 }, now);
    switch (problem) {
      case null:
      case "CAPACITY":
        return null;
      case "INVALID":
        return { field: "start", msg: t("rooms.problem_INVALID") };
      case "PAST":
        return { field: "start", msg: t("rooms.problem_PAST") };
      case "TOO_FAR":
        return { field: "date", msg: t("rooms.problem_TOO_FAR") };
      case "CLOSED": {
        const reason = closedReason(room, date) ?? "SUNDAY";
        return { field: "date", msg: t("roomPage.errClosed", { reason: t(`rooms.closed_${reason}`) }) };
      }
      case "TOO_SHORT":
      case "TOO_LONG":
        return { field: "end", msg: t(`rooms.problem_${problem}`) };
      case "OUTSIDE_HOURS": {
        const h = openHoursOn(room, date)!;
        return { field: start < h[0] ? "start" : "end", msg: t("roomPage.errHours", { start: h[0], end: h[1] }) };
      }
      case "CONFLICT": {
        const c = findConflict(taken, date, start, end)!;
        return { field: "start", msg: t("roomPage.errConflict", { start: c.start, end: c.end, title: c.title }) };
      }
    }
  }, [validDate, date, start, end, room, taken, now, range.to, earliest, purpose, t]);

  const count = Number(attendees);
  const errors: Partial<Record<Field, string>> = {};
  if (sched) errors[sched.field] = sched.msg;
  if (!/^\d+$/.test(attendees.trim()) || count < 1) errors.attendees = t("roomPage.errAttendees");
  else if (count > room.capacity) errors.attendees = t("rooms.problem_CAPACITY", { capacity: room.capacity });
  if (name.trim().length < 3) errors.name = t("roomPage.errName");
  if (!EMAIL.test(email.trim())) errors.email = t("roomPage.errEmail");
  if (phone.trim() && !/^\+?[\d\s()-]{7,20}$/.test(phone.trim())) errors.phone = t("roomPage.errPhone");

  // Schedule problems show at once (the times arrive prefilled); the rest
  // once the visitor has left the field or tried to finish.
  const shown = (f: Field): string | null =>
    errors[f] && (f === "date" || f === "start" || f === "end" || tried || touched.has(f)) ? errors[f]! : null;

  const free = validDate ? bookableWindows(room, date, taken, now) : [];
  const startOpts = steps(openAt, closeAt - 30, start);
  const endOpts = steps(openAt + 30, closeAt, end);
  const minutes = isHHMM(start) && isHHMM(end) ? toMinutes(end) - toMinutes(start) : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    const first = ORDER.find((f) => errors[f]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    const r: SampleRequest = {
      id: `req-${++requestSeq}`,
      date,
      start,
      end,
      attendees: count,
      purpose,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    };
    onDone(r);
    setDone(r);
  }

  const panelUrl = `${portalUrl.replace(/\/+$/, "")}/tutor/rooms`;

  return (
    <div className="rsv">
      <div className="rsv-scrim" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className={cn("rsv-panel", `k-${room.hue}`)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id("title")}
      >
        <div className="grabber sm:hidden" aria-hidden />
        <header className="rsv-head">
          <div className="min-w-0">
            <p className="rsv-room">
              <span className="pill pill-gold">{t("roomPage.sampleRoom")}</span>
              <span className="truncate">{room.name}</span>
            </p>
            {done ? null : (
              <h2 id={id("title")} ref={titleRef} tabIndex={-1} className="t-lg mt-2 outline-none">
                {t("roomPage.dlgTitle")}
              </h2>
            )}
          </div>
          <button type="button" className="btn-icon line shrink-0" onClick={onClose} aria-label={t("roomPage.close")}>
            <X className="i" aria-hidden />
          </button>
        </header>

        {done ? (
          <DoneStep
            done={done}
            titleId={id("title")}
            headingRef={doneRef}
            panelUrl={panelUrl}
            onAnother={() => {
              // The time just asked for is taken now: start from the next
              // bookable one on that day or after it, with a clean slate.
              const nb = nextBookable(room, taken, now, range.to, done.date);
              if (nb) {
                setDate(nb.date);
                setStart(nb.start);
                setEnd(nb.end);
              }
              setDone(null);
              setTried(false);
              setTouched(new Set());
              requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
            }}
            onShow={() => onShow(done.date)}
          />
        ) : (
          <form noValidate onSubmit={submit} className="rsv-form">
            <div className="rsv-body">
              <p className="note">
                <Info className="i shrink-0" aria-hidden />
                <span>{t("roomPage.dlgSample")}</span>
              </p>

              {/* ---- when ---- */}
              <fieldset className="rsv-sec">
                <legend>{t("roomPage.secWhen")}</legend>
                <div className="rsv-grid rsv-grid-3">
                  <Control
                    label={t("roomPage.date")}
                    htmlFor={id("date")}
                    className="rsv-date"
                    hint={t("roomPage.earliestHint", { date: dateText(earliest, t) })}
                    hintId={id("date-hint")}
                  >
                    <input
                      id={id("date")}
                      type="date"
                      className="rsv-input"
                      value={date}
                      min={earliest}
                      max={range.to}
                      required
                      aria-invalid={sched?.field === "date" || undefined}
                      aria-describedby={sched?.field === "date" ? `${id("sched")} ${id("date-hint")}` : id("date-hint")}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Control>
                  <Control label={t("roomPage.start")} htmlFor={id("start")}>
                    <select
                      id={id("start")}
                      className="rsv-input rsv-select"
                      value={start}
                      aria-invalid={sched?.field === "start" || undefined}
                      aria-describedby={sched?.field === "start" ? id("sched") : undefined}
                      onChange={(e) => {
                        const v = e.target.value;
                        setStart(v);
                        // Keep the length when the end would fall before the new start.
                        if (isHHMM(end) && end <= v) setEnd(fromMinutes(Math.min(closeAt, toMinutes(v) + Math.max(30, minutes))));
                      }}
                    >
                      {startOpts.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Control>
                  <Control label={t("roomPage.end")} htmlFor={id("end")}>
                    <select
                      id={id("end")}
                      className="rsv-input rsv-select"
                      value={end}
                      aria-invalid={sched?.field === "end" || undefined}
                      aria-describedby={sched?.field === "end" ? id("sched") : undefined}
                      onChange={(e) => setEnd(e.target.value)}
                    >
                      {endOpts.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Control>
                </div>
                <div aria-live="polite">
                  {sched ? (
                    <p className="rsv-err mt-3" id={id("sched")}>
                      <CircleAlert className="i" aria-hidden />
                      {sched.msg}
                    </p>
                  ) : null}
                </div>
                {validDate && hours && date >= earliest && date <= range.to ? (
                  <div className="mt-4">
                    <p className="rsv-sub">{t("roomPage.freeThatDay")}</p>
                    {free.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {free.map((w) => {
                          const p = prefillFrom(w, date === now.date ? now.time : undefined)!;
                          const on = start >= p.start && end <= w.end && start < w.end;
                          return (
                            <button
                              key={w.start}
                              type="button"
                              className={cn("rsv-free", on && "on")}
                              aria-pressed={on}
                              onClick={() => {
                                setStart(p.start);
                                setEnd(p.end);
                              }}
                            >
                              {p.start}–{w.end}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-1 text-[14px] text-ink-3">{t("roomPage.noFreeThatDay")}</p>
                    )}
                  </div>
                ) : null}
              </fieldset>

              {/* ---- who and why ---- */}
              <fieldset className="rsv-sec">
                <legend>{t("roomPage.secWho")}</legend>
                <div className="rsv-grid rsv-grid-att">
                  <Control label={t("roomPage.attendees")} htmlFor={id("attendees")} hint={t("roomPage.attendeesHint", { capacity: room.capacity })} hintId={id("att-hint")} error={shown("attendees")} errorId={id("att-err")}>
                    <input
                      id={id("attendees")}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={room.capacity}
                      className="rsv-input"
                      value={attendees}
                      aria-invalid={!!shown("attendees") || undefined}
                      aria-describedby={shown("attendees") ? id("att-err") : id("att-hint")}
                      onChange={(e) => {
                        setAttendees(e.target.value);
                        touch("attendees");
                      }}
                    />
                  </Control>
                  <div role="radiogroup" aria-labelledby={id("purpose")} className="min-w-0">
                    <p id={id("purpose")} className="rsv-label">
                      {t("roomPage.purpose")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PURPOSES.map((p) => (
                        <label key={p} className="rsv-opt">
                          <input
                            type="radio"
                            name={id("purpose")}
                            value={p}
                            checked={purpose === p}
                            onChange={() => setPurpose(p)}
                          />
                          <span>{t(`roomPage.purpose_${p}`)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* ---- contact ---- */}
              <fieldset className="rsv-sec">
                <legend>{t("roomPage.secContact")}</legend>
                <div className="rsv-grid rsv-grid-2">
                  <Control label={t("roomPage.fullName")} htmlFor={id("name")} error={shown("name")} errorId={id("name-err")}>
                    <input
                      id={id("name")}
                      className="rsv-input"
                      autoComplete="name"
                      value={name}
                      aria-invalid={!!shown("name") || undefined}
                      aria-describedby={shown("name") ? id("name-err") : undefined}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => touch("name")}
                    />
                  </Control>
                  <Control label={t("roomPage.email")} htmlFor={id("email")} error={shown("email")} errorId={id("email-err")}>
                    <input
                      id={id("email")}
                      type="email"
                      className="rsv-input"
                      autoComplete="email"
                      value={email}
                      aria-invalid={!!shown("email") || undefined}
                      aria-describedby={shown("email") ? id("email-err") : undefined}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => touch("email")}
                    />
                  </Control>
                  <Control
                    label={t("roomPage.phone")}
                    optional={t("roomPage.optional")}
                    htmlFor={id("phone")}
                    error={shown("phone")}
                    errorId={id("phone-err")}
                  >
                    <input
                      id={id("phone")}
                      type="tel"
                      className="rsv-input"
                      autoComplete="tel"
                      placeholder="+994 12 345 67 89"
                      value={phone}
                      aria-invalid={!!shown("phone") || undefined}
                      aria-describedby={shown("phone") ? id("phone-err") : undefined}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => touch("phone")}
                    />
                  </Control>
                  <Control label={t("roomPage.notes")} optional={t("roomPage.optional")} htmlFor={id("notes")} className="sm:col-span-2">
                    <textarea
                      id={id("notes")}
                      className="rsv-input rsv-textarea"
                      rows={3}
                      maxLength={600}
                      placeholder={t("roomPage.notesPh")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Control>
                </div>
              </fieldset>
            </div>

            <footer className="rsv-foot">
              <p className="rsv-when">
                {!sched ? (
                  <>
                    <CalendarCheck className="i" aria-hidden />
                    <span>
                      <b>{dateText(date, t, true)}</b>
                      <span className="text-ink-3">
                        {" · "}
                        {start}–{end} · {durationText(minutes, t)}
                      </span>
                    </span>
                  </>
                ) : null}
              </p>
              <button type="submit" className="btn btn-primary">
                {t("roomPage.submit")}
                <ArrowRight className="i i-arrow" aria-hidden />
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}

/** A labelled control with an optional hint and error line. */
function Control({
  label,
  htmlFor,
  optional,
  hint,
  hintId,
  error,
  errorId,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: string;
  hint?: string;
  hintId?: string;
  error?: string | null;
  errorId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rsv-ctl min-w-0", className)}>
      <label htmlFor={htmlFor} className="rsv-label">
        {label}
        {optional ? <small> · {optional}</small> : null}
      </label>
      {children}
      {error ? (
        <p className="rsv-err" id={errorId}>
          <CircleAlert className="i" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="rsv-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** The confirmation: what was asked for, and plainly that nothing was sent. */
function DoneStep({
  done,
  titleId,
  headingRef,
  panelUrl,
  onAnother,
  onShow,
}: {
  done: SampleRequest;
  titleId: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  panelUrl: string;
  onAnother: () => void;
  onShow: () => void;
}) {
  const t = useT();
  const { room } = useRoomBooking();
  const minutes = toMinutes(done.end) - toMinutes(done.start);
  const rows: [string, ReactNode][] = [
    [t("roomPage.sumRoom"), `${room.name} · ${room.buildingCode}`],
    [
      t("roomPage.sumWhen"),
      <>
        {dateText(done.date, t, true)}, {done.start}–{done.end}
        <span className="text-ink-3"> · {durationText(minutes, t)}</span>
      </>,
    ],
    [t("roomPage.sumAttendees"), t("roomPage.persons", { count: done.attendees })],
    [t("roomPage.sumPurpose"), t(`roomPage.purpose_${done.purpose}`)],
    [
      t("roomPage.sumContact"),
      <>
        {done.name}
        <span className="block text-ink-3">{[done.email, done.phone].filter(Boolean).join(" · ")}</span>
      </>,
    ],
  ];
  return (
    <div className="rsv-form">
      <div className="rsv-body">
        <div className="flex items-center gap-4">
          <div className="rsv-okmark" aria-hidden>
            <CalendarCheck className="i" />
          </div>
          <h2 id={titleId} ref={headingRef} tabIndex={-1} className="t-lg min-w-0 outline-none">
            {t("roomPage.okTitle")}
          </h2>
        </div>
        <div className="note mt-4 !p-4">
          <Info className="i shrink-0" aria-hidden />
          <div className="grid gap-1.5">
            <p className="font-semibold text-ink">{t("roomPage.okNotice")}</p>
            <p>{t("roomPage.okExperts")}</p>
            <a href={panelUrl} target="_blank" rel="noopener noreferrer" className="link mt-1 w-fit text-[14px]">
              {t("roomPage.panelLink")}
              <ArrowUpRight className="i" aria-hidden />
            </a>
          </div>
        </div>
        <dl className="rsv-sum mt-5">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-3">{t("roomPage.okCalendar")}</p>
      </div>
      <footer className="rsv-foot pair">
        <button type="button" className="btn btn-ghost" onClick={onAnother}>
          {t("roomPage.okAnother")}
        </button>
        <button type="button" className="btn btn-primary" onClick={onShow}>
          {t("roomPage.okShow")}
          <ArrowRight className="i i-arrow" aria-hidden />
        </button>
      </footer>
    </div>
  );
}

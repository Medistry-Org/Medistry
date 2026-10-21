"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { bookConsultation, getSlots, type Appointment, type SlotDay } from "./api";
import { Segmented, short } from "./bits";
import a from "./Account.module.css";
import b from "./Booking.module.css";

const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
export const longFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });

/** 6:30 pm, the way it is said, never 06:30 PM. */
export const time = (d: Date) => timeFmt.format(d).replace(/\s?([ap])\.?m\.?/i, "\u00a0$1m").toLowerCase();
/** 6:30 on a time chip: the Morning, Afternoon and Evening labels above it already say am or pm. */
const clock = (d: Date) => time(d).replace(/\u00a0[ap]m$/, "");

function dayName(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tmr = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tmr.toDateString()) return "Tomorrow";
  return dayFmt.format(d);
}

/** "tomorrow", or "Thursday 3 Oct" */
export function when(d: Date) {
  const n = dayName(d.toISOString());
  if (n === "Today" || n === "Tomorrow") return n.toLowerCase();
  return `${new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(d)} ${short(d.toISOString())}`;
}

const PARTS = [
  { name: "Morning", test: (h: number) => h < 12 },
  { name: "Afternoon", test: (h: number) => h >= 12 && h < 17 },
  { name: "Evening", test: (h: number) => h >= 17 },
];

const DAY = 864e5;
/** "19 Oct", spelled the same in every browser */
const dm = (d: Date) => short(d.toISOString());
const fullFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });

/** Midnight on the Monday of the week a date falls in. */
function mondayOf(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/**
 * "This week", "Next week", or "Week of 19 Oct" further out (moving a later follow-up). Sunday is
 * closed, so on a Sunday "this week" is the one starting tomorrow.
 */
function weekName(monday: Date) {
  const n = Math.round((monday.getTime() - mondayOf(new Date(Date.now() + DAY)).getTime()) / (7 * DAY));
  return n === 0 ? "This week" : n === 1 ? "Next week" : `Week of ${dm(monday)}`;
}

type Week = { monday: Date; name: string; range: string; cols: ({ i: number; d: SlotDay } | { date: Date })[] };

/**
 * The open days, grouped into their weeks: at most two, Monday to Saturday, each day in its weekday's
 * column so the row reads like a calendar. Days already gone sit faded in their place.
 */
function weeksOf(days: SlotDay[]): Week[] {
  const map = new Map<number, Week>();
  days.forEach((d, i) => {
    const monday = mondayOf(new Date(d.date));
    const key = monday.getTime();
    if (!map.has(key)) {
      if (map.size === 2) return;
      const sat = new Date(key + 5 * DAY);
      map.set(key, {
        monday,
        name: weekName(monday),
        range: `${monday.getMonth() === sat.getMonth() ? monday.getDate() : dm(monday)} to ${dm(sat)}`,
        cols: Array.from({ length: 6 }, (_, c) => ({ date: new Date(key + c * DAY) })),
      });
    }
    const col = (new Date(d.date).getDay() + 6) % 7;
    if (col < 6) map.get(key)!.cols[col] = { i, d };
  });
  return [...map.values()];
}

/** Choose a week, a day, then a time: the 30-minute first consultation, or moving a follow-up. */
export default function Booking({
  current,
  onBooked,
  cta = "Book",
  book: submit = bookConsultation,
  around,
  onElsewhere,
}: {
  /** a booked visit to offer times around, when moving it */
  around?: string;
  current?: Appointment | null;
  onBooked: (a: Appointment) => void;
  cta?: string;
  /** what confirming does: book the first consultation by default, or move a follow-up */
  book?: (at: string) => Promise<{ success: boolean; message: string; data: Appointment | null }>;
  /** onboarding only: the quiet way out for someone who booked by phone or WhatsApp */
  onElsewhere?: () => Promise<void> | void;
}) {
  const [days, setDays] = useState<SlotDay[] | null>(null);
  const [day, setDay] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getSlots(around).then((r) => {
      if (!live || !r.success) return;
      setDays(r.data);
      // open on the booked day when moving a visit, otherwise the first day with a free time
      const booked = current ? r.data.findIndex((d) => new Date(d.date).toDateString() === new Date(current.scheduled_at).toDateString()) : -1;
      const first = r.data.findIndex((d) => d.slots.some((s) => s.open));
      setDay(booked >= 0 ? booked : Math.max(0, first));
    });
    return () => {
      live = false;
    };
  }, [around, current]);

  const weeks = useMemo(() => (days ? weeksOf(days) : []), [days]);
  const wk = Math.max(
    0,
    weeks.findIndex((w) => w.cols.some((c) => "i" in c && c.i === day)),
  );

  const groups = useMemo(() => {
    if (!days?.[day]) return [];
    // only times that can be chosen, plus the one being moved; taken times are noise
    const mineAt = current ? new Date(current.scheduled_at).getTime() : 0;
    return PARTS.map((p) => ({ name: p.name, slots: days[day].slots.filter((s) => (s.open || new Date(s.at).getTime() === mineAt) && p.test(new Date(s.at).getHours())) })).filter((g) => g.slots.length);
  }, [days, day, current]);

  const choose = (i: number) => {
    setDay(i);
    setPick(null);
  };

  // a new week opens on its first day with a free time
  const openWeek = (w: Week) => {
    const firstOpen = w.cols.find((c) => "i" in c && c.d.slots.some((s) => s.open));
    if (firstOpen && "i" in firstOpen) choose(firstOpen.i);
  };

  const book = async () => {
    if (!pick || busy) return;
    setBusy(true);
    setErr(null);
    const r = await submit(pick);
    setBusy(false);
    if (r.success && r.data) onBooked(r.data);
    else {
      setErr(r.message);
      setPick(null);
    }
  };

  const chosen = pick ? new Date(pick) : null;

  // the quiet way out: right under Book on a phone, outside the docked action so only it can
  // fall below the fold; under the days on a laptop (CSS shows one of the two)
  const elsewhere = (where: string) =>
    onElsewhere && (
      <button
        type="button"
        className={`${a.link} ${b.elsewhere} ${where}`}
        disabled={leaving}
        aria-busy={leaving}
        onClick={async () => {
          setLeaving(true);
          await onElsewhere();
        }}
      >
        I booked by phone with Medistry
      </button>
    );

  return (
    <div className={b.frame}>
      <div className={b.wrap}>
        <div className={b.when}>
          {weeks.length > 1 && (
            <div className={b.weeks}>
              <Segmented
                label="Week"
                value={String(wk)}
                options={weeks.map((w, i) => ({
                  v: String(i),
                  label: (
                    <span className={b.week}>
                      <span className={b.weekName}>{w.name}</span>
                      <span className={`${b.weekRange} num`}>{w.range}</span>
                    </span>
                  ),
                }))}
                onChange={(v) => Number(v) !== wk && openWeek(weeks[Number(v)])}
              />
            </div>
          )}
          {weeks.length === 1 && (
            <p className={b.weekSolo}>
              {weeks[0].name} <span className="num">{weeks[0].range}</span>
            </p>
          )}

          <div className={b.days} role="radiogroup" aria-label={weeks[wk] ? `Day, ${weeks[wk].name}` : "Day"} aria-busy={!days} key={wk}>
            {days && weeks[wk]
              ? weeks[wk].cols.map((c, n) => {
                  if (!("i" in c))
                    return (
                      <span key={n} className={`${b.day} ${b.past}`} aria-hidden="true">
                        <span className={b.dayName}>{dayFmt.format(c.date)}</span>
                        <span className={`${b.dayNum} num`}>{dateFmt.format(c.date)}</span>
                      </span>
                    );
                  const date = new Date(c.d.date);
                  const open = c.d.slots.filter((s) => s.open).length;
                  return (
                    <button
                      key={c.d.date}
                      type="button"
                      role="radio"
                      aria-checked={c.i === day}
                      aria-label={`${fullFmt.format(date)}${open ? "" : ", full"}`}
                      className={b.day}
                      disabled={!open}
                      onClick={() => choose(c.i)}
                    >
                      <span className={b.dayName}>{dayName(c.d.date) === "Today" ? "Today" : dayFmt.format(date)}</span>
                      <span className={`${b.dayNum} num`}>{dateFmt.format(date)}</span>
                      {!open && <span className={b.dayOpen}>Full</span>}
                    </button>
                  );
                })
              : Array.from({ length: 6 }, (_, i) => <span key={i} className={`${b.day} ${b.ghost}`} />)}
          </div>
          {elsewhere(b.atWhen)}
        </div>

        <div className={b.pickTime}>
          <div className={b.times} key={day}>
            {days && days[day] && <p className={b.dayFull}>{fullFmt.format(new Date(days[day].date))}</p>}
            {days
              ? groups.map((g) => (
                  <fieldset key={g.name} className={b.group}>
                    <legend className={b.part}>{g.name}</legend>
                    <div className={b.grid}>
                      {g.slots.map((s) => {
                        const mine = !!current && new Date(current.scheduled_at).getTime() === new Date(s.at).getTime();
                        return (
                          <button
                            key={s.at}
                            type="button"
                            className={b.slot}
                            data-current={mine}
                            disabled={mine || !s.open}
                            aria-pressed={pick === s.at}
                            aria-label={`${time(new Date(s.at))}${mine ? ", your current time" : s.open ? "" : ", taken"}`}
                            onClick={() => setPick(s.at)}
                          >
                            <span className="num">{clock(new Date(s.at))}</span>
                            {mine && <span className={b.mine}>Current</span>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))
              : null}
            {/* a narrow phone: the current time is only outlined in the grid, and this names the outline */}
            {days && current && groups.some((g) => g.slots.some((s) => new Date(s.at).getTime() === new Date(current.scheduled_at).getTime())) && (
              <p className={b.currentKey}>
                <i aria-hidden="true" />
                Your current time
              </p>
            )}
            {days
              ? null
              : Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className={b.group}>
                    <span className={`${b.part} ${b.ghostLine}`} />
                    <div className={b.grid}>
                      {Array.from({ length: 8 }, (_, j) => (
                        <span key={j} className={`${b.slot} ${b.ghost}`} />
                      ))}
                    </div>
                  </div>
                ))}
          </div>

          {err && (
            <p className={a.err} role="alert">
              <WarningCircle size={16} />
              {err}
            </p>
          )}

          <div className={b.confirm}>
            <button type="button" className={`btn ${a.go}`} disabled={!pick} onClick={book} data-busy={busy} aria-busy={busy}>
              <span>
                {busy
                  ? "Booking"
                  : chosen
                    ? `${cta} ${when(chosen)}, ${time(chosen)}`
                    : "Choose a time"}
              </span>
              <span className="well" aria-hidden="true">
                {busy ? <i className={a.spin} /> : <ArrowRight size={18} />}
              </span>
            </button>
            <p className={`${a.hint} ${b.note}`} data-quiet={!!onElsewhere}>
              {current ? "Your current booking is released when you choose a new time. " : ""}Times are India time (IST).
            </p>
          </div>
        </div>
      </div>
      {elsewhere(b.atEnd)}
    </div>
  );
}

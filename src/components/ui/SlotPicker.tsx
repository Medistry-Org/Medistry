"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { clockTime, relativeDayName, shortDate, weekdayDayMonth } from "@/lib/format/dateTime";
import { errorMessage } from "@/lib/http/apiClient";
import SegmentedControl from "./SegmentedControl";
import formStyles from "./styles/FormControls.module.css";
import styles from "./SlotPicker.module.css";

/** One bookable time. `id` is whatever the backend needs to book it (Medistry: SlotId). */
export type PickableSlot = { id: string; at: string; open: boolean };

const DAY_MS = 864e5;
const SUNDAY_ONLY = [0];
/** Pass as closedWeekdays when every day is bookable (home lab collection). */
export const NO_CLOSED_DAYS: number[] = [];
const dayFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric" });

const DAY_PARTS = [
  { name: "Morning", contains: (hour: number) => hour < 12 },
  { name: "Afternoon", contains: (hour: number) => hour >= 12 && hour < 17 },
  { name: "Evening", contains: (hour: number) => hour >= 17 },
];

/** "6:30" on a time chip: the Morning/Afternoon/Evening label above it already says am or pm. */
const chipTime = (d: Date) => clockTime(d).replace(/ [ap]m$/, "");

/** "tomorrow", or "Thursday 3 Oct" */
export function spokenDay(d: Date) {
  const name = relativeDayName(d.toISOString());
  if (name === "Today" || name === "Tomorrow") return name.toLowerCase();
  return `${new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(d)} ${shortDate(d.toISOString())}`;
}

function mondayOf(d: Date) {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

/** The next `count` open days from today (closedWeekdays: 0 = Sunday). */
function upcomingOpenDays(count: number, closedWeekdays: number[]) {
  const today = new Date();
  const days: Date[] = [];
  for (let i = 0; days.length < count && i < count * 2; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (!closedWeekdays.includes(day.getDay())) days.push(day);
  }
  return days;
}

type Week = { name: string; range: string; days: (Date | null)[] };

/** The open days in Monday-to-Saturday rows, so the row reads like a calendar. */
function groupIntoWeeks(days: Date[]): Week[] {
  const weeks = new Map<number, Week>();
  const thisMonday = mondayOf(new Date(Date.now() + DAY_MS)).getTime();
  days.forEach((day) => {
    const monday = mondayOf(day);
    const key = monday.getTime();
    if (!weeks.has(key)) {
      const saturday = new Date(key + 5 * DAY_MS);
      const offset = Math.round((key - thisMonday) / (7 * DAY_MS));
      weeks.set(key, {
        name: offset === 0 ? "This week" : offset === 1 ? "Next week" : `Week of ${shortDate(monday.toISOString())}`,
        range: `${monday.getMonth() === saturday.getMonth() ? monday.getDate() : shortDate(monday.toISOString())} to ${shortDate(saturday.toISOString())}`,
        days: Array.from({ length: 6 }, () => null),
      });
    }
    weeks.get(key)!.days[(day.getDay() + 6) % 7] = day;
  });
  return [...weeks.values()];
}

/**
 * Choose a week, a day, then a time; then confirm. Data-agnostic: the page passes `loadSlots`
 * (one day at a time, as Medistry's /api/schedule/slots works) and `onConfirm` (the booking call).
 * Used by patient booking, onboarding and the doctor's reschedule.
 */
export default function SlotPicker({
  loadSlots,
  onConfirm,
  confirmLabel = "Book",
  dayCount = 12,
  closedWeekdays = SUNDAY_ONLY,
  note = "Times are India time (IST).",
}: {
  loadSlots: (day: Date) => Promise<PickableSlot[]>;
  onConfirm: (slot: PickableSlot) => Promise<void>;
  confirmLabel?: string;
  dayCount?: number;
  /** Weekdays with no bookings. Consultations close on Sunday; home lab collection runs daily (pass []). */
  closedWeekdays?: number[];
  note?: string;
}) {
  const days = useMemo(() => upcomingOpenDays(dayCount, closedWeekdays), [dayCount, closedWeekdays]);
  const weeks = useMemo(() => groupIntoWeeks(days), [days]);
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [loaded, setLoaded] = useState<{ day: string; slots: PickableSlot[] } | null>(null);
  const [picked, setPicked] = useState<PickableSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedKey = selectedDay.toDateString();
  const slots = loaded?.day === selectedKey ? loaded.slots : null;

  // pages must pass a stable loadSlots (useCallback), or this reloads on every render
  useEffect(() => {
    let live = true;
    loadSlots(selectedDay)
      .then((result) => live && setLoaded({ day: selectedKey, slots: result }))
      .catch((caught) => {
        if (!live) return;
        setLoaded({ day: selectedKey, slots: [] });
        setError(errorMessage(caught));
      });
    return () => {
      live = false;
    };
  }, [selectedDay, selectedKey, loadSlots]);

  const chooseDay = (day: Date) => {
    setSelectedDay(day);
    setPicked(null);
    setError(null);
  };

  const weekIndex = Math.max(
    0,
    weeks.findIndex((week) => week.days.some((d) => d?.toDateString() === selectedDay.toDateString())),
  );

  const groups = useMemo(
    () =>
      DAY_PARTS.map((part) => ({ name: part.name, slots: (slots ?? []).filter((s) => s.open && part.contains(new Date(s.at).getHours())) })).filter(
        (group) => group.slots.length,
      ),
    [slots],
  );

  const confirm = async () => {
    if (!picked || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(picked);
    } catch (caught) {
      setError(errorMessage(caught));
      setPicked(null);
    } finally {
      setBusy(false);
    }
  };

  const chosenAt = picked ? new Date(picked.at) : null;

  return (
    <div className={styles.frame}>
      <div className={styles.wrap}>
        <div className={styles.when}>
          {weeks.length > 1 ? (
            <div className={styles.weeks}>
              <SegmentedControl
                label="Week"
                value={String(weekIndex)}
                options={weeks.map((week, i) => ({
                  value: String(i),
                  label: (
                    <span className={styles.week}>
                      <span className={styles.weekName}>{week.name}</span>
                      <span className={`${styles.weekRange} num`}>{week.range}</span>
                    </span>
                  ),
                }))}
                onChange={(v) => {
                  const first = weeks[Number(v)].days.find(Boolean);
                  if (first) chooseDay(first);
                }}
              />
            </div>
          ) : (
            <p className={styles.weekSolo}>
              {weeks[0].name} <span className="num">{weeks[0].range}</span>
            </p>
          )}

          <div className={styles.days} role="radiogroup" aria-label={`Day, ${weeks[weekIndex].name}`} key={weekIndex}>
            {weeks[weekIndex].days.map((day, column) =>
              day ? (
                <button
                  key={day.toISOString()}
                  type="button"
                  role="radio"
                  aria-checked={day.toDateString() === selectedDay.toDateString()}
                  aria-label={weekdayDayMonth.format(day)}
                  className={styles.day}
                  onClick={() => chooseDay(day)}
                >
                  <span className={styles.dayName}>{relativeDayName(day.toISOString()) === "Today" ? "Today" : dayFormat.format(day)}</span>
                  <span className={`${styles.dayNum} num`}>{dateFormat.format(day)}</span>
                </button>
              ) : (
                <span key={column} className={`${styles.day} ${styles.past}`} aria-hidden="true" />
              ),
            )}
          </div>
        </div>

        <div className={styles.pickTime}>
          <div className={styles.times} key={selectedDay.toISOString()}>
            <p className={styles.dayFull}>{weekdayDayMonth.format(selectedDay)}</p>
            {slots === null &&
              Array.from({ length: 2 }, (_, i) => (
                <div key={i} className={styles.group}>
                  <span className={`${styles.part} ${styles.ghostLine}`} />
                  <div className={styles.grid}>
                    {Array.from({ length: 8 }, (_, j) => (
                      <span key={j} className={`${styles.slot} ${styles.ghost}`} />
                    ))}
                  </div>
                </div>
              ))}
            {slots !== null && groups.length === 0 && <p className={formStyles.hint}>No open times on this day. Try another day.</p>}
            {groups.map((group) => (
              <fieldset key={group.name} className={styles.group}>
                <legend className={styles.part}>{group.name}</legend>
                <div className={styles.grid}>
                  {group.slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      className={styles.slot}
                      aria-pressed={picked?.id === slot.id}
                      aria-label={clockTime(new Date(slot.at))}
                      onClick={() => setPicked(slot)}
                    >
                      <span className="num">{chipTime(new Date(slot.at))}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {error && (
            <p className={formStyles.err} role="alert">
              <WarningCircle size={16} />
              {error}
            </p>
          )}

          <div className={styles.confirm}>
            <button type="button" className={`btn ${formStyles.go}`} disabled={!picked} onClick={confirm} data-busy={busy} aria-busy={busy}>
              <span>{busy ? "Booking" : chosenAt ? `${confirmLabel} ${spokenDay(chosenAt)}, ${clockTime(chosenAt)}` : "Choose a time"}</span>
              <span className="well" aria-hidden="true">
                {busy ? <i className={formStyles.spin} /> : <ArrowRight size={18} />}
              </span>
            </button>
            <p className={`${formStyles.hint} ${styles.note}`}>{note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

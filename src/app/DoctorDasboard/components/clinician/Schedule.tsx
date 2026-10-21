"use client";

import { useMemo, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { short, weekday } from "../account/bits";
import { diary, findPatient, type Patient } from "./data";
import { ApptRow } from "./Today";
import c from "./Clinic.module.css";

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The month at a glance: how full each day is, and the day's list beside it. */
export default function Schedule({ patients }: { patients: Patient[] }) {
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState(() => new Date().toDateString());
  const appts = useMemo(() => diary(patients, offset), [patients, offset]);
  const first = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth() + offset, 1);
  }, [offset]);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const todayStr = useMemo(() => new Date().toDateString(), []);
  const byDay = useMemo(() => {
    const m = new Map<string, typeof appts>();
    for (const a of appts) {
      const k = new Date(a.at).toDateString();
      m.set(k, [...(m.get(k) ?? []), a]);
    }
    return m;
  }, [appts]);
  const list = byDay.get(picked) ?? [];
  const total = appts.length;
  const firstVisits = appts.filter((a) => a.type === "FIRST_CONSULTATION").length;
  const underCare = patients.filter((p) => p.since).length;

  const go = (n: number) => {
    setOffset((o) => o + n);
    const t = new Date();
    const f = new Date(t.getFullYear(), t.getMonth() + offset + n, 1);
    // land on the first open day of the month, never a closed Sunday
    if (offset + n === 0) setPicked(t.toDateString());
    else {
      while (f.getDay() === 0) f.setDate(f.getDate() + 1);
      setPicked(f.toDateString());
    }
  };

  return (
    <main className={c.page}>
      <div className={c.hello}>
        <h1 className={c.h1}>Schedule</h1>
        <p className={c.sub}>
          <span className="num">{total}</span> consultations in {monthFmt.format(first).split(" ")[0]}: <span className="num">{total - firstVisits}</span> follow-ups with the <span className="num">{underCare}</span> people under your care, and <span className="num">{firstVisits}</span> first consultations.
        </p>
      </div>

      <div className={c.schedGrid}>
        <section className={c.panel} aria-label="Month">
          <div className={c.monthHead}>
            <h2 className={c.h2}>{monthFmt.format(first)}</h2>
            <div className={c.monthNav}>
              <button type="button" className={c.iconBtn} onClick={() => go(-1)} aria-label="Previous month">
                <CaretLeft size={16} />
              </button>
              {offset !== 0 && (
                <button type="button" className={c.textBtn} onClick={() => go(-offset)}>
                  Today
                </button>
              )}
              <button type="button" className={c.iconBtn} onClick={() => go(1)} aria-label="Next month">
                <CaretRight size={16} />
              </button>
            </div>
          </div>
          <div className={c.cal} aria-label={monthFmt.format(first)}>
            {WEEK.map((w) => (
              <span key={w} className={c.calHead} aria-hidden="true">
                {w}
              </span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <span key={`l${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = new Date(first.getFullYear(), first.getMonth(), i + 1);
              const k = date.toDateString();
              const n = byDay.get(k)?.length ?? 0;
              const off = date.getDay() === 0;
              return (
                <button
                  key={k}
                  type="button"
                  className={c.calDay}
                  aria-pressed={k === picked}
                  data-today={k === todayStr}
                  data-off={off}
                  data-past={date.getTime() < new Date(todayStr).getTime()}
                  onClick={() => setPicked(k)}
                  aria-label={`${dayFmt.format(date)}, ${off ? "closed" : `${n} consultations`}`}
                >
                  <span className={`${c.calNum} num`}>{i + 1}</span>
                  {!off && n > 0 && (
                    <span className={`${c.calCount} num`}>
                      {n}
                      <span className={c.calWord}> booked</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className={c.legend}>Sundays closed.</p>
        </section>

        <section className={c.panel} aria-labelledby="sd-h">
          <div className={c.panelHead}>
            <h2 id="sd-h" className={c.h2}>
              {k2label(picked, todayStr)}
            </h2>
            <span className={`${c.count} num`}>{list.length}</span>
          </div>
          {list.length ? (
            <ol className={c.appts}>
              {list.map((a) => (
                <li key={a.id}>
                  <ApptRow a={a} patient={findPatient(patients, a.patient_id)} from="schedule" />
                </li>
              ))}
            </ol>
          ) : (
            <p className={c.empty}>No consultations on this day.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function k2label(k: string, today: string) {
  // the date, always, so this panel never reads as the Today page
  return `${k === today ? "Today, " : ""}${weekday(new Date(k).toISOString())} ${short(new Date(k).toISOString())}`;
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { Avatar, short } from "../account/bits";
import { bmi, careWeek, diary, queue, type Patient } from "./data";
import { useOpenMessages } from "./inbox";
import { useNotes } from "./notes-store";
import { flagWord } from "./Today";
import c from "./Clinic.module.css";

const FILTERS = [
  "All",
  "Waiting on you",
  "Diabetes",
  "First consultation",
] as const;

/** Every patient under this doctor, searchable, with what matters at a glance. */
export default function Patients({ patients }: { patients: Patient[] }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const notes = useNotes();
  const messages = useOpenMessages();
  const [now] = useState(() => Date.now());
  // what each patient is waiting on, in words: Today's queue, its most pressing item
  const waiting = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of queue(patients, notes ?? [], now, messages))
      if (!m.has(i.patient.id)) m.set(i.patient.id, flagWord(i));
    return m;
  }, [patients, notes, now, messages]);
  const underCare = patients.filter((p) => p.since).length;
  const newcomers = patients.length - underCare;
  const next = useMemo(() => {
    const m = new Map<string, string>();
    // the diary marks what has not started yet as booked, so no clock is needed here
    for (const a of [...diary(patients), ...diary(patients, 1)])
      if (a.patient_id && a.status === "BOOKED" && !m.has(a.patient_id))
        m.set(a.patient_id, a.at);
    return m;
  }, [patients]);

  const shown = patients.filter((p) => {
    if (
      q &&
      !`${p.name} ${p.city} ${p.conditions.join(" ")}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false;
    if (f === "Waiting on you") return waiting.has(p.id);
    if (f === "Diabetes")
      return p.conditions.some((x) => /^type 2 diabetes$/i.test(x));
    if (f === "First consultation") return !p.since;
    return true;
  });

  return (
    <main className={c.page}>
      <div className={c.hello}>
        <h1 className={c.h1}>Patients</h1>
        <p className={c.sub}>
          <span className="num">{underCare}</span> under your care
          {newcomers ? (
            <>
              {" "}
              and <span className="num">{newcomers}</span> new
            </>
          ) : null}
          . <span className="num">{waiting.size}</span> with something waiting
          on you.
        </p>
      </div>

      <div className={c.tools}>
        <label className={c.search}>
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="sr-only">Search patients</span>
          <input
            type="search"
            placeholder="Name, city or condition"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className={c.filters} role="radiogroup" aria-label="Filter">
          {FILTERS.map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={f === x}
              className={c.filter}
              onClick={() => setF(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <section className={c.panel} aria-label="Patient list">
        <div className={c.listHead} aria-hidden="true">
          <span>Patient</span>
          <span>Programme</span>
          <span>BMI</span>
          <span>HbA1c</span>
          <span>Next visit</span>
          <span />
        </div>
        <ul className={c.plist}>
          {shown.map((p) => {
            const h = p.hba1c.at(-1);
            const n = next.get(p.id);
            const wk = careWeek(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/DoctorDasboard/clinician/patients/${p.id}`}
                  className={c.prow}
                >
                  <span className={c.pwho}>
                    <Avatar name={p.name} size={40} />
                    <span>
                      <strong>{p.name}</strong>
                      <span className="num">
                        {p.age} {p.sex === "Female" ? "F" : "M"}, {p.city}
                      </span>
                      <span className={c.pnext}>
                        {waiting.has(p.id) && (
                          <em
                            className={c.waitText}
                            data-kind={
                              /symptom|urgent/i.test(waiting.get(p.id) ?? "")
                                ? "symptom"
                                : "task"
                            }
                          >
                            {waiting.get(p.id)}
                          </em>
                        )}
                        <span className="num">
                          {n ? `Next ${short(n)}` : "No visit booked"}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className={c.pcell} data-label="Programme">
                    {p.programme}
                    {wk && <span className={`${c.pmuted} num`}>Week {wk}</span>}
                  </span>
                  <span className={`${c.pcell} num`} data-label="BMI">
                    {bmi(p) ?? "Not recorded"}
                  </span>
                  <span className={`${c.pcell} num`} data-label="HbA1c">
                    {h ? `${h.value}%` : "Not tested"}
                    {h && <span className={c.pmuted}>{short(h.at)}</span>}
                  </span>
                  <span className={`${c.pcell} num`} data-label="Next visit">
                    {n ? short(n) : "Not booked"}
                  </span>
                  <CaretRight size={16} className={c.chev} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
        {!shown.length && (
          <p className={c.empty}>
            No patients match. Clear the search or choose All.
          </p>
        )}
      </section>
    </main>
  );
}

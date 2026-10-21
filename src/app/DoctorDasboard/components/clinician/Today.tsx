"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CaretRight,
  ChatsCircle,
  Flask,
  Notepad,
  Prescription,
  WarningCircle,
} from "@phosphor-icons/react";
import ContourField from "../ContourField";
import { time } from "../account/Booking";
import { short } from "../account/bits";
import d from "../account/Dashboard.module.css";
import {
  ago,
  byPatient,
  CALLS,
  diary,
  findPatient,
  itemHref,
  queue,
  sinceLast,
  type Appt,
  type Patient,
  type QueueItem,
} from "./data";
import { useClinicToast } from "./ClinicShell";
import { useOpenMessages } from "./inbox";
import { useNotes } from "./notes-store";
import c from "./Clinic.module.css";

const dayFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** A queue item as a short chip: what it is, never the whole sentence. */
const chip = (i: QueueItem) =>
  i.kind === "symptom"
    ? i.title
    : i.kind === "message"
      ? i.urgent
        ? "Urgent message"
        : i.title
      : i.kind === "lab"
        ? "Report to review"
        : i.kind === "note"
          ? "Note to sign"
          : i.title.replace("Prescription version ", "Prescription v");
/** The same, in a few words for the day list: a flagged symptom outranks a report or a draft. */
export const flagWord = (i: QueueItem) =>
  i.kind === "symptom"
    ? i.severity === "Severe"
      ? "Severe symptom"
      : "Symptom flagged"
    : i.kind === "message"
      ? i.urgent
        ? "Urgent message"
        : "Message for you"
      : i.kind === "lab"
        ? "Report to review"
        : i.kind === "note"
          ? "Note to sign"
          : "To sign";

function KindIcon({ i }: { i: QueueItem }) {
  if (i.kind === "lab") return <Flask size={18} />;
  if (i.kind === "rx") return <Prescription size={18} />;
  if (i.kind === "note") return <Notepad size={18} />;
  if (i.kind === "message")
    return i.urgent ? (
      <WarningCircle size={18} weight="fill" />
    ) : (
      <ChatsCircle size={18} />
    );
  return (
    <WarningCircle
      size={18}
      weight={i.severity === "Severe" ? "fill" : "regular"}
    />
  );
}

export function Status({ s }: { s: Appt["status"] }) {
  const label =
    s === "COMPLETED"
      ? "Done"
      : s === "IN_PROGRESS"
        ? "Now"
        : s === "NO_SHOW"
          ? "Did not join"
          : "Upcoming";
  return (
    <span className={c.status} data-s={s}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

export function ApptRow({
  a,
  patient,
  flag,
  from,
}: {
  a: Appt;
  patient?: Patient;
  flag?: string;
  from?: string;
}) {
  const inner = (
    <>
      <span className={`${c.apptTime} num`}>{time(new Date(a.at))}</span>
      <span className={c.apptWho}>
        <strong>{a.name}</strong>
        <span>
          {a.type === "FIRST_CONSULTATION" ? "First consultation" : "Follow-up"}
          {patient
            ? `, ${patient.age} ${patient.sex === "Female" ? "F" : "M"}`
            : ""}
        </span>
      </span>
      {a.status === "BOOKED" ? (
        flag ? (
          <span
            className={c.rowFlag}
            data-kind={/symptom|urgent/i.test(flag) ? "symptom" : "task"}
          >
            {flag}
          </span>
        ) : (
          <span />
        )
      ) : (
        <Status s={a.status} />
      )}
      {patient && (
        <CaretRight size={16} className={c.chev} aria-hidden="true" />
      )}
    </>
  );
  return patient ? (
    <Link
      href={`/clinician/patients/${patient.id}${from ? `?from=${from}` : ""}`}
      className={c.appt}
      data-s={a.status}
    >
      {inner}
    </Link>
  ) : (
    <div className={c.appt} data-s={a.status}>
      {inner}
    </div>
  );
}

/** Today: who is next, the day in order, and what is waiting on the doctor. */
export default function Today({ patients }: { patients: Patient[] }) {
  const toast = useClinicToast();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const today = useMemo(
    () =>
      diary(patients).filter(
        (a) => new Date(a.at).toDateString() === new Date(now).toDateString(),
      ),
    [patients, now],
  );
  const byId = (id: string | null) => findPatient(patients, id);
  // on a closed day (Sundays) or after the last call, the next working day's first patient leads instead
  const later = useMemo(
    () =>
      [...diary(patients), ...diary(patients, 1)]
        .filter(
          (a) =>
            a.status === "BOOKED" &&
            new Date(a.at).getTime() > now &&
            new Date(a.at).toDateString() !== new Date(now).toDateString(),
        )
        .sort((p, q) => p.at.localeCompare(q.at))[0],
    [patients, now],
  );
  const live =
    today.find((a) => a.status === "IN_PROGRESS") ??
    today.find((a) => a.status === "BOOKED");
  const next = live ?? (today.length === 0 ? later : undefined);
  const notToday = !!next && !live;
  const np = next ? byId(next.patient_id) : undefined;
  const notes = useNotes();
  const messages = useOpenMessages();
  const q = queue(patients, notes ?? [], now, messages);
  const groups = byPatient(q);
  // what each patient on today's list is waiting on, shown in their row
  const flags = new Map<string, string>();
  for (const i of q)
    if (!flags.has(i.patient.id)) flags.set(i.patient.id, flagWord(i));
  const since = np ? sinceLast(np) : null;
  const startAt = next ? new Date(next.at).getTime() - 10 * 6e4 : 0;
  const canStart = next ? now >= startAt : false;
  const done = today.filter((a) => a.status === "COMPLETED").length;
  const mins = next ? Math.round((new Date(next.at).getTime() - now) / 6e4) : 0;

  return (
    <main className={c.page}>
      <div className={c.hello}>
        <h1 className={c.h1}>Today</h1>
        <p className={c.sub}>
          {dayFmt.format(new Date(now))}.{" "}
          <span className="num">{today.length}</span> consultations,{" "}
          <span className="num">{done}</span> done,{" "}
          <span className="num">{q.length}</span> waiting on you.
        </p>
      </div>

      <div className={c.todayGrid} data-quiet={!next}>
        {/* when the day's consultations are done, the plate steps aside and the queue leads */}
        {next && (
          <section className={`${d.next} ${c.nextUp}`} aria-labelledby="nx-h">
            <ContourField
              className={d.field}
              density={9}
              lineAlpha={0.1}
              signalAlpha={0.34}
              seed={9}
              interactive={false}
            />
            {next ? (
              <>
                <p className={d.kicker}>
                  {next.status === "IN_PROGRESS"
                    ? "In progress"
                    : notToday
                      ? "Next working day"
                      : "Next"}
                  <span className={d.until}>
                    {next.status === "IN_PROGRESS"
                      ? "now"
                      : notToday
                        ? `${dayFmt.format(new Date(next.at))}, ${time(new Date(next.at))}`
                        : mins < 60
                          ? `in ${mins} min`
                          : `at ${time(new Date(next.at))}`}
                  </span>
                </p>
                <h2 id="nx-h" className={d.nextTitle}>
                  {next.name}
                  <span className={d.nextTime}>
                    {" "}
                    {next.type === "FIRST_CONSULTATION"
                      ? "first consultation"
                      : "follow-up"}
                  </span>
                </h2>
                <p className={c.reason}>{next.reason}</p>
                {np && (
                  <ul className={c.brief}>
                    <li>
                      <span>Allergies</span>
                      <strong
                        data-warn={
                          !np.allergies || !/^No known/i.test(np.allergies)
                        }
                      >
                        {np.allergies
                          ? /^No known/i.test(np.allergies)
                            ? "None known"
                            : np.allergies
                          : "Not recorded"}
                      </strong>
                    </li>
                    {since ? (
                      <>
                        <li>
                          <span>Weight since {short(since.at)}</span>
                          <strong className="num">
                            {since.weight === null
                              ? "No new reading"
                              : `${since.weight > 0 ? "+" : since.weight < 0 ? "−" : ""}${Math.abs(since.weight)} kg`}
                          </strong>
                        </li>
                        <li>
                          <span>On prescription</span>
                          <strong>
                            {(() => {
                              const rx = np.rx.find(
                                (r) => r.status === "SIGNED",
                              );
                              if (!rx) return "Nothing yet";
                              const main = rx.items[0];
                              return `${main.name.replace(/ \(.*\)/, "")} ${main.strength}${rx.items.length > 1 ? ` + ${rx.items.length - 1} more` : ""}`;
                            })()}
                          </strong>
                          {np.injections?.last_at && (
                            <em className={c.briefNote}>
                              Last injection {short(np.injections.last_at)}
                            </em>
                          )}
                        </li>
                        <li>
                          <span>New since then</span>
                          <strong
                            data-warn={
                              !!since.news &&
                              /flagged|Dizz|Severe/i.test(since.news)
                            }
                          >
                            {since.news ?? "Nothing new"}
                          </strong>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <span>From the check</span>
                          <strong className="num">
                            {np.weights.at(-1)?.kg} kg, {np.height_cm} cm
                          </strong>
                        </li>
                        <li>
                          <span>Conditions</span>
                          <strong>
                            {np.conditions.length
                              ? np.conditions.join(", ")
                              : "None reported"}
                          </strong>
                        </li>
                        <li>
                          <span>Identity</span>
                          <strong data-warn={!np.identity_verified}>
                            {np.identity_verified
                              ? "Verified"
                              : "Check at start"}
                          </strong>
                        </li>
                      </>
                    )}
                  </ul>
                )}
                <div className={d.nextActions}>
                  {canStart && np && CALLS.has(np.id) ? (
                    <a
                      href={`/consultation-preview?patient=${np.id}&as=doctor`}
                      className="btn btn--mint"
                    >
                      <span>Start consultation</span>
                      <span className="well" aria-hidden="true">
                        <ArrowRight size={18} />
                      </span>
                    </a>
                  ) : canStart ? (
                    <button
                      type="button"
                      className="btn btn--mint"
                      onClick={() =>
                        toast(`This starts the video call with ${next.name}`)
                      }
                    >
                      <span>Start consultation</span>
                      <span className="well" aria-hidden="true">
                        <ArrowRight size={18} />
                      </span>
                    </button>
                  ) : (
                    <span className={c.opensAt}>
                      Start opens at{" "}
                      <span className="num">{time(new Date(startAt))}</span>
                    </span>
                  )}
                  {np && (
                    <Link
                      href={`/DoctorDasboard/clinician/patients/${np.id}?from=today`}
                      className="btn btn--ghost-dark"
                    >
                      Open record
                    </Link>
                  )}
                </div>
              </>
            ) : null}
          </section>
        )}

        <section
          className={`${c.panel} ${c.queuePanel}`}
          aria-labelledby="rev-h"
        >
          <div className={c.panelHead}>
            <h2 id="rev-h" className={c.h2}>
              Waiting on you
            </h2>
            <span className={`${c.count} num`}>{q.length}</span>
          </div>
          {q.length ? (
            <ul className={c.queue}>
              {/* one row per patient: the most pressing item leads, the rest are chips */}
              {groups.map(({ patient, items, top }) => {
                const severe = items.some((i) => i.severity === "Severe");
                return (
                  <li
                    key={patient.id}
                    className={c.qItem}
                    data-kind={top.kind}
                    data-severity={top.severity}
                    data-urgent={top.urgent || undefined}
                  >
                    <span className={c.qIcon} aria-hidden="true">
                      <KindIcon i={top} />
                    </span>
                    <span className={c.qText}>
                      <span className={c.qLine}>
                        <Link
                          href={itemHref(top)}
                          className={c.qName}
                          title={`${top.title}: ${top.detail}`}
                        >
                          {patient.name}
                        </Link>
                        {severe && <span className={c.qSevere}>Severe</span>}
                        <span className={`${c.qWhen} num`}>
                          {ago(top.at, now)}
                        </span>
                      </span>
                      <span className={c.qChips}>
                        {items.map((i) => (
                          <Link
                            key={i.id}
                            href={itemHref(i)}
                            className={c.qChip}
                            data-kind={i.kind}
                            data-severity={i.severity}
                            data-urgent={i.urgent || undefined}
                          >
                            {chip(i)}
                          </Link>
                        ))}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={c.empty}>
              Nothing waiting. Flagged symptoms, messages for you, new reports,
              call notes and drafts to sign appear here.
            </p>
          )}
        </section>

        <section className={`${c.panel} ${c.dayList}`} aria-labelledby="day-h">
          <div className={c.panelHead}>
            <h2 id="day-h" className={c.h2}>
              The day
            </h2>
            <Link
              href="/DoctorDashboard/clinician/schedule"
              className={c.textLink}
            >
              Month <ArrowRight size={15} />
            </Link>
          </div>
          {today.length === 0 && (
            <p className={c.empty}>
              No consultations today.
              {later
                ? ` Next: ${later.name}, ${dayFmt.format(new Date(later.at))} at ${time(new Date(later.at))}.`
                : ""}
            </p>
          )}
          <ol className={c.appts}>
            {today.map((a) => (
              <li key={a.id}>
                <ApptRow
                  a={a}
                  patient={byId(a.patient_id)}
                  flag={a.patient_id ? flags.get(a.patient_id) : undefined}
                  from="today"
                />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

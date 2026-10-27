"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Certificate,
  CheckCircle,
  IdentificationBadge,
  Phone,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";
import { Avatar, Flag, longDate, short, WeightChart } from "../account/bits";
import { time } from "../account/Booking";
import {
  acknowledgeSymptom,
  unacknowledgeSymptom,
  addNote,
  bmi,
  CALLS,
  careWeek,
  COUNSELLOR,
  lcFirst,
  logPhotoView,
  logView,
  ME,
  sinceLast,
  reviewLab,
  signRx,
  type Lab,
  type Patient,
  type Screening,
  type Symptom,
} from "./data";
import { useClinicToast } from "./ClinicShell";
import { PhotosPanel, usePatientPhotos } from "./PhotosPanel";
import { useOpenMessages } from "./inbox";
import { toSign, useNotes } from "./notes-store";
import c from "./Clinic.module.css";
import nt from "./Notes.module.css";

/* every section, in the order they sit on the page; a first-consultation record has fewer */
const SECTIONS = [
  ["overview", "Overview"],
  ["first", "Before the call"],
  ["prescriptions", "Prescriptions"],
  ["plan", "Plan"],
  ["labs", "Labs"],
  ["trackers", "Trackers"],
  ["notes", "Notes"],
  ["photos", "Photos"],
  ["visits", "Visits"],
  ["activity", "Activity"],
] as const;
const FRESH_ONLY = new Set(["first"]);
const CARE_ONLY = new Set(["prescriptions", "plan", "labs", "visits"]);

/** Where the record was opened from, so the back link returns there. */
const ORIGINS: Record<
  string,
  { label: string; href: (pid: string) => string }
> = {
  today: { label: "Today", href: () => "/clinician" },
  schedule: { label: "Schedule", href: () => "/clinician/schedule" },
  messages: {
    label: "Messages",
    href: (pid) => `/clinician/messages?p=${pid}`,
  },
  notes: { label: "Notes", href: () => "/clinician/notes" },
};

/** The counsellor's screening call, as the doctor needs it before the first consultation: short and scannable. */
function ScreeningCard({ s }: { s: Screening }) {
  const cautions = s.check.length > 0;
  return (
    <div className={c.screen}>
      <div className={c.screenHead}>
        <span className={c.screenIcon} aria-hidden="true">
          <Phone size={16} />
        </span>
        <p>
          <strong>Counsellor&apos;s screening</strong>
          <span>
            {s.by}, {COUNSELLOR.role.toLowerCase()} · phone,{" "}
            <span className="num">{s.minutes}</span> min ·{" "}
            <span className="num">
              {short(s.at)}, {time(new Date(s.at))}
            </span>
          </span>
        </p>
        <span className={c.pill} data-tone={cautions ? "draft" : "ok"}>
          {cautions ? "Fit to proceed, with cautions" : "Fit to proceed"}
        </span>
      </div>
      <dl className={c.screenList}>
        <div>
          <dt>Goal</dt>
          <dd>{s.goal}</dd>
        </div>
        <div>
          <dt>Tried before</dt>
          <dd>{s.tried}</dd>
        </div>
        <div>
          <dt>Conditions and medicines mentioned</dt>
          <dd>{s.mentioned}</dd>
        </div>
        <div data-warn={cautions || undefined}>
          <dt>To check before prescribing</dt>
          <dd>
            {cautions
              ? s.check.join(". ")
              : "Nothing raised. Pregnancy plans, pancreatitis and gallbladder history were asked about."}
          </dd>
        </div>
      </dl>
      <p className={c.screenFoot}>
        What the patient told the counsellor, not yet confirmed by a doctor.
      </p>
    </div>
  );
}

/**
 * In range, above or below, in words. Red is kept for what is out of range and not getting
 * better, so an improving result does not shout like a worsening one.
 */
function Status({
  r,
  before,
  reviewed,
}: {
  r: { value: number; flag: "LOW" | "NORMAL" | "HIGH" };
  before?: number;
  reviewed?: boolean;
}) {
  const improving =
    before !== undefined &&
    ((r.flag === "HIGH" && r.value < before) ||
      (r.flag === "LOW" && r.value > before));
  if (r.flag === "NORMAL") return <Flag flag="NORMAL" />;
  return (
    // red only while it still needs the doctor; once reviewed, out of range reads in ink
    <span
      className={c.status2}
      data-tone={improving ? "better" : reviewed ? "seen" : "worse"}
    >
      <i aria-hidden="true" />
      {r.flag === "HIGH" ? "Above" : "Below"}
      {improving ? ", improving" : ""}
    </span>
  );
}

/** Results keep the precision of their reference range: creatinine 1.0, never 1. */
export const val = (v: number, range: string) =>
  /\d\.\d/.test(range) ? v.toFixed(1) : String(v);

const OUTCOMES = ["Called the patient", "Advised by message", "Booked a visit"];

/** A flagged symptom is closed by saying what was done about it. */
function Acknowledge({ p, s }: { p: Patient; s: Symptom }) {
  const toast = useClinicToast();
  return (
    <div
      className={c.outcomes}
      role="group"
      aria-label={`What did you do about the ${s.label.toLowerCase()}?`}
    >
      {OUTCOMES.map((o) => (
        <button
          key={o}
          type="button"
          className={c.outcome}
          onClick={() => {
            acknowledgeSymptom(p.id, s.id, o);
            toast(`Recorded: ${o.toLowerCase()}`, () =>
              unacknowledgeSymptom(p.id, s.id),
            );
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function LabCard({ p, l, older }: { p: Patient; l: Lab; older?: Lab }) {
  const toast = useClinicToast();
  const [comment, setComment] = useState("");
  // what is out of range leads; the rest is one tap away
  const out = l.results.filter((r) => r.flag !== "NORMAL");
  const [all, setAll] = useState(out.length === 0);
  const rows = all ? l.results : out;
  const before = (test: string) =>
    older?.results.find((r) => r.test === test)?.value;
  const pending = l.status === "DOCTOR_REVIEW_PENDING";
  // still at the lab: never called reviewed, and no empty table
  const waiting = l.status === "PROCESSING" || !l.results.length;
  return (
    <div className={c.lab} data-pending={pending}>
      <div className={c.labHead}>
        <div>
          <strong>{l.package}</strong>
          <span>
            Collected {short(l.collected)}
            {l.reported && `, reported ${short(l.reported)}`}, partner lab
          </span>
        </div>
        {waiting ? (
          <span className={c.pill} data-tone="pending">
            Awaiting results
          </span>
        ) : pending ? (
          <span className={c.pill} data-tone="warn">
            Needs your review
          </span>
        ) : (
          <span className={c.pill} data-tone="ok">
            <Certificate size={14} weight="fill" /> Reviewed{" "}
            {l.reviewed_at && short(l.reviewed_at)}
          </span>
        )}
      </div>
      {waiting ? (
        <p className={c.muted}>
          Sample collected {short(l.collected)}. Results come from the partner
          lab and appear here for your review.
        </p>
      ) : (
        <>
          <div className={c.tableWrap}>
            <table className={c.table}>
              <thead>
                <tr>
                  <th scope="col">Test</th>
                  <th scope="col">Result</th>
                  {older && <th scope="col">Before</th>}
                  <th scope="col" className={c.refCol}>
                    Reference
                  </th>
                  <th scope="col">
                    <span className="sr-only">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.test}>
                    <th scope="row">{r.test}</th>
                    <td className="num">
                      <strong>{val(r.value, r.range)}</strong> {r.unit}
                      <small className={c.refUnder}>{r.range}</small>
                    </td>
                    {older && (
                      <td className="num">
                        {before(r.test) !== undefined ? (
                          <span className={c.trend}>
                            {val(before(r.test)!, r.range)}
                            {before(r.test)! !== r.value &&
                              (r.value < before(r.test)! ? (
                                <ArrowDown size={13} aria-label="down" />
                              ) : (
                                <ArrowUp size={13} aria-label="up" />
                              ))}
                          </span>
                        ) : (
                          "Not tested"
                        )}
                      </td>
                    )}
                    <td className={`num ${c.refCol}`}>{r.range}</td>
                    <td>
                      <Status
                        r={r}
                        before={before(r.test)}
                        reviewed={l.status === "REVIEWED"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {out.length > 0 && out.length < l.results.length && (
            <button
              type="button"
              className={c.textLink}
              onClick={() => setAll((v) => !v)}
            >
              {all
                ? "Out of range only"
                : `Show all ${l.results.length} results`}
            </button>
          )}
        </>
      )}
      {pending && !waiting ? (
        <form
          className={c.reviewForm}
          onSubmit={(e) => {
            e.preventDefault();
            reviewLab(p.id, l.id, comment);
            toast("Report marked reviewed. The patient sees your note.");
          }}
        >
          <label className={c.label} htmlFor={`rv-${l.id}`}>
            Note for the patient{" "}
            <span className={c.muted}>shown with the report</span>
          </label>
          <textarea
            id={`rv-${l.id}`}
            className={c.textarea}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What these results mean for them, in plain words"
          />
          <button type="submit" className="btn" disabled={!comment.trim()}>
            <span>Mark reviewed</span>
            <span className="well" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </button>
        </form>
      ) : (
        l.comment && (
          <blockquote className={c.quote}>
            <p>{l.comment}</p>
            <cite>Your note to the patient</cite>
          </blockquote>
        )
      )}
    </div>
  );
}

/** One patient, everything a doctor needs before and during a consultation, safety first. */
export default function PatientRecord({
  p,
  next,
}: {
  p: Patient;
  next: string | null;
}) {
  const toast = useClinicToast();
  const [note, setNote] = useState("");
  const [showAllSym, setShowAllSym] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const latest = p.weights.at(-1);
  const first = p.weights[0];
  const h = p.hba1c.at(-1);
  const hPrev = p.hba1c.at(-2);
  const signed = p.rx.find((r) => r.status === "SIGNED");
  // a first-consultation record: one panel saying what to collect, never five empty ones
  const fresh = !p.labs.length && !p.plan && !p.rx.length && !p.visits.length;
  const draft = p.rx.find((r) => r.status === "DRAFT");
  const history = p.rx.filter((r) => r.status === "SUPERSEDED");
  const wk = careWeek(p);
  const b = bmi(p);
  const flagged = p.symptoms.filter(
    (s) => s.requires_review && !s.acknowledged,
  );
  const since = sinceLast(p);
  const notes = useNotes();
  const [now] = useState(() => Date.now());
  const noteIds = new Set(
    (notes ?? [])
      .filter((n) => n.pid === p.id && n.status === "SIGNED")
      .map((n) => n.id),
  );
  const unsigned = toSign(
    (notes ?? []).filter((n) => n.pid === p.id),
    now,
  )[0];
  const [from] = useState(
    () =>
      ORIGINS[new URLSearchParams(window.location.search).get("from") ?? ""],
  );
  const message = useOpenMessages().find((x) => x.pid === p.id);
  // Start is the main action only from ten minutes before the visit, as the patient's Join is
  const live =
    !!next &&
    now >= Date.parse(next) - 10 * 6e4 &&
    now < Date.parse(next) + 30 * 6e4;
  const startMain = live && !message;
  // photos only exist on the record while the patient shares them
  const photos = usePatientPhotos(p.id);
  const chips = SECTIONS.filter(
    ([id]) =>
      (fresh ? !CARE_ONLY.has(id) : !FRESH_ONLY.has(id)) &&
      (id !== "photos" || !!photos),
  );
  const [active, setActive] = useState<string>("overview");
  const picked = useRef<string | null>(null);
  // scroll-spy: the chip of the section under the bar lights up
  useEffect(() => {
    const ids = chips.map(([id]) => id);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // the line just under the sticky chips: a section counts once its top passes it
        const line =
          (document
            .querySelector("[data-chip]")
            ?.parentElement?.getBoundingClientRect().bottom ?? 120) + 120;
        let cur: string = ids[0];
        let last = -Infinity;
        for (const id of ids) {
          const top = document.getElementById(id)?.getBoundingClientRect().top;
          // two cards side by side share a top: the left one, first in the page, keeps the chip
          if (top !== undefined && top <= line && top > last + 1) {
            cur = id;
            last = top;
          }
        }
        // a chip just tapped wins over its neighbour in the same row
        const tapped = picked.current
          ? document.getElementById(picked.current)?.getBoundingClientRect().top
          : undefined;
        if (
          picked.current &&
          tapped !== undefined &&
          Math.abs(tapped - last) <= 1
        )
          cur = picked.current;
        // at the very bottom, the last section is the one being read
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4
        )
          cur = ids.at(-1)!;
        setActive(cur);
        // keep the lit chip in view in its own row; never scrollIntoView, which would move the page too
        const chip = document.querySelector<HTMLElement>(
          `[data-chip="${cur}"]`,
        );
        const bar = chip?.parentElement;
        if (
          chip &&
          bar &&
          (chip.offsetLeft < bar.scrollLeft ||
            chip.offsetLeft + chip.offsetWidth >
              bar.scrollLeft + bar.clientWidth)
        )
          bar.scrollTo({ left: chip.offsetLeft - 16, behavior: "smooth" });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [fresh]); // eslint-disable-line react-hooks/exhaustive-deps
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    logView(p.id);
  }, [p.id]);

  return (
    <main className={c.page}>
      <Link
        href={from ? from.href(p.id) : "/DoctorDasboard/clinician/patients"}
        className={c.back}
      >
        <ArrowLeft size={14} weight="bold" aria-hidden="true" />{" "}
        {from ? from.label : "Patients"}
      </Link>

      <header className={c.recHead}>
        <div className={c.recWho}>
          <Avatar name={p.name} size={64} />
          <div>
            <h1 className={c.recName}>{p.name}</h1>
            <p className={c.sub}>
              <span className="num">
                {p.age}, {p.sex}
              </span>
              , {p.city}. {p.programme}
              {wk ? `, week ${wk}` : ""}.
            </p>
            <p className={c.recIds}>
              <span className="num">{p.mobile}</span>
              <span>
                {next
                  ? `Next visit ${short(next)}, ${time(new Date(next))}`
                  : "No visit booked"}
              </span>
              <span
                className={c.pill}
                data-tone={p.identity_verified ? "ok" : "warn"}
              >
                <IdentificationBadge size={14} />{" "}
                {p.identity_verified
                  ? "Identity verified"
                  : "Verify identity at start"}
              </span>
            </p>
          </div>
        </div>
        <div className={c.recActions}>
          {/* one main action: an open message, else Start from ten minutes before the visit */}
          {message && p.since && (
            <Link
              href={`/DoctorDasboard/clinician/messages?p=${p.id}`}
              className="btn"
            >
              <span>{message.urgent ? "Urgent message" : "Messages"}</span>
              <span className="well" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </Link>
          )}
          {CALLS.has(p.id) ? (
            <a
              href={`/DoctorDasboard/consultation-preview?patient=${p.id}&as=doctor`}
              className={startMain ? "btn btn--mint" : "btn btn--ghost"}
            >
              <span>Start consultation</span>
              {startMain && (
                <span className="well" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              )}
            </a>
          ) : (
            next && (
              <button
                type="button"
                className={startMain ? "btn btn--mint" : "btn btn--ghost"}
                onClick={() =>
                  toast(`This starts the video call with ${p.name}`)
                }
              >
                <span>Start consultation</span>
                {startMain && (
                  <span className="well" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            )
          )}
          <a href="#notes" className="btn btn--ghost">
            Add a note
          </a>
          {p.since && !message && (
            <Link
              href={`/DoctorDasboard/clinician/messages?p=${p.id}`}
              className="btn btn--ghost"
            >
              Messages
            </Link>
          )}
        </div>
      </header>

      {/* safety, never folded away */}
      <section className={c.safety} aria-label="Safety">
        <div data-warn={!p.allergies || !/^No known/i.test(p.allergies)}>
          <span className={c.safetyLabel}>
            <Warning size={15} /> Allergies
          </span>
          <strong>
            {p.allergies ?? "Not recorded. Ask before prescribing."}
          </strong>
        </div>
        <div>
          <span className={c.safetyLabel}>On Medistry prescription</span>
          <strong>
            {signed
              ? signed.items
                  .map((i) => `${i.name.replace(/ \(.*\)/, "")} ${i.strength}`)
                  .join("; ")
              : "Nothing prescribed"}
          </strong>
          {p.injections?.last_at && (
            <em className={c.safetyNote}>
              Last injection {short(p.injections.last_at)}
              {p.injections.last_site ? `, ${p.injections.last_site}` : ""}
            </em>
          )}
        </div>
        <div>
          <span className={c.safetyLabel}>Conditions</span>
          <strong>
            {p.conditions.length ? p.conditions.join(", ") : "None reported"}
          </strong>
        </div>
        <div>
          <span className={c.safetyLabel}>Other medicines</span>
          <strong>
            {p.outside_meds === null
              ? "Not recorded"
              : p.outside_meds.length
                ? p.outside_meds.join("; ")
                : "None reported"}
          </strong>
        </div>
        {/* severe first, as in the queue */}
        {[...flagged]
          .sort(
            (a, b) =>
              (a.severity === "Severe" ? 0 : 1) -
              (b.severity === "Severe" ? 0 : 1),
          )
          .map((s, i) => (
            <div
              key={s.id}
              id={i === 0 ? "flagged" : undefined}
              data-warn="true"
              data-severity={s.severity}
              className={c.safetyWide}
            >
              <span className={c.safetyLabel}>
                <WarningCircle
                  size={15}
                  weight={s.severity === "Severe" ? "fill" : "regular"}
                />{" "}
                Flagged by the patient, {short(s.at)}, {time(new Date(s.at))}
                {s.severity === "Severe" && (
                  <span className={c.qSevere}>Severe</span>
                )}
              </span>
              <strong>
                {s.label}, {s.severity.toLowerCase()}.
                {s.note ? ` ${s.note}` : ""}
              </strong>
              <Acknowledge p={p} s={s} />
            </div>
          ))}
      </section>

      <nav className={c.recNav} aria-label="Record">
        {chips.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={c.recChip}
            data-chip={id}
            aria-current={active === id ? "location" : undefined}
            onClick={() => {
              picked.current = id;
              setActive(id);
            }}
          >
            {label}
            {id === "labs" &&
              p.labs.some((l) => l.status === "DOCTOR_REVIEW_PENDING") && (
                <i className={c.dotWait} aria-label="needs review" />
              )}
            {id === "prescriptions" && draft && (
              <i className={c.dotWait} aria-label="draft to sign" />
            )}
            {id === "trackers" && flagged.length > 0 && (
              <i
                className={c.dotWait}
                data-urgent="true"
                aria-label="flagged symptom"
              />
            )}
          </a>
        ))}
      </nav>

      <div className={c.recGrid}>
        <section
          id="overview"
          className={`${c.panel} ${c.full}`}
          aria-labelledby="ov-h"
        >
          <div className={c.panelHead}>
            <h2 id="ov-h" className={c.h2}>
              Overview
            </h2>
          </div>
          <p className={c.concern}>
            <span className={c.voice}>{p.concern}</span>
            <span className={c.voiceBy}>
              The patient, at their last check-in
            </span>
          </p>
          <div className={c.tiles}>
            <div className={c.tile}>
              <span>Weight</span>
              <strong className="num">
                {latest ? `${latest.kg} kg` : "Not recorded"}
              </strong>
              {latest && (
                <em>
                  {short(latest.at)}, {latest.source.toLowerCase()}
                </em>
              )}
            </div>
            {since && (
              <div className={c.tile}>
                <span>{`Since last visit, ${short(since.at)}`}</span>
                <strong className="num">
                  {since?.weight != null
                    ? `${since.weight > 0 ? "+" : since.weight < 0 ? "−" : ""}${Math.abs(since.weight)} kg`
                    : since
                      ? "No new reading"
                      : `${p.weights.length}`}
                </strong>
                <em>
                  {latest && first && p.weights.length > 1
                    ? `${latest.kg - first.kg > 0 ? "+" : "−"}${Math.abs(Math.round((latest.kg - first.kg) * 10) / 10)} kg since ${short(first.at)}`
                    : "From the free check"}
                </em>
              </div>
            )}
            <div className={c.tile}>
              <span>BMI</span>
              <strong className="num" data-empty={!b || undefined}>
                {b ?? "Not recorded"}
              </strong>
              <em>Height {p.height_cm} cm</em>
            </div>
            <div className={c.tile}>
              <span>Waist</span>
              <strong className="num" data-empty={!p.waist_cm || undefined}>
                {p.waist_cm ? `${p.waist_cm.cm} cm` : "Not recorded"}
              </strong>
              <em>
                {p.waist_cm
                  ? `${short(p.waist_cm.at)}, limit ${p.sex === "Female" ? 80 : 90} cm`
                  : "Ask to measure"}
              </em>
            </div>
            <div className={c.tile}>
              <span>HbA1c</span>
              <strong className="num">
                {h ? `${h.value}%` : "Not tested"}
              </strong>
              <em>
                {h
                  ? `${short(h.at)}${hPrev ? `, was ${hPrev.value}% on ${short(hPrev.at)}` : ""}`
                  : "Order with the next labs"}
              </em>
            </div>
          </div>
          {p.weights.length > 1 && (
            <WeightChart
              readings={p.weights.map((w) => ({ at: w.at, kg: w.kg }))}
              unit="kg"
              toUnit={(k) => k}
            />
          )}
        </section>
        {fresh && (
          <section
            id="first"
            className={`${c.panel} ${c.full}`}
            aria-labelledby="fc-h"
          >
            <div className={c.panelHead}>
              <h2 id="fc-h" className={c.h2}>
                Before the first consultation
              </h2>
            </div>
            {p.screening && <ScreeningCard s={p.screening} />}
            <p className={c.muted}>
              Nothing else is on record yet beyond the patient&apos;s answers.
              To collect on the call:
            </p>
            <ul className={c.collect}>
              <li>Allergies to medicines, and any reaction</li>
              <li>Medicines from other doctors</li>
              <li>Waist, measured at the navel</li>
              <li>A recent HbA1c or blood test report, if they have one</li>
            </ul>
          </section>
        )}

        {!fresh && (
          <section
            id="prescriptions"
            className={c.panel}
            aria-labelledby="rx-h"
          >
            <div className={c.panelHead}>
              <h2 id="rx-h" className={c.h2}>
                Prescriptions
              </h2>
              <button
                type="button"
                className={c.textLink}
                onClick={() =>
                  toast("A new draft opens from the current prescription")
                }
              >
                New draft <ArrowRight size={15} />
              </button>
            </div>
            {draft && (
              <div className={c.rx} data-draft="true">
                <div className={c.rxHead}>
                  <strong>Version {draft.version}</strong>
                  <span className={c.pill} data-tone="warn">
                    Draft, not visible to the patient
                  </span>
                </div>
                <ul className={c.rxItems}>
                  {draft.items.map((i) => (
                    <li key={i.name}>
                      <strong>
                        {i.name} {i.strength}
                      </strong>
                      <span>
                        {i.dose}, {lcFirst(i.frequency)}, for {i.duration}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={c.rxAdvice}>{draft.advice}</p>
                {confirm === draft.id ? (
                  <div className={c.confirm}>
                    <p>
                      Sign version {draft.version} as {ME.name}? The patient and
                      the pharmacy see it once signed.
                    </p>
                    <div>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          signRx(p.id, draft.id);
                          setConfirm(null);
                          toast(`Version ${draft.version} signed`);
                        }}
                      >
                        <span>Sign</span>
                        <span className="well" aria-hidden="true">
                          <CheckCircle size={18} />
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => setConfirm(null)}
                      >
                        Not yet
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setConfirm(draft.id)}
                  >
                    <span>Review and sign</span>
                    <span className="well" aria-hidden="true">
                      <ArrowRight size={18} />
                    </span>
                  </button>
                )}
              </div>
            )}
            {signed ? (
              <div className={c.rx}>
                <div className={c.rxHead}>
                  <strong>Version {signed.version}</strong>
                  <span className={c.pill} data-tone="ok">
                    Signed {short(signed.date)}
                  </span>
                </div>
                <ul className={c.rxItems}>
                  {signed.items.map((i) => (
                    <li key={i.name}>
                      <strong>
                        {i.name} {i.strength}
                      </strong>
                      <span>
                        {i.dose}, {lcFirst(i.frequency)}, for {i.duration}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={c.rxAdvice}>{signed.advice}</p>
              </div>
            ) : (
              !draft && (
                <p className={c.empty}>
                  No prescription. Medicine only if you judge it clinically
                  appropriate.
                </p>
              )
            )}
            {history.length > 0 && (
              <details className={c.history}>
                <summary>Earlier versions</summary>
                {history.map((r) => (
                  <p key={r.id}>
                    Version {r.version}, {short(r.date)}:{" "}
                    {r.items.map((i) => `${i.name} ${i.strength}`).join(", ")}
                  </p>
                ))}
              </details>
            )}
          </section>
        )}

        {!fresh && (
          <section id="plan" className={c.panel} aria-labelledby="pl-h">
            <div className={c.panelHead}>
              <h2 id="pl-h" className={c.h2}>
                Treatment plan
              </h2>
              <button
                type="button"
                className={c.textLink}
                onClick={() =>
                  toast("The plan opens as a new version; the old one is kept")
                }
              >
                Edit plan <ArrowRight size={15} />
              </button>
            </div>
            {p.plan ? (
              <>
                <p className={c.concern}>{p.plan.notes}</p>
                <div className={c.tiles}>
                  {p.plan.goals.map((g) => (
                    <div key={g.label} className={c.tile}>
                      <span>{g.label}</span>
                      <strong className="num">{g.value}</strong>
                    </div>
                  ))}
                </div>
                <p className={c.muted}>
                  Next plan review {longDate(p.plan.review)}
                </p>
              </>
            ) : (
              <p className={c.empty}>
                No plan yet. It is set after the first consultation and any
                tests.
              </p>
            )}
          </section>
        )}

        {!fresh && (
          <section
            id="labs"
            className={`${c.panel} ${c.full}`}
            aria-labelledby="lb-h"
          >
            <div className={c.panelHead}>
              <h2 id="lb-h" className={c.h2}>
                Labs
              </h2>
              <button
                type="button"
                className={c.textLink}
                onClick={() =>
                  toast("Order form opens with the partner lab's packages")
                }
              >
                Order tests <ArrowRight size={15} />
              </button>
            </div>
            {p.labs.length ? (
              p.labs.map((l, i) => (
                <LabCard key={l.id} p={p} l={l} older={p.labs[i + 1]} />
              ))
            ) : (
              <p className={c.empty}>
                No tests yet. Order a baseline panel after the first
                consultation.
              </p>
            )}
          </section>
        )}

        <section id="trackers" className={c.panel} aria-labelledby="tr-h">
          <div className={c.panelHead}>
            <h2 id="tr-h" className={c.h2}>
              Trackers
            </h2>
            <span className={c.muted}>Last 7 days, patient logged</span>
          </div>
          <div className={c.tiles}>
            {p.injections && (
              <div className={c.tile}>
                <span>
                  {p.injections.name} {p.injections.strength}, weekly
                </span>
                <strong className="num">
                  {p.injections.taken
                    ? `${Math.min(p.injections.taken, p.injections.per_step)} of ${p.injections.per_step} done`
                    : p.injections.due_today
                      ? "First one due today"
                      : "First one not logged"}
                </strong>
                <em>
                  {p.injections.last_at
                    ? `Last ${short(p.injections.last_at)}${p.injections.last_site ? `, ${p.injections.last_site}` : ""}`
                    : "Patient logs each injection and where it went"}
                </em>
              </div>
            )}
            <div className={c.tile}>
              <span>Daily tablets taken</span>
              <strong className="num" data-empty={!p.adherence || undefined}>
                {p.adherence
                  ? `${p.adherence.taken} of ${p.adherence.due}`
                  : "No tablets prescribed"}
              </strong>
              <em>Doses logged as taken</em>
            </div>
            <div className={c.tile}>
              <span>Weight readings</span>
              <strong
                className="num"
                data-empty={p.weights.length < 2 || undefined}
              >
                {p.weights.length > 1
                  ? `${p.weights.filter((w) => new Date(p.weights.at(-1)!.at).getTime() - new Date(w.at).getTime() < 14 * 864e5).length} in the last 2 weeks`
                  : "None yet"}
              </strong>
              <em>Logged by the patient</em>
            </div>
          </div>
          <p className={c.subHead}>Symptoms</p>
          {p.symptoms.length ? (
            <ul className={c.symptoms}>
              {/* flagged ones, then the latest; the rest are behind one tap */}
              {(showAllSym
                ? p.symptoms
                : p.symptoms.filter(
                    (s, i) => (s.requires_review && !s.acknowledged) || i === 0,
                  )
              ).map((s) => (
                <li key={s.id} data-flag={s.requires_review && !s.acknowledged}>
                  <div>
                    <strong>
                      {s.label}, {s.severity.toLowerCase()}
                    </strong>
                    <span>
                      {s.note || "No note"}. {short(s.at)},{" "}
                      {time(new Date(s.at))}
                    </span>
                  </div>
                  {s.requires_review && !s.acknowledged ? (
                    <Acknowledge p={p} s={s} />
                  ) : (
                    <span className={c.muted}>
                      {s.requires_review ? "Acknowledged" : "For information"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {p.symptoms.length > 1 && (
            <button
              type="button"
              className={c.textLink}
              onClick={() => setShowAllSym((v) => !v)}
            >
              {showAllSym ? "Show fewer" : `All ${p.symptoms.length} symptoms`}
            </button>
          )}
          {p.symptoms.length ? null : (
            <p className={c.empty}>No symptoms logged.</p>
          )}
        </section>

        <section id="notes" className={c.panel} aria-labelledby="nt-h">
          <div className={c.panelHead}>
            <h2 id="nt-h" className={c.h2}>
              Private notes
            </h2>
            <span className={c.muted}>Care team only</span>
          </div>
          <form
            className={c.noteForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              addNote(p.id, note);
              setNote("");
              toast("Note saved");
            }}
          >
            <label className="sr-only" htmlFor="note">
              New note
            </label>
            <textarea
              id="note"
              className={c.textarea}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Never shown to the patient"
            />
            <button
              type="submit"
              className="btn btn--ghost"
              disabled={!note.trim()}
            >
              Save note
            </button>
          </form>
          <ul className={c.notes}>
            {p.notes.map((n) => (
              <li key={n.id}>
                <p>{n.text}</p>
                <span>
                  {n.by}, {short(n.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {photos && (
          <PhotosPanel p={p} sets={photos} onShow={() => logPhotoView(p.id)} />
        )}

        {!fresh && (
          <section
            id="visits"
            className={`${c.panel} ${c.full}`}
            aria-labelledby="vs-h"
          >
            <div className={c.panelHead}>
              <h2 id="vs-h" className={c.h2}>
                Visits
              </h2>
              {unsigned && (
                <Link
                  href={`/clinician/notes/${unsigned.id}`}
                  className={c.textLink}
                >
                  Note from {short(unsigned.call_at)} to sign{" "}
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
            {p.visits.length ? (
              <ol className={c.visits}>
                {p.visits.map((v) => (
                  <li key={v.id}>
                    <p className={c.visitHead}>
                      <strong>
                        {v.type === "FIRST_CONSULTATION"
                          ? "First consultation"
                          : "Follow-up"}
                      </strong>
                      <span className={nt.visitWhen}>
                        <span className="num">
                          {short(v.at)}, {time(new Date(v.at))}
                        </span>
                        {noteIds.has(v.note_id ?? v.id) && (
                          <Link
                            href={`/clinician/notes/${v.note_id ?? v.id}`}
                            className={nt.visitNote}
                          >
                            Open the note
                          </Link>
                        )}
                      </span>
                    </p>
                    <p>{v.summary}</p>
                    {v.assessment && (
                      <p className={nt.visitAssess}>
                        <span>Assessment</span> {v.assessment}
                      </p>
                    )}
                    <p className={c.toldLabel}>Told the patient</p>
                    <ul>
                      {v.plan.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={c.empty}>
                No visits yet. The first consultation is today or upcoming.
              </p>
            )}
          </section>
        )}

        <section
          id="activity"
          className={`${c.panel} ${c.full}`}
          aria-labelledby="ac-h"
        >
          <div className={c.panelHead}>
            <h2 id="ac-h" className={c.h2}>
              Activity
            </h2>
            <span className={c.muted}>Audit log</span>
          </div>
          <p className={c.consents}>
            <span className={c.muted}>Consents</span> {p.consents.join(", ")}
            {p.since && !p.consents.includes("Call transcription") && (
              <span className={c.muted}>
                {" "}
                (call transcription declined: no scribe draft, you write the
                note)
              </span>
            )}
          </p>

          {p.audit.length ? (
            <ul className={c.audit}>
              {p.audit.map((a, i) => (
                <li key={i}>
                  <span className="num">
                    {short(a.at)}, {time(new Date(a.at))}
                  </span>
                  {a.action}
                </li>
              ))}
            </ul>
          ) : (
            <p className={c.empty}>
              Every view and change to this record is logged here.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

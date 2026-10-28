/*
  Today's lead plate (Arhaan's "Next" card): who is next, when, why, a four-line brief from their
  record, and Start consultation from ten minutes before the start (as the patient's Join is).
  The brief needs the patient record endpoint; until the backend has it, the plate shows without it.
*/

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import ContourField from "@/components/ui/ContourField";
import { clockTime, shortDate, weekdayDayMonth } from "@/lib/format/dateTime";
import type { Appointment } from "@/types/appointment";
import type { PatientRecord } from "@/types/patientRecord";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import styles from "../TodayPage.module.css";

const OPENS_BEFORE_MS = 10 * 6e4;

const signedSummary = (record: PatientRecord) => {
  const signed = record.prescriptions.find((rx) => rx.status === "SIGNED");
  if (!signed?.items.length) return "Nothing yet";
  const main = signed.items[0];
  return `${main.name.replace(/ \(.*\)/, "")} ${main.strength}${signed.items.length > 1 ? ` + ${signed.items.length - 1} more` : ""}`;
};

function Brief({ record }: { record: PatientRecord }) {
  const since = record.sinceLastVisit;
  const knownNone = !!record.allergies && /^No known/i.test(record.allergies);
  const latest = record.weights.at(-1);
  return (
    <ul className={styles.brief}>
      <li>
        <span>Allergies</span>
        <strong data-warn={!knownNone}>{record.allergies ? (knownNone ? "None known" : record.allergies) : "Not recorded"}</strong>
      </li>
      {since ? (
        <>
          <li>
            <span>Weight since {shortDate(since.at)}</span>
            <strong className="num">
              {since.weightChangeKg === null ? "No new reading" : `${since.weightChangeKg > 0 ? "+" : since.weightChangeKg < 0 ? "−" : ""}${Math.abs(since.weightChangeKg)} kg`}
            </strong>
          </li>
          <li>
            <span>On prescription</span>
            <strong>{signedSummary(record)}</strong>
            {record.injections?.lastAt && <em className={styles.briefNote}>Last injection {shortDate(record.injections.lastAt)}</em>}
          </li>
          <li>
            <span>New since then</span>
            <strong data-warn={!!since.news && /flagged|Dizz|Severe/i.test(since.news)}>{since.news ?? "Nothing new"}</strong>
          </li>
        </>
      ) : (
        <>
          <li>
            <span>From the check</span>
            <strong className="num">{[latest ? `${latest.kg} kg` : null, record.heightCm ? `${record.heightCm} cm` : null].filter(Boolean).join(", ") || "Not recorded"}</strong>
          </li>
          <li>
            <span>Conditions</span>
            <strong>{record.conditions.length ? record.conditions.join(", ") : "None reported"}</strong>
          </li>
          <li>
            <span>Identity</span>
            <strong data-warn={!record.identityVerified}>{record.identityVerified ? "Verified" : "Check at start"}</strong>
          </li>
        </>
      )}
    </ul>
  );
}

export default function NextPatientCard({ appointment, record, inProgress, notToday, now }: { appointment: Appointment; record: PatientRecord | null; inProgress: boolean; notToday: boolean; now: number }) {
  const startsAt = new Date(appointment.startsAt);
  const opensAt = startsAt.getTime() - OPENS_BEFORE_MS;
  const minutes = Math.round((startsAt.getTime() - now) / 6e4);
  return (
    <section className={`${layoutStyles.next} ${styles.nextUp}`} aria-labelledby="next-patient-heading">
      <ContourField className={layoutStyles.field} density={9} lineAlpha={0.1} signalAlpha={0.34} seed={9} interactive={false} />
      <p className={layoutStyles.kicker}>
        {inProgress ? "In progress" : notToday ? "Next working day" : "Next"}
        <span className={layoutStyles.until}>
          {inProgress ? "now" : notToday ? `${weekdayDayMonth.format(startsAt)}, ${clockTime(startsAt)}` : minutes < 60 ? `in ${Math.max(0, minutes)} min` : `at ${clockTime(startsAt)}`}
        </span>
      </p>
      <h2 id="next-patient-heading" className={layoutStyles.nextTitle}>
        {appointment.patientName}
        <span className={layoutStyles.nextTime}> {appointment.consultationType === "Clinic" ? "clinic visit" : "video consultation"}</span>
      </h2>
      {appointment.reason && <p className={styles.reason}>{appointment.reason}</p>}
      {record && <Brief record={record} />}
      <div className={layoutStyles.nextActions}>
        {now >= opensAt ? (
          <Link href={`/consultation/${appointment.id}`} className="btn btn--signal">
            <span>Start consultation</span>
            <span className="well" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </Link>
        ) : (
          <span className={styles.opensAt}>
            Start opens at <span className="num">{clockTime(new Date(opensAt))}</span>
          </span>
        )}
        {appointment.patientId && (
          <Link href={`/doctor-dashboard/patients/${appointment.patientId}?from=today`} className="btn btn--ghost-dark">
            Open record
          </Link>
        )}
      </div>
    </section>
  );
}

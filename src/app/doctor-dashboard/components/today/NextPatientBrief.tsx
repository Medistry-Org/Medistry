/*
  The four-line brief on Today's next-patient plate, from the patient record: a returning patient's
  allergies, weight since the last visit, prescription and what is new; a first consultation's
  allergies, numbers from the free check, conditions and identity.
*/

import { shortDate } from "@/lib/format/dateTime";
import type { PatientRecord } from "@/types/patientRecord";
import styles from "./NextPatientBrief.module.css";

const signedSummary = (record: PatientRecord) => {
  const signed = record.prescriptions.find((rx) => rx.status === "SIGNED");
  if (!signed?.items.length) return "Nothing yet";
  const main = signed.items[0];
  return `${main.name.replace(/ \(.*\)/, "")} ${main.strength}${signed.items.length > 1 ? ` + ${signed.items.length - 1} more` : ""}`;
};

export default function NextPatientBrief({
  record,
}: {
  record: PatientRecord;
}) {
  const since = record.sinceLastVisit;
  const knownNone = !!record.allergies && /^No known/i.test(record.allergies);
  const latest = record.weights.at(-1);
  return (
    <ul className={styles.brief}>
      <li>
        <span>Allergies</span>
        <strong data-warn={!knownNone}>
          {record.allergies
            ? knownNone
              ? "None known"
              : record.allergies
            : "Not recorded"}
        </strong>
      </li>
      {since ? (
        <>
          <li>
            <span>Weight since {shortDate(since.at)}</span>
            <strong className="num">
              {since.weightChangeKg === null
                ? "No new reading"
                : `${since.weightChangeKg > 0 ? "+" : since.weightChangeKg < 0 ? "−" : ""}${Math.abs(since.weightChangeKg)} kg`}
            </strong>
          </li>
          <li>
            <span>On prescription</span>
            <strong>{signedSummary(record)}</strong>
            {record.injections?.lastAt && (
              <em className={styles.note}>
                Last injection {shortDate(record.injections.lastAt)}
              </em>
            )}
          </li>
          <li>
            <span>New since then</span>
            <strong
              data-warn={
                !!since.news && /flagged|Dizz|Severe/i.test(since.news)
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
              {[
                latest ? `${latest.kg} kg` : null,
                record.heightCm ? `${record.heightCm} cm` : null,
              ]
                .filter(Boolean)
                .join(", ") || "Not recorded"}
            </strong>
          </li>
          <li>
            <span>Conditions</span>
            <strong>
              {record.conditions.length
                ? record.conditions.join(", ")
                : "None reported"}
            </strong>
          </li>
          <li>
            <span>Identity</span>
            <strong data-warn={!record.identityVerified}>
              {record.identityVerified ? "Verified" : "Check at start"}
            </strong>
          </li>
        </>
      )}
    </ul>
  );
}

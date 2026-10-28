"use client";

/*
  What the patient logged in the last week (Arhaan's Trackers panel): their weekly pen, daily
  tablets, weight readings, and symptoms. Flagged symptoms and the latest lead; the rest are one
  tap away.
*/

import { useState } from "react";
import { clockTime, shortDate } from "@/lib/format/dateTime";
import type { PatientRecord } from "@/types/patientRecord";
import SymptomOutcomes from "./SymptomOutcomes";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";
import styles from "./TrackersPanel.module.css";

const TWO_WEEKS_MS = 14 * 864e5;

/** The patient's note as one sentence: its own full stop is kept, never doubled before the date. */
const asSentence = (text: string) =>
  /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;

export default function TrackersPanel({
  record,
  onChanged,
}: {
  record: PatientRecord;
  onChanged: () => void;
}) {
  const [allSymptoms, setAllSymptoms] = useState(false);
  const { injections, adherence, weights, symptoms } = record;
  const lastWeighed = weights.at(-1);
  const recentReadings = lastWeighed
    ? weights.filter(
        (weight) =>
          Date.parse(lastWeighed.at) - Date.parse(weight.at) < TWO_WEEKS_MS,
      ).length
    : 0;
  const open = (i: number) =>
    symptoms[i].requiresReview && !symptoms[i].acknowledged;
  const shownSymptoms = allSymptoms
    ? symptoms
    : symptoms.filter((_, i) => open(i) || i === 0);

  return (
    <section
      id="trackers"
      className={clinicStyles.panel}
      aria-labelledby="trackers-heading"
    >
      <div className={clinicStyles.panelHead}>
        <h2 id="trackers-heading" className={clinicStyles.h2}>
          Trackers
        </h2>
        <span className={clinicStyles.muted}>Last 7 days, patient logged</span>
      </div>
      <div className={recordStyles.tiles}>
        {injections && (
          <div className={recordStyles.tile}>
            <span>
              {injections.name} {injections.strength}, weekly
            </span>
            <strong className="num">
              {injections.taken
                ? `${Math.min(injections.taken, injections.perStep)} of ${injections.perStep} done`
                : injections.dueToday
                  ? "First one due today"
                  : "First one not logged"}
            </strong>
            <em>
              {injections.lastAt
                ? `Last ${shortDate(injections.lastAt)}${injections.lastSite ? `, ${injections.lastSite}` : ""}`
                : "Patient logs each injection and where it went"}
            </em>
          </div>
        )}
        <div className={recordStyles.tile}>
          <span>Daily tablets taken</span>
          <strong className="num" data-empty={!adherence || undefined}>
            {adherence
              ? `${adherence.taken} of ${adherence.due}`
              : "No tablets prescribed"}
          </strong>
          <em>Doses logged as taken</em>
        </div>
        <div className={recordStyles.tile}>
          <span>Weight readings</span>
          <strong className="num" data-empty={weights.length < 2 || undefined}>
            {weights.length > 1
              ? `${recentReadings} in the last 2 weeks`
              : "None yet"}
          </strong>
          <em>Logged by the patient</em>
        </div>
      </div>
      <p className={clinicStyles.subHead}>Symptoms</p>
      {symptoms.length ? (
        <ul className={styles.symptoms}>
          {shownSymptoms.map((symptom) => {
            const flagged = symptom.requiresReview && !symptom.acknowledged;
            return (
              <li key={symptom.id} data-flag={flagged}>
                <div>
                  <strong>
                    {symptom.label}, {symptom.severity.toLowerCase()}
                  </strong>
                  <span>
                    {asSentence(symptom.note || "No note")}{" "}
                    {shortDate(symptom.at)}, {clockTime(new Date(symptom.at))}
                  </span>
                </div>
                {flagged ? (
                  <SymptomOutcomes
                    patientId={record.patientId}
                    symptom={symptom}
                    onChanged={onChanged}
                  />
                ) : (
                  <span className={clinicStyles.muted}>
                    {symptom.requiresReview
                      ? "Acknowledged"
                      : "For information"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={clinicStyles.empty}>No symptoms logged.</p>
      )}
      {symptoms.length > 1 && (
        <button
          type="button"
          className={clinicStyles.textLink}
          onClick={() => setAllSymptoms((showing) => !showing)}
        >
          {allSymptoms ? "Show fewer" : `All ${symptoms.length} symptoms`}
        </button>
      )}
    </section>
  );
}

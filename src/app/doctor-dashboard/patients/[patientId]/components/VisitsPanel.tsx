/*
  Past consultations (Arhaan's Visits panel): what happened, the doctor's assessment (never shown
  to the patient) and what the patient was told, each linked to its signed call note. A note still
  to sign for this patient is offered in the panel's head.
*/

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { clockTime, shortDate } from "@/lib/format/dateTime";
import type { ClinicalNote } from "@/types/clinicalNote";
import type { RecordVisit } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";
import styles from "./VisitsPanel.module.css";

export default function VisitsPanel({
  visits,
  noteToSign,
}: {
  visits: RecordVisit[];
  noteToSign?: ClinicalNote;
}) {
  return (
    <section
      id="visits"
      className={`${clinicStyles.panel} ${recordStyles.full}`}
      aria-labelledby="visits-heading"
    >
      <div className={clinicStyles.panelHead}>
        <h2 id="visits-heading" className={clinicStyles.h2}>
          Visits
        </h2>
        {noteToSign && (
          <Link
            href={`/doctor-dashboard/notes/${noteToSign.id}?from=patient`}
            className={clinicStyles.textLink}
          >
            Note from {shortDate(noteToSign.callAt)} to sign{" "}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
      {visits.length ? (
        <ol className={styles.visits}>
          {visits.map((visit) => (
            <li key={visit.id}>
              <p className={styles.visitHead}>
                <strong>
                  {visit.type === "FIRST_CONSULTATION"
                    ? "First consultation"
                    : "Follow-up"}
                </strong>
                <span className={styles.visitWhen}>
                  <span className="num">
                    {shortDate(visit.at)}, {clockTime(new Date(visit.at))}
                  </span>
                  {visit.noteId && (
                    <Link
                      href={`/doctor-dashboard/notes/${visit.noteId}?from=patient`}
                      className={styles.visitNote}
                    >
                      Open the note
                    </Link>
                  )}
                </span>
              </p>
              <p>{visit.summary}</p>
              {visit.assessment && (
                <p className={styles.visitAssess}>
                  <span>Assessment</span> {visit.assessment}
                </p>
              )}
              <p className={styles.toldLabel}>Told the patient</p>
              <ul>
                {visit.plan.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className={clinicStyles.empty}>
          No visits yet. The first consultation is today or upcoming.
        </p>
      )}
    </section>
  );
}

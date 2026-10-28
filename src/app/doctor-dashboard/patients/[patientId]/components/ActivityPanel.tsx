/* The record's activity (Arhaan's Activity panel): the patient's consents and the audit log of every view and change. */

import { clockTime, shortDate } from "@/lib/format/dateTime";
import type { PatientRecord } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";
import styles from "./ActivityPanel.module.css";

export default function ActivityPanel({ record }: { record: PatientRecord }) {
  return (
    <section
      id="activity"
      className={`${clinicStyles.panel} ${recordStyles.full}`}
      aria-labelledby="activity-heading"
    >
      <div className={clinicStyles.panelHead}>
        <h2 id="activity-heading" className={clinicStyles.h2}>
          Activity
        </h2>
        <span className={clinicStyles.muted}>Audit log</span>
      </div>
      <p className={styles.consents}>
        <span className={clinicStyles.muted}>Consents</span>{" "}
        {record.consents.length ? record.consents.join(", ") : "None recorded"}
        {record.careStartedAt &&
          !record.consents.includes("Call transcription") && (
            <span className={clinicStyles.muted}>
              {" "}
              (call transcription declined: no scribe draft, you write the note)
            </span>
          )}
      </p>
      {record.audit.length ? (
        <ul className={styles.audit}>
          {record.audit.map((entry, i) => (
            <li key={`${entry.at}-${i}`}>
              <span className="num">
                {shortDate(entry.at)}, {clockTime(new Date(entry.at))}
              </span>
              {entry.action}
            </li>
          ))}
        </ul>
      ) : (
        <p className={clinicStyles.empty}>
          Every view and change to this record is logged here.
        </p>
      )}
    </section>
  );
}

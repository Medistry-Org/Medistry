/*
  A first-consultation record (Arhaan's "Before the first consultation"): one panel saying what to
  collect on the call, never five empty ones, with the counsellor's screening when there was one.
*/

import type { Screening } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";
import ScreeningCard from "./ScreeningCard";
import styles from "./FirstConsultationPanel.module.css";

export default function FirstConsultationPanel({ screening }: { screening: Screening | null }) {
  return (
    <section id="first" className={`${clinicStyles.panel} ${recordStyles.full}`} aria-labelledby="first-heading">
      <div className={clinicStyles.panelHead}>
        <h2 id="first-heading" className={clinicStyles.h2}>
          Before the first consultation
        </h2>
      </div>
      {screening && <ScreeningCard screening={screening} />}
      <p className={clinicStyles.muted}>Nothing else is on record yet beyond the patient&apos;s answers. To collect on the call:</p>
      <ul className={styles.collect}>
        <li>Allergies to medicines, and any reaction</li>
        <li>Medicines from other doctors</li>
        <li>Waist, measured at the navel</li>
        <li>A recent HbA1c or blood test report, if they have one</li>
      </ul>
    </section>
  );
}

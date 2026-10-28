/* The record's labs (Arhaan's Labs panel): every report, newest first, each compared with the one before. */

import type { LabReport } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";
import LabCard from "./LabCard";

export default function LabsPanel({ patientId, labs, onChanged }: { patientId: string; labs: LabReport[]; onChanged: () => void }) {
  return (
    <section id="labs" className={`${clinicStyles.panel} ${recordStyles.full}`} aria-labelledby="labs-heading">
      <div className={clinicStyles.panelHead}>
        <h2 id="labs-heading" className={clinicStyles.h2}>
          Labs
        </h2>
      </div>
      {labs.length ? (
        labs.map((lab, i) => <LabCard key={lab.id} patientId={patientId} lab={lab} older={labs[i + 1]} onChanged={onChanged} />)
      ) : (
        <p className={clinicStyles.empty}>No tests yet. Order a baseline panel after the first consultation.</p>
      )}
    </section>
  );
}

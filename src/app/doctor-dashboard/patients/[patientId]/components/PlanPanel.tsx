/* The treatment plan (Arhaan's record panel): the doctor's notes, the daily goals and the next review. */

import { longDate } from "@/lib/format/dateTime";
import type { TreatmentPlan } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";

export default function PlanPanel({ plan }: { plan: TreatmentPlan | null }) {
  return (
    <section id="plan" className={clinicStyles.panel} aria-labelledby="plan-heading">
      <div className={clinicStyles.panelHead}>
        <h2 id="plan-heading" className={clinicStyles.h2}>
          Treatment plan
        </h2>
      </div>
      {plan ? (
        <>
          <p className={recordStyles.concern}>{plan.notes}</p>
          <div className={recordStyles.tiles}>
            {plan.goals.map((goal) => (
              <div key={goal.label} className={recordStyles.tile}>
                <span>{goal.label}</span>
                <strong className="num">{goal.value}</strong>
              </div>
            ))}
          </div>
          <p className={clinicStyles.muted}>Next plan review {longDate(plan.reviewAt)}</p>
        </>
      ) : (
        <p className={clinicStyles.empty}>No plan yet. It is set after the first consultation and any tests.</p>
      )}
    </section>
  );
}

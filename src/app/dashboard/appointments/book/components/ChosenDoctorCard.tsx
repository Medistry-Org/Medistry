/** The chosen doctor above the details and the calendar, with a way to pick someone else. */

import type { DoctorSummary } from "@/types/doctor";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import surfaceStyles from "@/components/ui/styles/Surfaces.module.css";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../BookPage.module.css";
import doctorLine from "./doctorLine";

export default function ChosenDoctorCard({ doctor, onChange }: { doctor: DoctorSummary; onChange: () => void }) {
  return (
    <Card
      title="Your doctor"
      className={styles.card}
      action={
        <button type="button" className={formStyles.link} onClick={onChange}>
          Change
        </button>
      }
    >
      <div className={surfaceStyles.docRow}>
        <Avatar name={doctor.fullName} src={doctor.photoUrl} size={56} />
        <span className={surfaceStyles.docText}>
          <strong>{doctor.fullName}</strong>
          {doctorLine(doctor) && <span>{doctorLine(doctor)}</span>}
        </span>
      </div>
    </Card>
  );
}

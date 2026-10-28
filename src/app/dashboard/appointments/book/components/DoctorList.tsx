/** The doctors a patient can book, one row each (the design's doctor row: portrait, name, field). */

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { DoctorSummary } from "@/types/doctor";
import Avatar from "@/components/ui/Avatar";
import surfaceStyles from "@/components/ui/styles/Surfaces.module.css";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../BookPage.module.css";
import doctorLine from "./doctorLine";

export default function DoctorList({ doctors, onChoose }: { doctors: DoctorSummary[]; onChoose: (doctor: DoctorSummary) => void }) {
  if (doctors.length === 0) return <p className={formStyles.hint}>No doctors are taking bookings right now. Please try again later.</p>;
  return (
    <ul className={styles.doctors}>
      {doctors.map((doctor) => (
        <li key={doctor.id}>
          <button type="button" className={styles.doctor} onClick={() => onChoose(doctor)}>
            <Avatar name={doctor.fullName} src={doctor.photoUrl} size={48} />
            <span className={surfaceStyles.docText}>
              <strong>{doctor.fullName}</strong>
              {doctorLine(doctor) && <span>{doctorLine(doctor)}</span>}
            </span>
            <CaretRight size={16} className={styles.go} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

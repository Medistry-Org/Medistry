/*
  One patient in the list (Arhaan's Patients row): who they are and what is waiting, then the
  programme, BMI, latest HbA1c and next visit as columns on a laptop (labelled cells on a phone).
  `snapshot` is null while the backend has no snapshot endpoint; the cells then say so quietly.
*/

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import { shortDate } from "@/lib/format/dateTime";
import type { DoctorPatient } from "@/types/doctor";
import type { PatientSnapshot } from "@/types/patientRecord";
import styles from "../PatientsPage.module.css";

const sexLetter = (sex: string) =>
  /^f/i.test(sex) ? "F" : /^m/i.test(sex) ? "M" : "";

export default function PatientRow({
  patient,
  snapshot,
  waiting,
  nextVisit,
}: {
  patient: DoctorPatient;
  snapshot: PatientSnapshot | null;
  waiting?: string;
  nextVisit?: string;
}) {
  const facts = [patient.age, sexLetter(patient.sex)].filter(Boolean).join(" ");
  const place = snapshot?.city || patient.mobile;
  const hba1c = snapshot?.latestHba1c;
  return (
    <Link
      href={`/doctor-dashboard/patients/${patient.id}`}
      className={styles.prow}
    >
      <span className={styles.pwho}>
        <Avatar name={patient.fullName} size={40} />
        <span>
          <strong>{patient.fullName}</strong>
          <span className="num">
            {[facts, place].filter(Boolean).join(", ")}
          </span>
          <span className={styles.pnext}>
            {waiting && (
              <em
                className={styles.waitText}
                data-kind={/symptom|urgent/i.test(waiting) ? "symptom" : "task"}
              >
                {waiting}
              </em>
            )}
            <span className="num">
              {nextVisit ? `Next ${shortDate(nextVisit)}` : "No visit booked"}
            </span>
          </span>
        </span>
      </span>
      <span className={styles.pcell} data-label="Programme">
        {snapshot?.programme || "Not recorded"}
        {snapshot?.careWeek && (
          <span className={`${styles.pmuted} num`}>
            Week {snapshot.careWeek}
          </span>
        )}
      </span>
      <span className={`${styles.pcell} num`} data-label="BMI">
        {snapshot?.bmi ?? "Not recorded"}
      </span>
      <span className={`${styles.pcell} num`} data-label="HbA1c">
        {hba1c ? `${hba1c.value}%` : "Not tested"}
        {hba1c && <span className={styles.pmuted}>{shortDate(hba1c.at)}</span>}
      </span>
      <span className={`${styles.pcell} num`} data-label="Next visit">
        {nextVisit ? shortDate(nextVisit) : "Not booked"}
      </span>
      <CaretRight size={16} className={styles.chev} aria-hidden="true" />
    </Link>
  );
}

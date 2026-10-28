/*
  One consultation in a day list, used by Today and Schedule (Arhaan's ApptRow): the time, the
  patient with the reason and age, then either what the patient is waiting on (upcoming) or how the
  consultation went. The row opens the patient's record, remembering where it was opened from.
*/

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { isInProgress } from "@/lib/consultations/consultationTime";
import { clockTime } from "@/lib/format/dateTime";
import type { Appointment } from "@/types/appointment";
import styles from "./AppointmentRow.module.css";

/** The <ol> class a list of rows needs, so its first row drops the top hairline. */
export const appointmentListClass = styles.appts;

const STATUS_WORDS = {
  COMPLETED: "Done",
  IN_PROGRESS: "Now",
  CANCELLED: "Cancelled",
} as const;

const sexLetter = (sex: string) =>
  /^f/i.test(sex) ? "F" : /^m/i.test(sex) ? "M" : "";

export default function AppointmentRow({
  appointment,
  now,
  flag,
  from,
}: {
  appointment: Appointment;
  now: number;
  flag?: string;
  from: "today" | "schedule";
}) {
  const status = isInProgress(appointment, now)
    ? "IN_PROGRESS"
    : appointment.status;
  const facts = [appointment.patientAge, sexLetter(appointment.patientSex)]
    .filter(Boolean)
    .join(" ");
  const inner = (
    <>
      <span className={`${styles.apptTime} num`}>
        {clockTime(new Date(appointment.startsAt))}
      </span>
      <span className={styles.apptWho}>
        <strong>{appointment.patientName}</strong>
        <span>
          {appointment.reason || "Consultation"}
          {facts ? `, ${facts}` : ""}
        </span>
      </span>
      {status === "BOOKED" ? (
        flag ? (
          <span
            className={styles.rowFlag}
            data-kind={/symptom|urgent/i.test(flag) ? "symptom" : "task"}
          >
            {flag}
          </span>
        ) : (
          <span />
        )
      ) : (
        <span className={styles.status} data-s={status}>
          <i aria-hidden="true" />
          {STATUS_WORDS[status]}
        </span>
      )}
      {appointment.patientId && (
        <CaretRight size={16} className={styles.chev} aria-hidden="true" />
      )}
    </>
  );
  return appointment.patientId ? (
    <Link
      href={`/doctor-dashboard/patients/${appointment.patientId}?from=${from}`}
      className={styles.appt}
      data-s={status}
    >
      {inner}
    </Link>
  ) : (
    <div className={styles.appt} data-s={status}>
      {inner}
    </div>
  );
}

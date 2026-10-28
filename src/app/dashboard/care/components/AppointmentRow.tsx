/** The next consultation as one row to Appointments, which owns every action for it (phones, in the care team card). */

import Link from "next/link";
import { CalendarBlank, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { clockTime } from "@/lib/format/dateTime";
import { visitDay } from "@/lib/consultations/consultationTime";
import type { Appointment } from "@/types/appointment";
import styles from "../CarePage.module.css";
import drShort from "./drShort";

export default function AppointmentRow({ next }: { next: Appointment | null }) {
  return (
    <Link href="/dashboard/appointments" className={styles.row} aria-label={next ? undefined : "Appointments: nothing booked yet"}>
      <span className={styles.plate} aria-hidden="true">
        <CalendarBlank size={17} />
      </span>
      <span className={styles.rowText}>
        {next ? (
          <>
            <strong>
              {visitDay(next.startsAt)}, <span className="num">{clockTime(new Date(next.startsAt))}</span>
            </strong>
            <span>Consultation, {drShort(next.doctorName)}</span>
          </>
        ) : (
          <>
            <strong>Appointments</strong>
            <span>Nothing booked yet</span>
          </>
        )}
      </span>
      <CaretRight size={16} className={styles.go} aria-hidden="true" />
    </Link>
  );
}

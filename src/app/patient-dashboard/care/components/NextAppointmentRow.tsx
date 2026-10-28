/** The next consultation as one row to Appointments, which owns every action for it (phones, in the care team card). */

import Link from "next/link";
import { CalendarBlank, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { visitDay } from "@/lib/consultations/consultationTime";
import { clockTime } from "@/lib/format/dateTime";
import type { Appointment } from "@/types/appointment";
import formalDoctorName from "./formalDoctorName";
import pageStyles from "../CarePage.module.css";

export default function NextAppointmentRow({
  next,
}: {
  next: Appointment | null;
}) {
  return (
    <Link
      href="/patient-dashboard/appointments"
      className={pageStyles.row}
      aria-label={next ? undefined : "Appointments: nothing booked yet"}
    >
      <span className={pageStyles.plate} aria-hidden="true">
        <CalendarBlank size={17} />
      </span>
      <span className={pageStyles.rowText}>
        {next ? (
          <>
            <strong>
              {visitDay(next.startsAt)},{" "}
              <span className="num">{clockTime(new Date(next.startsAt))}</span>
            </strong>
            <span>Consultation, {formalDoctorName(next.doctorName)}</span>
          </>
        ) : (
          <>
            <strong>Appointments</strong>
            <span>Nothing booked yet</span>
          </>
        )}
      </span>
      <CaretRight size={16} className={pageStyles.go} aria-hidden="true" />
    </Link>
  );
}

/**
 * The "Upcoming" card on Appointments: each booked consultation with its actions, or a way to
 * book the first one.
 */

import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react/dist/ssr";
import ConsultationVisit from "@/app/patient-dashboard/components/ConsultationVisit";
import Card from "@/components/ui/Card";
import type { Appointment } from "@/types/appointment";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../AppointmentsPage.module.css";

export default function UpcomingCard({
  upcoming,
  now,
  onCheckDevices,
  onChangeTime,
}: {
  upcoming: Appointment[];
  now: number;
  onCheckDevices: () => void;
  onChangeTime: (appointment: Appointment) => void;
}) {
  return (
    <Card
      title="Upcoming"
      className={styles.card}
      action={
        upcoming.length > 0 && (
          <Link
            href="/patient-dashboard/appointments/book"
            className={`${formStyles.link} ${styles.headBook}`}
            aria-label="Book a consultation"
          >
            <Plus size={15} weight="bold" aria-hidden="true" /> Book
          </Link>
        )
      }
    >
      {upcoming.length > 0 ? (
        <div className={styles.list}>
          {upcoming.map((appointment) => (
            <ConsultationVisit
              key={appointment.id}
              appointment={appointment}
              now={now}
              onCheckDevices={onCheckDevices}
              onChangeTime={
                appointment.doctorId
                  ? () => onChangeTime(appointment)
                  : undefined
              }
              messageHref={
                appointment.doctorId
                  ? `/patient-dashboard/messages/${appointment.doctorId}`
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyBlock}>
          <p className={styles.empty}>Nothing booked yet.</p>
          <Link
            href="/patient-dashboard/appointments/book"
            className={`btn ${formStyles.go} ${styles.cta}`}
          >
            <span>Book a consultation</span>
            <span className="well" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </Link>
        </div>
      )}
    </Card>
  );
}

/**
 * Appointments on Care. With a care team it is the laptop's fourth card (phones see the next
 * consultation as a row in the care team card); before the first consultation it shows at every
 * width and offers booking.
 */

import Link from "next/link";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Appointment } from "@/types/appointment";
import Card from "@/components/ui/Card";
import ConsultationVisit from "@/components/ui/ConsultationVisit";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../CarePage.module.css";

export default function AppointmentsCard({
  next,
  now,
  everyWidth = false,
  onCheckDevices,
}: {
  next: Appointment | null;
  now: number;
  everyWidth?: boolean;
  onCheckDevices: () => void;
}) {
  return (
    <Card
      className={`${styles.card} ${everyWidth ? styles.appt : `${styles.visits} ${styles.deskOnly}`}`}
      title="Appointments"
      action={
        !everyWidth && (
          <Link href="/dashboard/appointments" className={formStyles.link}>
            All appointments <CaretRight size={15} />
          </Link>
        )
      }
    >
      {next ? (
        <ConsultationVisit
          appointment={next}
          now={now}
          onCheckDevices={onCheckDevices}
          messageHref={next.doctorId ? `/dashboard/messages/${next.doctorId}` : undefined}
        />
      ) : (
        <div className={styles.stack}>
          <p className={styles.text}>Nothing booked yet.</p>
          <Link href="/dashboard/appointments/book" className={`btn ${formStyles.go} ${styles.cta}`}>
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

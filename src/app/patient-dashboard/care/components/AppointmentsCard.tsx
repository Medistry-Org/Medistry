/**
 * Appointments on Care. With a care team it is the laptop's fourth card (phones see the next
 * consultation as a row in the care team card); before the first consultation it shows at every
 * width and offers booking.
 */

import Link from "next/link";
import { ArrowRight, CaretRight } from "@phosphor-icons/react/dist/ssr";
import ConsultationVisit from "@/app/patient-dashboard/components/ConsultationVisit";
import Card from "@/components/ui/Card";
import type { Appointment } from "@/types/appointment";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import pageStyles from "../CarePage.module.css";
import styles from "./AppointmentsCard.module.css";

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
      className={`${pageStyles.card} ${everyWidth ? pageStyles.appt : `${pageStyles.visits} ${pageStyles.deskOnly}`}`}
      title="Appointments"
      action={
        !everyWidth && (
          <Link
            href="/patient-dashboard/appointments"
            className={formStyles.link}
          >
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
          messageHref={
            next.doctorId
              ? `/patient-dashboard/messages/${next.doctorId}`
              : undefined
          }
        />
      ) : (
        <div className={pageStyles.stack}>
          <p className={pageStyles.text}>Nothing booked yet.</p>
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

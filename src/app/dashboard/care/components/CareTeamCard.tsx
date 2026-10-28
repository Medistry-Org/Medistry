/**
 * "Your care team": each doctor the patient has seen (a row opens their sheet), then on a phone the
 * next consultation, and on a laptop a way into Messages.
 */

import Link from "next/link";
import { CaretRight, ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import type { Appointment } from "@/types/appointment";
import type { ConsultationDoctor } from "@/lib/consultations/consultationDoctors";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import styles from "../CarePage.module.css";
import AppointmentRow from "./AppointmentRow";

export default function CareTeamCard({
  doctors,
  next,
  onOpenDoctor,
}: {
  doctors: ConsultationDoctor[];
  next: Appointment | null;
  onOpenDoctor: (doctor: ConsultationDoctor) => void;
}) {
  return (
    <Card className={`${styles.card} ${styles.team}`} title="Your care team" id="team">
      <ul className={styles.people}>
        {doctors.map((doctor) => (
          <li key={doctor.doctorId ?? doctor.name}>
            <button type="button" className={styles.row} onClick={() => onOpenDoctor(doctor)}>
              <Avatar name={doctor.name} src={doctor.photoUrl} size={40} />
              <span className={styles.rowText}>
                <strong>{doctor.name}</strong>
                <span>{doctor.specialization || "Your doctor"}</span>
              </span>
              <CaretRight size={16} className={styles.go} aria-hidden="true" />
            </button>
          </li>
        ))}
        <li className={styles.phoneOnly}>
          <AppointmentRow next={next} />
        </li>
        <li className={styles.deskOnly}>
          <Link href="/dashboard/messages" className={styles.row}>
            <span className={styles.plate} aria-hidden="true">
              <ChatCircleText size={17} />
            </span>
            <span className={styles.rowText}>
              <strong>Message your care team</strong>
              <span>In Messages</span>
            </span>
            <CaretRight size={16} className={styles.go} aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </Card>
  );
}

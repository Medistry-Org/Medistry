/**
 * "Your care team": the care-team doctor (a row opens their sheet), then on a phone the next
 * consultation, and on a laptop a way into Messages.
 */

import Link from "next/link";
import { CaretRight, ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import type { CareTeamDoctor } from "@/app/patient-dashboard/components/careTeamDoctors";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import type { Appointment } from "@/types/appointment";
import NextAppointmentRow from "./NextAppointmentRow";
import pageStyles from "../CarePage.module.css";

export default function CareTeamCard({
  doctors,
  next,
  onOpenDoctor,
}: {
  doctors: CareTeamDoctor[];
  next: Appointment | null;
  onOpenDoctor: (doctor: CareTeamDoctor) => void;
}) {
  return (
    <Card
      className={`${pageStyles.card} ${pageStyles.team}`}
      title="Your care team"
      id="team"
    >
      <ul className={pageStyles.people}>
        {doctors.map((doctor) => (
          <li key={doctor.doctorId ?? doctor.name}>
            <button
              type="button"
              className={pageStyles.row}
              onClick={() => onOpenDoctor(doctor)}
            >
              <Avatar name={doctor.name} src={doctor.photoUrl} size={40} />
              <span className={pageStyles.rowText}>
                <strong>{doctor.name}</strong>
                <span>{doctor.specialization || "Your doctor"}</span>
              </span>
              <CaretRight
                size={16}
                className={pageStyles.go}
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
        <li className={pageStyles.phoneOnly}>
          <NextAppointmentRow next={next} />
        </li>
        <li className={pageStyles.deskOnly}>
          <Link href="/patient-dashboard/messages" className={pageStyles.row}>
            <span className={pageStyles.plate} aria-hidden="true">
              <ChatCircleText size={17} />
            </span>
            <span className={pageStyles.rowText}>
              <strong>Message your care team</strong>
              <span>In Messages</span>
            </span>
            <CaretRight
              size={16}
              className={pageStyles.go}
              aria-hidden="true"
            />
          </Link>
        </li>
      </ul>
    </Card>
  );
}

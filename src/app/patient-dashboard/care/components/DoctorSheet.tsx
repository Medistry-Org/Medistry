"use client";

/**
 * The care-team doctor, in their sheet: who they are (the full card when GET /api/care-team sends
 * it), then Message and Book.
 */

import Link from "next/link";
import { CaretRight, ChatCircleText } from "@phosphor-icons/react";
import type { CareTeamDoctor } from "@/app/patient-dashboard/components/careTeamDoctors";
import Avatar from "@/components/ui/Avatar";
import { visitDay } from "@/lib/consultations/consultationTime";
import { clockTime } from "@/lib/format/dateTime";
import type { Appointment } from "@/types/appointment";
import formalDoctorName from "./formalDoctorName";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import pageStyles from "../CarePage.module.css";
import styles from "./DoctorSheet.module.css";

export default function DoctorSheet({
  doctor,
  booked,
}: {
  doctor: CareTeamDoctor;
  booked: Appointment | null;
}) {
  const { profile } = doctor;
  const languages = profile?.languages ?? [];
  return (
    <div className={pageStyles.sheetBody}>
      <div className={styles.bio}>
        <Avatar
          name={doctor.name}
          src={doctor.photoUrl ?? profile?.photoUrl}
          size={72}
        />
        <div className={styles.bioText}>
          <p className={styles.bioRole}>Your doctor</p>
          {profile?.qualifications && (
            <p className={styles.bioQual}>{profile.qualifications}</p>
          )}
        </div>
      </div>
      {(doctor.specialization || profile?.specialization) && (
        <p className={styles.bioSpec}>
          {doctor.specialization || profile?.specialization}
        </p>
      )}
      {profile?.about && <p className={pageStyles.text}>{profile.about}</p>}
      {(profile?.experience || languages.length > 0) && (
        <dl className={pageStyles.facts}>
          {profile?.experience && (
            <div>
              <dt>Experience</dt>
              <dd className="num">{profile.experience}</dd>
            </div>
          )}
          {languages.length > 0 && (
            <div className={pageStyles.wide}>
              <dt>Speaks</dt>
              <dd>{languages.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}
      <div className={pageStyles.actions}>
        {doctor.doctorId && (
          <Link
            href={`/patient-dashboard/messages/${doctor.doctorId}`}
            className={`btn ${formStyles.go}`}
          >
            <span>Message {formalDoctorName(doctor.name)}</span>
            <span className="well" aria-hidden="true">
              <ChatCircleText size={18} />
            </span>
          </Link>
        )}
        {booked ? (
          <Link
            href="/patient-dashboard/appointments"
            className={`btn btn--ghost ${pageStyles.pill}`}
          >
            Booked {visitDay(booked.startsAt)},{" "}
            {clockTime(new Date(booked.startsAt))}
            <CaretRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href="/patient-dashboard/appointments/book"
            className={`btn btn--ghost ${pageStyles.pill}`}
          >
            Book a consultation
          </Link>
        )}
      </div>
    </div>
  );
}

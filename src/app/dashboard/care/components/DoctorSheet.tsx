"use client";

/**
 * A doctor from the care team, in their sheet: who they are (from the doctor directory when it
 * lists them), then Message and Book. Data: GET /api/doctors.
 */

import Link from "next/link";
import { CaretRight, ChatCircleText } from "@phosphor-icons/react";
import { listBookableDoctors } from "@/services/doctorDirectoryService";
import { useApiResource } from "@/hooks/useApiResource";
import { clockTime } from "@/lib/format/dateTime";
import { visitDay } from "@/lib/consultations/consultationTime";
import type { ConsultationDoctor } from "@/lib/consultations/consultationDoctors";
import type { Appointment } from "@/types/appointment";
import Avatar from "@/components/ui/Avatar";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../CarePage.module.css";
import drShort from "./drShort";

export default function DoctorSheet({ doctor, booked }: { doctor: ConsultationDoctor; booked: Appointment | null }) {
  const directory = useApiResource("bookable-doctors", listBookableDoctors);
  const profile = directory.data?.find((d) => String(d.id) === doctor.doctorId) ?? null;
  const languages = profile?.languages ?? [];
  return (
    <div className={styles.sheetBody}>
      <div className={styles.bio}>
        <Avatar name={doctor.name} src={doctor.photoUrl ?? profile?.photoUrl} size={72} />
        <div className={styles.bioText}>
          <p className={styles.bioRole}>Your doctor</p>
          {profile?.qualifications && <p className={styles.bioQual}>{profile.qualifications}</p>}
        </div>
      </div>
      {(doctor.specialization || profile?.specialization) && <p className={styles.bioSpec}>{doctor.specialization || profile?.specialization}</p>}
      {profile?.about && <p className={styles.text}>{profile.about}</p>}
      {(profile?.experience || languages.length > 0) && (
        <dl className={styles.facts}>
          {profile?.experience && (
            <div>
              <dt>Experience</dt>
              <dd className="num">{profile.experience}</dd>
            </div>
          )}
          {languages.length > 0 && (
            <div className={styles.wide}>
              <dt>Speaks</dt>
              <dd>{languages.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}
      <div className={styles.actions}>
        {doctor.doctorId && (
          <Link href={`/dashboard/messages/${doctor.doctorId}`} className={`btn ${formStyles.go}`}>
            <span>Message {drShort(doctor.name)}</span>
            <span className="well" aria-hidden="true">
              <ChatCircleText size={18} />
            </span>
          </Link>
        )}
        {booked ? (
          <Link href="/dashboard/appointments" className={`btn btn--ghost ${styles.pill}`}>
            Booked {visitDay(booked.startsAt)}, {clockTime(new Date(booked.startsAt))}
            <CaretRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <Link href="/dashboard/appointments/book" className={`btn btn--ghost ${styles.pill}`}>
            Book a consultation
          </Link>
        )}
      </div>
    </div>
  );
}

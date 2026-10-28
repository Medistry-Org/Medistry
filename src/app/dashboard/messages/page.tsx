"use client";

/**
 * Messages: the doctors the patient has consultations with, one conversation each.
 * Data: GET /api/appointments/patient (one row per doctor).
 */

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { listMyAppointments } from "@/services/appointmentService";
import { useApiResource } from "@/hooks/useApiResource";
import { doctorsFrom } from "@/lib/consultations/consultationDoctors";
import PageHead from "@/components/ui/PageHead";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ErrorNotice from "@/components/ui/ErrorNotice";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "./MessagesPage.module.css";

export default function MessagesPage() {
  const appointments = useApiResource("my-appointments", listMyAppointments);
  const doctors = doctorsFrom(appointments.data ?? []).filter((doctor) => doctor.doctorId);

  return (
    <main className={`${layoutStyles.page} ${styles.page}`}>
      <PageHead title="Consultation messages" />

      {appointments.loading && !appointments.data && <LoadingSkeleton />}
      {appointments.error && <ErrorNotice message={appointments.error} onRetry={appointments.reload} />}

      {appointments.data && (
        <Card title="My doctors" className={styles.card}>
          {doctors.length === 0 ? (
            <>
              <p className={styles.empty}>No doctors yet. Book an appointment first, then you can message your doctor here.</p>
              <Link href="/dashboard/appointments/book" className={formStyles.link}>
                Book a consultation <CaretRight size={15} />
              </Link>
            </>
          ) : (
            <ul className={styles.people}>
              {doctors.map((doctor) => (
                <li key={doctor.doctorId}>
                  <Link href={`/dashboard/messages/${doctor.doctorId}`} className={styles.row}>
                    <Avatar name={doctor.name} src={doctor.photoUrl} size={40} />
                    <span className={styles.rowText}>
                      <strong>{doctor.name}</strong>
                      {doctor.specialization && <span>{doctor.specialization}</span>}
                    </span>
                    <CaretRight size={16} className={styles.go} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </main>
  );
}

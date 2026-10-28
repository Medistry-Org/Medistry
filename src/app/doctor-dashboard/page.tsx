"use client";

/*
  Today (Arhaan's clinician Today): who is next, what is waiting on the doctor, and the day in
  order. On a closed day or after the last call, the next working day's first patient leads.
  Real data: the day's consultations (GET /api/appointments/doctor?date=) and, when nothing is left
  today, every consultation to find the next one. Proposed: the queue and the next patient's record.
*/

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { clockTime, toApiDate, weekdayDayMonth } from "@/lib/format/dateTime";
import { listAllAppointments, listAppointmentsOn } from "@/services/doctorPortalService";
import { getPatientRecord, listWaitingItems } from "@/services/patientRecordService";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import AppointmentRow, { appointmentListClass, isInProgress } from "./components/AppointmentRow";
import NextPatientCard from "./components/NextPatientCard";
import WaitingQueue from "./components/WaitingQueue";
import { flagsByPatient } from "./components/waitingWords";
import styles from "./TodayPage.module.css";

export default function TodayPage() {
  const now = useNow(60_000);
  const [today] = useState(() => new Date());
  const day = useApiResource(`doctor-day-${toApiDate(today)}`, () => listAppointmentsOn(today));
  const queue = useApiResource("doctor-queue", listWaitingItems);

  const appointments = day.data ?? [];
  const live = appointments.find((a) => isInProgress(a, now)) ?? appointments.find((a) => a.status === "BOOKED" && Date.parse(a.startsAt) > now);
  // nothing left today: the next working day's first patient leads instead
  const all = useApiResource(day.data && !live ? "doctor-all-appointments" : null, listAllAppointments);
  const later = (all.data ?? []).find((a) => a.status === "BOOKED" && Date.parse(a.startsAt) > now && new Date(a.startsAt).toDateString() !== today.toDateString());
  const next = live ?? (appointments.length === 0 ? later : undefined);
  const record = useApiResource(next?.patientId ? `record-${next.patientId}` : null, () => getPatientRecord(next?.patientId ?? ""));

  if (day.error && !day.data) {
    return (
      <main className={clinicStyles.page}>
        <ErrorNotice message={day.error} onRetry={day.reload} />
      </main>
    );
  }
  if (!day.data) {
    return (
      <main className={clinicStyles.page}>
        <LoadingSkeleton />
      </main>
    );
  }

  const waiting = queue.data ?? null;
  const flags = flagsByPatient(waiting ?? []);
  const done = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <main className={clinicStyles.page}>
      <div className={clinicStyles.hello}>
        <h1 className={clinicStyles.h1}>Today</h1>
        <p className={clinicStyles.sub}>
          {weekdayDayMonth.format(today)}. <span className="num">{appointments.length}</span> consultations, <span className="num">{done}</span> done
          {waiting && (
            <>
              , <span className="num">{waiting.length}</span> waiting on you
            </>
          )}
          .
        </p>
      </div>
      {queue.error && <ErrorNotice message={queue.error} onRetry={queue.reload} />}

      <div className={styles.todayGrid} data-quiet={!next}>
        {/* when the day's consultations are done, the plate steps aside and the queue leads */}
        {next && <NextPatientCard appointment={next} record={record.data ?? null} inProgress={isInProgress(next, now)} notToday={!live} now={now} />}

        <WaitingQueue items={queue.loading && !queue.data ? undefined : waiting} now={now} />

        <section className={`${clinicStyles.panel} ${styles.dayList}`} aria-labelledby="day-heading">
          <div className={clinicStyles.panelHead}>
            <h2 id="day-heading" className={clinicStyles.h2}>
              The day
            </h2>
            <Link href="/doctor-dashboard/schedule" className={clinicStyles.textLink}>
              Month <ArrowRight size={15} />
            </Link>
          </div>
          {appointments.length === 0 && (
            <p className={clinicStyles.empty}>
              No consultations today.
              {later ? ` Next: ${later.patientName}, ${weekdayDayMonth.format(new Date(later.startsAt))} at ${clockTime(new Date(later.startsAt))}.` : ""}
            </p>
          )}
          <ol className={appointmentListClass}>
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentRow appointment={appointment} now={now} flag={appointment.patientId ? flags.get(appointment.patientId) : undefined} from="today" />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

"use client";

/*
  Schedule (Arhaan's clinician Schedule): the month with how full each day is, and the picked day's
  consultations beside it. Every consultation comes from GET /api/appointments/doctor in one call,
  grouped by day here, so each day in the calendar shows its own count.
*/

import { useMemo, useState } from "react";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { shortDate, weekdayShort } from "@/lib/format/dateTime";
import { listAllAppointments } from "@/services/doctorPortalService";
import type { Appointment } from "@/types/appointment";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import AppointmentRow, { appointmentListClass } from "../components/AppointmentRow";
import MonthCalendar from "./components/MonthCalendar";
import styles from "./SchedulePage.module.css";

const monthOnly = new Intl.DateTimeFormat("en-IN", { month: "long" });

/** The date, always, so this panel never reads as the Today page. */
function dayLabel(dayKey: string) {
  const iso = new Date(dayKey).toISOString();
  return `${dayKey === new Date().toDateString() ? "Today, " : ""}${weekdayShort(iso)} ${shortDate(iso)}`;
}

export default function SchedulePage() {
  const now = useNow(60_000);
  const appointments = useApiResource("doctor-all-appointments", listAllAppointments);
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState(() => new Date().toDateString());

  const firstOfMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + offset, 1);
  }, [offset]);

  const byDay = useMemo(() => {
    const days = new Map<string, Appointment[]>();
    for (const appointment of appointments.data ?? []) {
      const key = new Date(appointment.startsAt).toDateString();
      days.set(key, [...(days.get(key) ?? []), appointment]);
    }
    return days;
  }, [appointments.data]);

  if (appointments.error && !appointments.data) {
    return (
      <main className={clinicStyles.page}>
        <ErrorNotice message={appointments.error} onRetry={appointments.reload} />
      </main>
    );
  }
  if (!appointments.data) {
    return (
      <main className={clinicStyles.page}>
        <LoadingSkeleton />
      </main>
    );
  }

  const inMonth = appointments.data.filter((a) => {
    const at = new Date(a.startsAt);
    return at.getFullYear() === firstOfMonth.getFullYear() && at.getMonth() === firstOfMonth.getMonth();
  });
  const people = new Set(inMonth.map((a) => a.patientId).filter(Boolean)).size;
  const list = byDay.get(picked) ?? [];

  const move = (months: number) => {
    const nextOffset = months === 0 ? 0 : offset + months;
    setOffset(nextOffset);
    const today = new Date();
    if (nextOffset === 0) return setPicked(today.toDateString());
    // land on the first open day of the month, never a closed Sunday
    const first = new Date(today.getFullYear(), today.getMonth() + nextOffset, 1);
    while (first.getDay() === 0) first.setDate(first.getDate() + 1);
    setPicked(first.toDateString());
  };

  return (
    <main className={clinicStyles.page}>
      <div className={clinicStyles.hello}>
        <h1 className={clinicStyles.h1}>Schedule</h1>
        <p className={clinicStyles.sub}>
          <span className="num">{inMonth.length}</span> consultations in {monthOnly.format(firstOfMonth)}, with <span className="num">{people}</span> {people === 1 ? "person" : "people"}.
        </p>
      </div>

      <div className={styles.schedGrid}>
        <MonthCalendar firstOfMonth={firstOfMonth} isThisMonth={offset === 0} picked={picked} countOn={(key) => byDay.get(key)?.length ?? 0} onPick={setPicked} onMove={move} />

        <section className={clinicStyles.panel} aria-labelledby="picked-day-heading">
          <div className={clinicStyles.panelHead}>
            <h2 id="picked-day-heading" className={clinicStyles.h2}>
              {dayLabel(picked)}
            </h2>
            <span className={`${clinicStyles.count} num`}>{list.length}</span>
          </div>
          {list.length ? (
            <ol className={appointmentListClass}>
              {list.map((appointment) => (
                <li key={appointment.id}>
                  <AppointmentRow appointment={appointment} now={now} from="schedule" />
                </li>
              ))}
            </ol>
          ) : (
            <p className={clinicStyles.empty}>No consultations on this day.</p>
          )}
        </section>
      </div>
    </main>
  );
}

/** How long a consultation runs and whether it is under way or still to come, the same way on every screen. */

import { relativeDayName, shortDate } from "@/lib/format/dateTime";
import type { Appointment } from "@/types/appointment";

const DEFAULT_MINUTES = 30;

/** The consultation's length in minutes, from its end time when the backend gives one. */
export function consultationMinutes(appointment: Appointment) {
  if (!appointment.endsAt) return DEFAULT_MINUTES;
  const minutes = Math.round(
    (new Date(appointment.endsAt).getTime() -
      new Date(appointment.startsAt).getTime()) /
      6e4,
  );
  return minutes > 0 ? minutes : DEFAULT_MINUTES;
}

/** Booked and not over yet. */
export function isUpcomingConsultation(appointment: Appointment, now: number) {
  return (
    appointment.status === "BOOKED" &&
    new Date(appointment.startsAt).getTime() +
      consultationMinutes(appointment) * 6e4 >
      now
  );
}

/** Booked and under way: from its start until its end (or 30 minutes when the end is unknown). */
export const isInProgress = (appointment: Appointment, now: number) =>
  appointment.status === "BOOKED" &&
  now >= Date.parse(appointment.startsAt) &&
  now <
    (appointment.endsAt
      ? Date.parse(appointment.endsAt)
      : Date.parse(appointment.startsAt) + DEFAULT_MINUTES * 6e4);

/** "Today", "Tomorrow", or "Thu 30 Oct": the day of a booked consultation. */
export function visitDay(iso: string) {
  const name = relativeDayName(iso);
  return name === "Today" || name === "Tomorrow"
    ? name
    : `${name} ${shortDate(iso)}`;
}

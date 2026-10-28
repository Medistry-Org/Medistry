/*
  Where the patient stands, worked out from their real consultations and plan: before the first
  consultation, after it (a plan to choose), or in a programme. Home's next-step line and its third
  card both read this, so they never disagree.
*/

import {
  relativeDayName,
  shortDate,
  weekdayShort,
} from "@/lib/format/dateTime";
import type { Appointment } from "@/types/appointment";

export type CareStage = "before-consultation" | "choose-plan" | "in-programme";

/** A consultation's length in minutes: from its end time, else the standard 30. */
export function consultationMinutes(appointment: Appointment) {
  if (!appointment.endsAt) return 30;
  return Math.max(
    1,
    Math.round(
      (new Date(appointment.endsAt).getTime() -
        new Date(appointment.startsAt).getTime()) /
        6e4,
    ),
  );
}

const endsAt = (appointment: Appointment) =>
  new Date(appointment.startsAt).getTime() +
  consultationMinutes(appointment) * 6e4;

/** The next booked consultation that has not ended yet, or null. */
export function upcomingConsultation(
  appointments: Appointment[],
  now: number,
): Appointment | null {
  return (
    appointments.find(
      (appointment) =>
        appointment.status === "BOOKED" && endsAt(appointment) > now,
    ) ?? null
  );
}

export function careStageOf(
  appointments: Appointment[],
  planActive: boolean,
  now: number,
): CareStage {
  if (planActive) return "in-programme";
  const consulted = appointments.some(
    (appointment) =>
      appointment.status === "COMPLETED" ||
      (appointment.status === "BOOKED" && endsAt(appointment) <= now),
  );
  return consulted ? "choose-plan" : "before-consultation";
}

/** "Dr. Sharma" from "Dr. Priya Sharma"; null when the backend gave no real name. */
export function doctorShortName(fullName: string) {
  const surname = fullName
    .replace(/^Dr\.?\s+/, "")
    .trim()
    .split(" ")
    .at(-1);
  return surname && fullName !== "Your doctor" ? `Dr. ${surname}` : null;
}

/** "Today", "Tomorrow" or "Mon 12 Oct": short enough for one line on the smallest phone. */
export function dayLabel(iso: string) {
  const near = relativeDayName(iso);
  return near === "Today" || near === "Tomorrow"
    ? near
    : `${weekdayShort(iso)} ${shortDate(iso)}`;
}

/** Whether the plan status from the profile means a running programme. */
export const isPlanActive = (planStatus: string) =>
  planStatus.trim().toLowerCase() === "active";

/**
 * Consultations, from the patient's side.
 *   GET /api/schedule/slots/:doctorId/:date   a doctor's slots on a day (YYYY-MM-DD)
 *   PUT /api/schedule/book                    { slotId, consultationType, reason }
 *   GET /api/appointments/patient             the patient's consultations
 * toAppointment() is also used by doctorPortalService, so both dashboards read one shape.
 */

import { apiRequest, listFrom } from "@/lib/http/apiClient";
import { combineDateAndTime, toApiDate } from "@/lib/format/dateTime";
import type { Appointment, AppointmentStatus, BookSlotRequest, DoctorSlot } from "@/types/appointment";

type RawSlot = { SlotId: number; StartTime: string; EndTime: string; Status?: string };

/** The backend's appointment row. Fields differ a little between the patient and doctor lists. */
export type RawAppointment = {
  AppointmentId?: number | string;
  id?: number | string;
  DoctorId?: number | string;
  DoctorName?: string;
  DoctorPhoto?: string;
  Specialization?: string;
  PatientId?: number | string;
  FirstName?: string;
  PatientName?: string;
  PatientPhone?: string;
  Age?: number | string;
  Gender?: string;
  Status?: string;
  ConsultationType?: string;
  Reason?: string;
  SlotDate?: string;
  AppointmentDate?: string;
  StartTime?: string;
  EndTime?: string;
};

function toStatus(raw?: string): AppointmentStatus {
  const value = String(raw ?? "").toLowerCase();
  if (value === "completed") return "COMPLETED";
  if (value === "cancelled" || value === "canceled") return "CANCELLED";
  return "BOOKED";
}

/** Maps a raw appointment row. `fallbackDate` is used when the row carries only a time. */
export function toAppointment(raw: RawAppointment, fallbackDate?: string): Appointment {
  const date = (raw.SlotDate ?? raw.AppointmentDate ?? fallbackDate ?? toApiDate(new Date())).slice(0, 10);
  const patientName = raw.PatientName ?? raw.FirstName ?? (raw.PatientPhone ? `Patient ${raw.PatientPhone.slice(-4)}` : "Patient");
  return {
    id: String(raw.AppointmentId ?? raw.id ?? ""),
    doctorId: raw.DoctorId != null ? String(raw.DoctorId) : null,
    doctorName: raw.DoctorName ?? "Your doctor",
    doctorPhotoUrl: raw.DoctorPhoto ?? null,
    doctorSpecialization: raw.Specialization ?? "",
    patientId: raw.PatientId != null ? String(raw.PatientId) : null,
    patientName,
    patientAge: raw.Age != null && raw.Age !== "" ? Number(raw.Age) : null,
    patientSex: raw.Gender ?? "",
    patientMobile: raw.PatientPhone ?? "",
    startsAt: combineDateAndTime(date, raw.StartTime ?? "00:00"),
    endsAt: raw.EndTime ? combineDateAndTime(date, raw.EndTime) : null,
    consultationType: raw.ConsultationType === "Clinic" ? "Clinic" : "Virtual",
    status: toStatus(raw.Status),
    reason: raw.Reason ?? "",
  };
}

export async function listDoctorSlots(doctorId: number, day: Date): Promise<DoctorSlot[]> {
  const date = toApiDate(day);
  const body = await apiRequest(`/api/schedule/slots/${doctorId}/${date}`, { authenticated: false });
  return listFrom<RawSlot>(body)
    .filter((slot) => !slot.Status || slot.Status.toLowerCase() === "available")
    .map((slot) => ({
      slotId: Number(slot.SlotId),
      date,
      startTime: slot.StartTime.slice(0, 5),
      endTime: slot.EndTime?.slice(0, 5) ?? "",
      startsAt: combineDateAndTime(date, slot.StartTime),
    }))
    .filter((slot) => slot.slotId && new Date(slot.startsAt).getTime() > Date.now());
}

export async function bookSlot(request: BookSlotRequest): Promise<void> {
  await apiRequest("/api/schedule/book", { method: "PUT", body: request });
}

export async function listMyAppointments(): Promise<Appointment[]> {
  const body = await apiRequest("/api/appointments/patient");
  return listFrom<RawAppointment>(body, "appointments")
    .map((raw) => toAppointment(raw))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

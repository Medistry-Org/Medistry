/**
 * The signed-in doctor's own data: profile, consultations and patients.
 * Doc: docs/backend/doctor-dashboard.md
 *   GET /api/doctor/me                              the signed-in doctor
 *   GET /api/appointments/doctor?date=YYYY-MM-DD    the doctor's consultations on one day
 *   GET /api/appointments/doctor                    every consultation of the doctor
 *   GET /api/doctor/patients                        the doctor's patients
 */

import { apiRequest, listFrom } from "@/lib/http/apiClient";
import { toApiDate } from "@/lib/format/dateTime";
import {
  toAppointment,
  type RawAppointment,
} from "@/services/appointmentService";
import type { Appointment } from "@/types/appointment";
import type { DoctorPatient, DoctorProfile } from "@/types/doctor";

type RawPatient = {
  id?: number | string;
  PatientId?: number | string;
  fullName?: string;
  FullName?: string;
  FirstName?: string;
  age?: number | string;
  Age?: number | string;
  gender?: string;
  Gender?: string;
  mobile?: string;
  Phone?: string;
  PatientPhone?: string;
};

const byStartTime = (first: Appointment, second: Appointment) =>
  first.startsAt.localeCompare(second.startsAt);

export async function getMyDoctorProfile(): Promise<DoctorProfile> {
  const body = await apiRequest<{ data?: Record<string, unknown> }>(
    "/api/doctor/me",
  );
  const raw = (body.data ?? body) as Record<string, unknown>;
  return {
    id: (raw.id ?? raw.DoctorId) ? Number(raw.id ?? raw.DoctorId) : null,
    fullName: String(raw.fullName ?? raw.FullName ?? "Doctor"),
    specialization: String(raw.specialization ?? raw.Specialization ?? ""),
    photoUrl: (raw.photoUrl ?? raw.ProfileImageUrl ?? null) as string | null,
  };
}

export async function listAppointmentsOn(day: Date): Promise<Appointment[]> {
  const date = toApiDate(day);
  const body = await apiRequest("/api/appointments/doctor", {
    query: { date },
  });
  return listFrom<RawAppointment>(body, "appointments")
    .map((raw) => toAppointment(raw, date))
    .sort(byStartTime);
}

export async function listAllAppointments(): Promise<Appointment[]> {
  const body = await apiRequest("/api/appointments/doctor");
  return listFrom<RawAppointment>(body, "appointments")
    .map((raw) => toAppointment(raw))
    .sort(byStartTime);
}

export async function listMyPatients(): Promise<DoctorPatient[]> {
  const body = await apiRequest("/api/doctor/patients");
  return listFrom<RawPatient>(body, "patients").map((raw) => ({
    id: String(raw.id ?? raw.PatientId ?? ""),
    fullName: raw.fullName ?? raw.FullName ?? raw.FirstName ?? "Patient",
    age: (raw.age ?? raw.Age) ? Number(raw.age ?? raw.Age) : null,
    sex: raw.gender ?? raw.Gender ?? "",
    mobile: raw.mobile ?? raw.Phone ?? raw.PatientPhone ?? "",
  }));
}

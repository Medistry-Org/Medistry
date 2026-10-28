/**
 * The doctors a patient has consultations with, once each, from their appointment list (the care
 * team on Care, the conversations on Messages). The newest consultation's details win.
 */

import type { Appointment } from "@/types/appointment";

export type ConsultationDoctor = {
  doctorId: string | null;
  name: string;
  photoUrl: string | null;
  specialization: string;
};

export function doctorsFrom(appointments: Appointment[]): ConsultationDoctor[] {
  const byDoctor = new Map<string, ConsultationDoctor>();
  [...appointments]
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .forEach((appointment) => {
      const key = appointment.doctorId ?? appointment.doctorName;
      if (byDoctor.has(key)) return;
      byDoctor.set(key, {
        doctorId: appointment.doctorId,
        name: appointment.doctorName,
        photoUrl: appointment.doctorPhotoUrl,
        specialization: appointment.doctorSpecialization,
      });
    });
  return [...byDoctor.values()];
}

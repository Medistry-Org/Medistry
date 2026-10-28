/*
  The patient's care-team doctors, for Care, Messages and the chat header. The doctor of the first
  consultation joins the care team on the backend (GET /api/care-team); until that endpoint exists
  the doctors come from the patient's consultations, as before. Patients never see a directory.
*/

import {
  doctorsFrom,
  type ConsultationDoctor,
} from "@/lib/consultations/consultationDoctors";
import { listMyAppointments } from "@/services/appointmentService";
import { getMyCareTeam } from "@/services/careTeamService";
import type { DoctorSummary } from "@/types/doctor";

/** A care-team doctor; `profile` is the backend's full card when the care team sends one. */
export type CareTeamDoctor = ConsultationDoctor & {
  profile: DoctorSummary | null;
};

export async function loadCareTeamDoctors(): Promise<CareTeamDoctor[]> {
  const team = await getMyCareTeam();
  if (team) {
    const { doctor } = team;
    return doctor
      ? [
          {
            doctorId: String(doctor.id),
            name: doctor.fullName,
            photoUrl: doctor.photoUrl,
            specialization: doctor.specialization,
            profile: doctor,
          },
        ]
      : [];
  }
  return doctorsFrom(await listMyAppointments()).map((doctor) => ({
    ...doctor,
    profile: null,
  }));
}

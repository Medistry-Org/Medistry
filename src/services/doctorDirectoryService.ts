/**
 * Doctors that patients can see and book.
 *   GET /api/doctors                 the booking list (PascalCase fields)
 *   GET /api/doctors/dashboard-list  the directory cards (camelCase, professionalDetails)
 * Both are mapped to one DoctorSummary so the screens never see the difference.
 */

import { apiRequest, listFrom } from "@/lib/http/apiClient";
import type { DoctorSummary } from "@/types/doctor";

type RawDoctor = {
  id?: number;
  DoctorId?: number;
  fullName?: string;
  FullName?: string;
  photoUrl?: string | null;
  ProfileImageUrl?: string | null;
  rating?: number | null;
  Rating?: number | null;
  consultationFee?: number | null;
  ConsultationFee?: number | null;
  Specialization?: string;
  ExperienceYears?: number;
  professionalDetails?: { specialization?: string; qualifications?: string; experience?: string; languages?: string[]; about?: string };
};

function toDoctorSummary(raw: RawDoctor): DoctorSummary {
  const details = raw.professionalDetails ?? {};
  return {
    id: Number(raw.id ?? raw.DoctorId),
    fullName: raw.fullName ?? raw.FullName ?? "Doctor",
    photoUrl: raw.photoUrl ?? raw.ProfileImageUrl ?? null,
    specialization: details.specialization ?? raw.Specialization ?? "",
    qualifications: details.qualifications ?? "",
    experience: details.experience ?? (raw.ExperienceYears ? `${raw.ExperienceYears} years` : ""),
    languages: details.languages ?? [],
    about: details.about ?? "",
    consultationFee: raw.consultationFee ?? raw.ConsultationFee ?? null,
    rating: raw.rating ?? raw.Rating ?? null,
  };
}

export async function listBookableDoctors(): Promise<DoctorSummary[]> {
  const body = await apiRequest("/api/doctors", { authenticated: false });
  return listFrom<RawDoctor>(body, "doctors").map(toDoctorSummary);
}

export async function listDirectoryDoctors(): Promise<DoctorSummary[]> {
  const body = await apiRequest("/api/doctors/dashboard-list", { authenticated: false });
  return listFrom<RawDoctor>(body, "doctors").map(toDoctorSummary);
}

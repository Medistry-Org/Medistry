/** Doctors: as patients see them, and the signed-in doctor's own data. */

/** A doctor as patients see them: the care-team card and the doctor sheet on Care. */
export type DoctorSummary = {
  id: number;
  fullName: string;
  photoUrl: string | null;
  specialization: string;
  qualifications: string;
  experience: string;
  languages: string[];
  about: string;
  consultationFee: number | null;
  rating: number | null;
};

/** The patient's care team (GET /api/care-team). `doctor` is null until the first consultation. */
export type CareTeam = { doctor: DoctorSummary | null };

/** The signed-in doctor (GET /api/doctor/me). */
export type DoctorProfile = {
  id: number | null;
  fullName: string;
  specialization: string;
  photoUrl: string | null;
};

/** A patient in the doctor's list (GET /api/doctor/patients). */
export type DoctorPatient = {
  id: string;
  fullName: string;
  age: number | null;
  sex: string;
  mobile: string;
};

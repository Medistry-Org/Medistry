/** A doctor as patients see them: the directory card and the booking picker. */
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

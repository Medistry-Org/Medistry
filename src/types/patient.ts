/** The patient's own profile (GET /api/patient/profile). Height in cm, weight in kg. */
export type PatientProfile = {
  patientId: number | null;
  fullName: string;
  email: string;
  phone: string;
  age: number | null;
  conditions: string;
  heightCm: number | null;
  weightKg: number | null;
  planName: string;
  planStatus: string;
  remindersEnabled: boolean;
  whatsappReminders: boolean;
  emailReminders: boolean;
  consentGiven: boolean;
};

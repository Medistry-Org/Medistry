/** One weight reading the patient logged (GET/POST /api/trackers/weight). Weight in kg. */
export type WeightReading = {
  id: string;
  weightKg: number;
  loggedAt: string; // ISO
};

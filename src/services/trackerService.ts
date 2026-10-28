/**
 * The patient's own trackers. PROPOSED endpoints: the backend does not have them yet
 * (see docs/backend/patient-dashboard.md).
 *   GET    /api/trackers/weight       the patient's weight readings
 *   POST   /api/trackers/weight       { weightKg }  -> the saved reading
 *   DELETE /api/trackers/weight/:id   undo a reading just logged
 */

import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import type { WeightReading } from "@/types/tracker";

type RawReading = { id?: number | string; ReadingId?: number | string; weightKg?: number | string; WeightKg?: number | string; loggedAt?: string; LoggedAt?: string };

function toWeightReading(raw: RawReading): WeightReading {
  return {
    id: String(raw.id ?? raw.ReadingId ?? ""),
    weightKg: Number(raw.weightKg ?? raw.WeightKg),
    loggedAt: String(raw.loggedAt ?? raw.LoggedAt ?? new Date().toISOString()),
  };
}

/** The readings, oldest first, or null while the backend does not have this endpoint yet. */
export async function listWeightReadings(): Promise<WeightReading[] | null> {
  try {
    const body = await apiRequest("/api/trackers/weight");
    return listFrom<RawReading>(body, "readings")
      .map(toWeightReading)
      .filter((reading) => Number.isFinite(reading.weightKg))
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  } catch (error) {
    if (error instanceof ApiError && error.isMissingEndpoint) return null;
    throw error;
  }
}

export async function logWeight(weightKg: number): Promise<WeightReading> {
  const body = await apiRequest<{ data?: RawReading }>("/api/trackers/weight", { method: "POST", body: { weightKg } });
  return toWeightReading(body.data ?? { weightKg });
}

export async function deleteWeightReading(id: string): Promise<void> {
  await apiRequest(`/api/trackers/weight/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * The patient's care team. The backend adds the doctor who held the first consultation; later
 * bookings use only that doctor's slots. Doc: docs/backend/patient-dashboard.md
 *   GET /api/care-team   PROPOSED. The care-team doctor -> { data: { doctor: DoctorSummary | null } }
 */

import { ApiError, apiRequest } from "@/lib/http/apiClient";
import type { CareTeam } from "@/types/doctor";

/** null when the backend does not have the endpoint yet. */
export async function getMyCareTeam(): Promise<CareTeam | null> {
  try {
    const body = await apiRequest<{ data?: CareTeam }>("/api/care-team");
    return { doctor: body.data?.doctor ?? null };
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

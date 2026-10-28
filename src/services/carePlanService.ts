/**
 * The patient's treatment for the Care tab. PROPOSED endpoints (not on the backend yet; see
 * docs/backend/consultations-and-care.md):
 *   GET /api/care/prescription/current   -> { data: Prescription | null }
 *   GET /api/care/medicine-orders        -> { data: MedicineOrder[] }  newest first
 * Until they exist (404) the Care tab says so instead of showing anything made up.
 */

import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import type { CarePlan, MedicineOrder, Prescription } from "@/types/carePlan";

export async function loadCarePlan(): Promise<CarePlan> {
  try {
    const [prescriptionBody, ordersBody] = await Promise.all([
      apiRequest<{ data?: Prescription | null }>("/api/care/prescription/current"),
      apiRequest("/api/care/medicine-orders"),
    ]);
    return {
      available: true,
      prescription: prescriptionBody.data ?? null,
      orders: listFrom<MedicineOrder>(ordersBody, "orders"),
    };
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return { available: false, prescription: null, orders: [] };
    throw caught;
  }
}

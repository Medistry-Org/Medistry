/**
 * Changing a booked consultation. PROPOSED endpoint (not on the backend yet; see
 * docs/backend/consultations-and-care.md):
 *   PATCH /api/appointments/:appointmentId/reschedule  { slotId }  moves it to another of the same doctor's slots
 * A 404 means the backend does not offer it yet; the Appointments page says so.
 */

import { apiRequest } from "@/lib/http/apiClient";

export async function rescheduleAppointment(appointmentId: string, slotId: number): Promise<void> {
  await apiRequest(`/api/appointments/${appointmentId}/reschedule`, { method: "PATCH", body: { slotId } });
}

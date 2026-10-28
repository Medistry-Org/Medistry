/**
 * The video call for a consultation (100ms room behind the backend).
 *   GET  /api/video/appointments/:appointmentId/join  -> { data: { joinLink, role } }
 *   POST /api/video/appointments/:appointmentId/end   (doctor only) ends it for everyone
 */

import { apiRequest } from "@/lib/http/apiClient";

export type VideoRoom = { joinLink: string; role: "doctor" | "patient" };

export async function joinVideoConsultation(appointmentId: string): Promise<VideoRoom> {
  const body = await apiRequest<{ data?: { joinLink?: string; role?: string } }>(`/api/video/appointments/${appointmentId}/join`);
  if (!body.data?.joinLink) throw new Error("The call link is not ready yet. Try again in a minute.");
  return { joinLink: body.data.joinLink, role: body.data.role === "doctor" ? "doctor" : "patient" };
}

export async function endVideoConsultation(appointmentId: string): Promise<void> {
  await apiRequest(`/api/video/appointments/${appointmentId}/end`, { method: "POST" });
}

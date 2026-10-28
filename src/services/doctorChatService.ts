/**
 * The doctor's list of patient chats. Messages travel on the same Socket.IO session as the
 * patient's (chatService.connectToChatSession); earlier ones come from chatService.listChatHistory.
 * Doc: docs/backend/doctor-dashboard.md
 *   GET    /api/chat/doctor/sessions                       PROPOSED. Every patient chat for this doctor
 *   POST   /api/chat/sessions/:sessionId/read              PROPOSED. The doctor opened the chat
 *   POST   /api/chat/sessions/:sessionId/no-reply-needed   PROPOSED. Sets the waiting messages aside
 *   DELETE /api/chat/sessions/:sessionId/no-reply-needed   PROPOSED. Undoes that
 */

import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import type { DoctorChatSession } from "@/types/chat";

/** null while the backend does not offer it (404), so the screen can say so. */
export async function listMyChatSessions(): Promise<
  DoctorChatSession[] | null
> {
  try {
    const body = await apiRequest("/api/chat/doctor/sessions");
    return listFrom<DoctorChatSession>(body, "sessions").map((raw) => ({
      ...raw,
      sessionId: Number(raw.sessionId),
      patientId: String(raw.patientId),
      lastMessage: raw.lastMessage ?? null,
      waitingSince: raw.waitingSince ?? null,
      urgent: !!raw.urgent,
      unread: !!raw.unread,
    }));
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

export async function markChatRead(sessionId: number): Promise<void> {
  await apiRequest(`/api/chat/sessions/${sessionId}/read`, { method: "POST" });
}

export async function markNoReplyNeeded(sessionId: number): Promise<void> {
  await apiRequest(`/api/chat/sessions/${sessionId}/no-reply-needed`, {
    method: "POST",
  });
}

export async function undoNoReplyNeeded(sessionId: number): Promise<void> {
  await apiRequest(`/api/chat/sessions/${sessionId}/no-reply-needed`, {
    method: "DELETE",
  });
}

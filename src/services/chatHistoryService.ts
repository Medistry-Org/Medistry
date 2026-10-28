/**
 * Earlier messages in a consultation chat (the socket in chatService only carries new ones).
 * PROPOSED endpoint (not on the backend yet; see docs/backend/consultations-and-care.md):
 *   GET /api/chat/sessions/:sessionId/messages  -> { data: ChatMessage[] }  oldest first
 * Returns null while the backend does not offer it (404), so the chat can say so.
 */

import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import type { ChatMessage } from "@/types/chat";

export async function listChatHistory(sessionId: number): Promise<ChatMessage[] | null> {
  try {
    const body = await apiRequest(`/api/chat/sessions/${sessionId}/messages`);
    return listFrom<ChatMessage>(body, "messages").map((message) => ({ ...message, sentAt: message.sentAt ?? new Date().toISOString() }));
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

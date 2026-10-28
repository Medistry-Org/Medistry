/**
 * Consultation chat between a patient and their doctor (both dashboards).
 * Doc: docs/backend/consultations-and-care.md
 *   POST /api/chat/init                           starts a session { doctorId } -> { sessionId } (needs an active appointment)
 *   GET  /api/chat/sessions/:sessionId/messages   PROPOSED. Earlier messages, oldest first -> { data: ChatMessage[] }
 * New messages travel over Socket.IO (SOCKET_URL, auth { token }), opened by connectToChatSession():
 *   emit "join_consultation"              sessionId, sent on every (re)connect
 *   emit "send_consultation_message"      { ...ChatMessage, sessionId } (without sentAt)
 *   on   "receive_consultation_message"   ChatMessage, a new message from either side
 *   on   "error_message"                  { message }, a message the server refused
 */

import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/config/env";
import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import { getAccessToken } from "@/lib/session/authSession";
import type { ChatMessage } from "@/types/chat";

/** The server may leave out sentAt; the arrival time stands in. */
const withSentAt = (message: ChatMessage): ChatMessage => ({
  ...message,
  sentAt: message.sentAt ?? new Date().toISOString(),
});

export async function startChatSession(doctorId: number): Promise<number> {
  const body = await apiRequest<{
    sessionId?: number;
    data?: { sessionId?: number };
  }>("/api/chat/init", { method: "POST", body: { doctorId } });
  const sessionId = body.sessionId ?? body.data?.sessionId;
  if (!sessionId) throw new Error("Chat could not start. Please try again.");
  return sessionId;
}

/** null while the backend does not offer it (404), so the chat can say so. */
export async function listChatHistory(
  sessionId: number,
): Promise<ChatMessage[] | null> {
  try {
    const body = await apiRequest(`/api/chat/sessions/${sessionId}/messages`);
    return listFrom<ChatMessage>(body, "messages").map(withSentAt);
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

/** A live connection to one chat session. Call close() when the screen unmounts. */
export function connectToChatSession(
  sessionId: number,
  handlers: {
    onMessage: (message: ChatMessage) => void;
    onError: (message: string) => void;
  },
) {
  const socket: Socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    auth: { token: getAccessToken() },
  });
  socket.on("receive_consultation_message", (message: ChatMessage) =>
    handlers.onMessage(withSentAt(message)),
  );
  socket.on("error_message", (error: { message?: string }) =>
    handlers.onError(error?.message ?? "The message was not sent."),
  );
  socket.on("connect", () => socket.emit("join_consultation", sessionId));
  socket.connect();

  return {
    send: (message: Omit<ChatMessage, "sessionId" | "sentAt">) =>
      socket.emit("send_consultation_message", { ...message, sessionId }),
    close: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}

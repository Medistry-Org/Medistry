/**
 * Consultation chat between a patient and their doctor.
 *   POST /api/chat/init { doctorId }  -> { sessionId }   (needs an active appointment)
 * Messages travel over Socket.IO (SOCKET_URL):
 *   emit "join_consultation" sessionId
 *   emit "send_consultation_message" ChatMessage
 *   on   "receive_consultation_message" ChatMessage
 *   on   "error_message" { message }
 */

import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/config/env";
import { apiRequest } from "@/lib/http/apiClient";
import { getAccessToken } from "@/lib/session/authSession";
import type { ChatMessage } from "@/types/chat";

export async function startChatSession(doctorId: number): Promise<number> {
  const body = await apiRequest<{ sessionId?: number; data?: { sessionId?: number } }>("/api/chat/init", { method: "POST", body: { doctorId } });
  const sessionId = body.sessionId ?? body.data?.sessionId;
  if (!sessionId) throw new Error("Chat could not start. Please try again.");
  return sessionId;
}

/** A live connection to one chat session. Call close() when the screen unmounts. */
export function connectToChatSession(
  sessionId: number,
  handlers: { onMessage: (message: ChatMessage) => void; onError: (message: string) => void },
) {
  const socket: Socket = io(SOCKET_URL, { autoConnect: false, transports: ["websocket"], auth: { token: getAccessToken() } });
  socket.on("receive_consultation_message", (message: ChatMessage) => handlers.onMessage({ ...message, sentAt: message.sentAt ?? new Date().toISOString() }));
  socket.on("error_message", (error: { message?: string }) => handlers.onError(error?.message ?? "The message was not sent."));
  socket.on("connect", () => socket.emit("join_consultation", sessionId));
  socket.connect();

  return {
    send: (message: Omit<ChatMessage, "sessionId" | "sentAt">) => socket.emit("send_consultation_message", { ...message, sessionId }),
    close: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}

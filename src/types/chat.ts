export type ChatRole = "PATIENT" | "DOCTOR";

/** One message on the consultation chat socket. */
export type ChatMessage = {
  sessionId: number;
  senderUserId: number;
  senderRole: ChatRole;
  messageType: "TEXT" | "FILE";
  messageText: string;
  fileUrl: string | null;
  sentAt: string; // ISO; the client stamps it if the server does not
};

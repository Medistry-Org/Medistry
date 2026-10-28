/** One patient's chat with the signed-in doctor, as the doctor's Messages list shows it. */
export type DoctorChatSession = {
  sessionId: number;
  patientId: string;
  patientName: string;
  lastMessage: { text: string; fromDoctor: boolean; sentAt: string; hasFile: boolean } | null;
  /** the patient's messages since the doctor last replied, if any: they need the doctor */
  waitingSince: string | null;
  /** the backend found urgent words in a waiting message */
  urgent: boolean;
  /** a message arrived after the doctor last opened the chat */
  unread: boolean;
};

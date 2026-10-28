"use client";

/*
  One open chat (Arhaan's ThreadPane): the patient's messages and the doctor's replies by day,
  quick replies, and the reply box. Earlier messages come from the history endpoint; new ones
  arrive on the consultation chat socket (the server echoes each sent message back, so a reply
  appears once it is delivered). A reply can also close the patient's flagged symptom, ticked by
  default, as "Advised by message".
*/

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Paperclip } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import ErrorNotice from "@/components/ui/ErrorNotice";
import { useToast } from "@/components/ui/ToastProvider";
import { useApiResource } from "@/hooks/useApiResource";
import { clockTime, shortDate, weekdayDayMonth } from "@/lib/format/dateTime";
import { errorMessage } from "@/lib/http/apiClient";
import { getSessionUser } from "@/lib/session/authSession";
import { listChatHistory } from "@/services/chatHistoryService";
import { connectToChatSession } from "@/services/chatService";
import { markChatRead } from "@/services/doctorChatService";
import { acknowledgeSymptom, getPatientRecord, undoSymptomAcknowledgement } from "@/services/patientRecordService";
import type { ChatMessage } from "@/types/chat";
import type { DoctorPatient } from "@/types/doctor";
import type { DoctorChatSession } from "@/types/doctorChat";
import type { PatientSnapshot } from "@/types/patientRecord";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import styles from "../MessagesPage.module.css";

/** The three things a doctor writes most: one tap to fill, always editable. */
const QUICK_REPLIES = [
  { label: "Noted for your review", text: "Thanks for letting me know. I have noted it in your record, and we will go through it at your review." },
  { label: "Book a follow-up", text: "Please book a follow-up in the app so we can talk this through properly." },
  { label: "If worse, call 112", text: "If this gets worse, or you feel unwell, go to the nearest hospital or call 112." },
];

type Connection = ReturnType<typeof connectToChatSession>;

const sameDay = (a: string, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
const dayLabel = (iso: string, now: number) => (sameDay(iso, now) ? "Today" : sameDay(iso, now - 864e5) ? "Yesterday" : weekdayDayMonth.format(new Date(iso)));
const sexLetter = (sex: string) => (/^f/i.test(sex) ? "F" : /^m/i.test(sex) ? "M" : "");

export default function ThreadPane({
  session,
  patient,
  snapshot,
  now,
  onBack,
  onSetAside,
}: {
  session: DoctorChatSession;
  patient?: DoctorPatient;
  snapshot?: PatientSnapshot;
  now: number;
  onBack: () => void;
  onSetAside: () => void;
}) {
  const toast = useToast();
  const [user] = useState(getSessionUser);
  const history = useApiResource(`chat-history-${session.sessionId}`, () => listChatHistory(session.sessionId));
  const record = useApiResource(`record-${session.patientId}`, () => getPatientRecord(session.patientId));
  const [live, setLive] = useState<ChatMessage[]>([]);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [acknowledge, setAcknowledge] = useState(true);
  const connection = useRef<Connection | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const messages = [...(history.data ?? []), ...live];
  const symptom = record.data?.symptoms.find((s) => s.requiresReview && !s.acknowledged);
  const firstName = session.patientName.split(" ")[0];
  const waitingSince = session.waitingSince ? Date.parse(session.waitingSince) : null;

  useEffect(() => {
    const opened = connectToChatSession(session.sessionId, { onMessage: (message) => setLive((current) => [...current, message]), onError: setSocketError });
    connection.current = opened;
    // reading the chat clears its "new" dot; a failure here only leaves the dot on
    markChatRead(session.sessionId).catch(() => undefined);
    return () => {
      opened.close();
      connection.current = null;
    };
  }, [session.sessionId]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const grow = () => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const send = async () => {
    if (!text.trim() || !connection.current || !user?.userId) return;
    setSocketError(null);
    connection.current.send({ senderUserId: user.userId, senderRole: "DOCTOR", messageType: "TEXT", messageText: text.trim(), fileUrl: null });
    setText("");
    requestAnimationFrame(grow);
    if (!symptom || !acknowledge) return;
    try {
      await acknowledgeSymptom(session.patientId, symptom.id, "Advised by message");
      record.reload();
      toast(`Sent. ${symptom.label} marked as advised by message`, () => {
        undoSymptomAcknowledgement(session.patientId, symptom.id)
          .then(record.reload)
          .catch((caught) => toast(errorMessage(caught)));
      });
    } catch (caught) {
      toast(errorMessage(caught));
    }
  };

  const who = patient ? [[patient.age, sexLetter(patient.sex)].filter(Boolean).join(" "), snapshot ? (snapshot.careWeek ? `week ${snapshot.careWeek}` : snapshot.programme) : "", snapshot?.conditions.slice(0, 2).join(", ")] : [];

  return (
    <section className={styles.threadPane} aria-label={`Messages with ${session.patientName}`}>
      <header className={styles.threadHead}>
        <button type="button" className={conversationStyles.back} aria-label="Back to messages" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <Avatar name={session.patientName} size={36} />
        <div className={styles.threadWho}>
          <strong>{session.patientName}</strong>
          <span>{who.filter(Boolean).join(" · ") || "Patient"}</span>
        </div>
        <Link href={`/doctor-dashboard/patients/${session.patientId}?from=messages`} className={`btn btn--ghost ${styles.record}`}>
          Open record
        </Link>
      </header>

      <div ref={scroller} className={styles.thread} role="log" aria-live="polite">
        <div className={styles.inner}>
          {history.error && <ErrorNotice message={history.error} onRetry={history.reload} />}
          {history.data === null && <p className={styles.day}>Earlier messages are not available yet. New messages appear here.</p>}
          {messages.map((message, i) => {
            const previous = messages[i - 1];
            const newDay = !previous || new Date(previous.sentAt).toDateString() !== new Date(message.sentAt).toDateString();
            const ours = message.senderRole === "DOCTOR";
            const opens = newDay || previous.senderRole !== message.senderRole;
            const waiting = !ours && waitingSince !== null && Date.parse(message.sentAt) >= waitingSince;
            return (
              <Fragment key={`${message.sentAt}-${i}`}>
                {newDay && <p className={styles.day}>{dayLabel(message.sentAt, now)}</p>}
                <div className={styles.row} data-ours={ours} data-you={ours} data-opens={opens}>
                  <div className={styles.stack}>
                    {opens && <p className={styles.name}>{ours ? "You" : firstName}</p>}
                    <div className={styles.bubble} data-open={waiting} data-urgent={waiting && session.urgent}>
                      {message.fileUrl && (
                        <a href={message.fileUrl} target="_blank" rel="noreferrer" className={styles.photoNote}>
                          <Paperclip size={15} aria-hidden="true" /> Attachment
                        </a>
                      )}
                      {message.messageText && <p>{message.messageText}</p>}
                    </div>
                    <p className={styles.meta}>
                      <span className="num">{clockTime(new Date(message.sentAt))}</span>
                      {waiting && session.urgent && <span className={styles.urgentWord}>· Urgent words</span>}
                    </p>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {socketError && <ErrorNotice message={socketError} />}
        <div className={styles.quick} role="group" aria-label="Quick replies">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply.label}
              type="button"
              onClick={() => {
                setText(reply.text);
                requestAnimationFrame(() => {
                  grow();
                  field.current?.focus();
                });
              }}
            >
              {reply.label}
            </button>
          ))}
        </div>
        <div className={conversationStyles.box}>
          <label htmlFor="doctor-reply" className="sr-only">
            Reply to {session.patientName}
          </label>
          <textarea
            id="doctor-reply"
            ref={field}
            rows={2}
            value={text}
            placeholder={`Reply to ${firstName}`}
            onChange={(e) => {
              setText(e.target.value);
              grow();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
          />
          {symptom && (
            <label className={styles.ack}>
              <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} />
              <span>
                Also mark {symptom.label.toLowerCase()} as advised by message
                <em>
                  {" "}
                  · flagged {shortDate(symptom.at)}, {symptom.severity.toLowerCase()}
                </em>
              </span>
            </label>
          )}
          <div className={styles.boxFoot}>
            <span className={styles.as}>
              <Avatar name={user?.fullName || "Doctor"} size={20} /> As {user?.fullName || "you"}. Arrives in the app.
            </span>
            <span className={styles.actions}>
              {session.waitingSince && (
                <button type="button" className={conversationStyles.linkBtn} onClick={onSetAside}>
                  No reply needed
                </button>
              )}
              <button type="submit" className={`btn ${styles.send}`} disabled={!text.trim()}>
                Send <ArrowUp size={15} weight="bold" aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      </form>
    </section>
  );
}

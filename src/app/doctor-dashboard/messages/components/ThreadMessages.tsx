/*
  The messages of one open chat, grouped by day ("Today", "Yesterday", else the date), each run of
  one sender opened with their name. Messages that arrived since the chat started waiting on the
  doctor are marked, and flagged urgent when the chat is. Keeps the newest message in view.
*/

import { Fragment, useLayoutEffect, useRef } from "react";
import { Paperclip } from "@phosphor-icons/react";
import ErrorNotice from "@/components/ui/ErrorNotice";
import { clockTime, weekdayDayMonth } from "@/lib/format/dateTime";
import type { ChatMessage } from "@/types/chat";
import styles from "../MessagesPage.module.css";

function sameDay(iso: string, time: number) {
  return new Date(iso).toDateString() === new Date(time).toDateString();
}

function dayLabel(iso: string, now: number) {
  if (sameDay(iso, now)) return "Today";
  if (sameDay(iso, now - 864e5)) return "Yesterday";
  return weekdayDayMonth.format(new Date(iso));
}

export default function ThreadMessages({
  messages,
  historyError,
  historyMissing,
  onRetryHistory,
  firstName,
  waitingSince,
  urgent,
  now,
}: {
  messages: ChatMessage[];
  historyError: string | null;
  /** the history endpoint is not available yet: only new messages show */
  historyMissing: boolean;
  onRetryHistory: () => void;
  firstName: string;
  /** when the chat started waiting on the doctor (ms), or null */
  waitingSince: number | null;
  urgent: boolean;
  now: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages.length]);

  return (
    <div ref={scroller} className={styles.thread} role="log" aria-live="polite">
      <div className={styles.inner}>
        {historyError && (
          <ErrorNotice message={historyError} onRetry={onRetryHistory} />
        )}
        {historyMissing && (
          <p className={styles.day}>
            Earlier messages are not available yet. New messages appear here.
          </p>
        )}
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const newDay =
            !previous ||
            new Date(previous.sentAt).toDateString() !==
              new Date(message.sentAt).toDateString();
          const ours = message.senderRole === "DOCTOR";
          const opens = newDay || previous.senderRole !== message.senderRole;
          const waiting =
            !ours &&
            waitingSince !== null &&
            Date.parse(message.sentAt) >= waitingSince;
          return (
            <Fragment key={`${message.sentAt}-${index}`}>
              {newDay && (
                <p className={styles.day}>{dayLabel(message.sentAt, now)}</p>
              )}
              <div
                className={styles.row}
                data-ours={ours}
                data-you={ours}
                data-opens={opens}
              >
                <div className={styles.stack}>
                  {opens && (
                    <p className={styles.name}>{ours ? "You" : firstName}</p>
                  )}
                  <div
                    className={styles.bubble}
                    data-open={waiting}
                    data-urgent={waiting && urgent}
                  >
                    {message.fileUrl && (
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.photoNote}
                      >
                        <Paperclip size={15} aria-hidden="true" /> Attachment
                      </a>
                    )}
                    {message.messageText && <p>{message.messageText}</p>}
                  </div>
                  <p className={styles.meta}>
                    <span className="num">
                      {clockTime(new Date(message.sentAt))}
                    </span>
                    {waiting && urgent && (
                      <span className={styles.urgentWord}>· Urgent words</span>
                    )}
                  </p>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

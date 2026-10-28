"use client";

/**
 * Writing a message: a field that grows with the text and a send button. Enter sends on a
 * keyboard; on a phone the return key adds a line. Words that sound like an emergency show the
 * 112 line before anything is sent.
 */

import { useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowUp, Phone } from "@phosphor-icons/react";
import styles from "./ChatScreen.module.css";

/** Words that should never wait for a reply. The answer is always 112, said plainly. */
const URGENT =
  /chest ?pains?|pain in (my )?chest|heart attack|stroke|seizure|\bfits?\b|can'?t breathe|cannot breathe|breathless|saans|seene|chhati|faint|passed out|unconscious|suicid|kill myself|vomiting blood|blood in (my )?vomit|severe (stomach|abdominal|belly|tummy) pain/i;
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribeToPointer(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function ChatComposer({
  disabled,
  placeholder,
  showNewBelow,
  onJumpDown,
  onSend,
}: {
  disabled: boolean;
  placeholder: string;
  showNewBelow: boolean;
  onJumpDown: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const finePointer = useSyncExternalStore(subscribeToPointer, () => window.matchMedia(FINE_POINTER).matches, () => false);

  const grow = () => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };
  const submit = () => {
    const message = text.trim();
    if (!message || disabled) return;
    onSend(message);
    setText("");
    requestAnimationFrame(grow);
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {showNewBelow && (
        <button type="button" className={styles.down} onClick={onJumpDown}>
          <ArrowDown size={14} aria-hidden="true" /> New message
        </button>
      )}
      {URGENT.test(text) && (
        <p className={styles.warn} role="alert">
          <Phone size={15} weight="fill" aria-hidden="true" />
          <span>
            If this is an emergency, call <a href="tel:112">112</a> now. Do not wait for a reply.
          </span>
        </p>
      )}
      <div className={styles.box}>
        <div className={styles.line}>
          <label htmlFor="chat-field" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-field"
            ref={field}
            rows={1}
            value={text}
            placeholder={placeholder}
            className={styles.field}
            enterKeyHint={finePointer ? "send" : "enter"}
            disabled={disabled}
            onChange={(event) => {
              setText(event.target.value);
              grow();
            }}
            onKeyDown={(event) => {
              if (finePointer && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <button type="submit" className={styles.send} disabled={disabled || !text.trim()} aria-label="Send">
            <ArrowUp size={18} weight="bold" />
          </button>
        </div>
      </div>
    </form>
  );
}

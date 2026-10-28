"use client";

/**
 * A section opened for editing in place. Leaving the field, Esc or Cmd+Enter keeps the text;
 * Cancel drops it. "Edit it myself" on a flag opens it with that sentence selected.
 */

import { useEffect, useRef, useState } from "react";
import type { NoteSectionKey } from "@/types/clinicalNote";
import { editSection } from "@/app/doctor-dashboard/notes/components/noteEdits";
import {
  sectionOf,
  TITLES,
} from "@/app/doctor-dashboard/notes/components/noteState";
import { PROMPT } from "@/app/doctor-dashboard/notes/components/noteFormat";
import { useNoteReview } from "./NoteReviewContext";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import styles from "./NoteSections.module.css";

const growToFit = (field: HTMLTextAreaElement | null) => {
  if (!field) return;
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight}px`;
};

export default function SectionEditor({
  sectionKey,
  caret,
}: {
  sectionKey: NoteSectionKey;
  caret?: string;
}) {
  const review = useNoteReview();
  const [start] = useState(() => {
    const current = sectionOf(review.note, sectionKey).current;
    const text = current
      .map((sentence) => sentence.text)
      .join(sectionKey === "plan" ? "\n" : " ");
    const target = caret
      ? current.find((sentence) => sentence.id === caret)?.text
      : undefined;
    const at = target ? text.indexOf(target) : text.length;
    return { text, from: at, to: target ? at + target.length : at };
  });
  const [text, setText] = useState(start.text);
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const closed = useRef(false);

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    growToFit(element);
    element.focus({ preventScroll: true });
    element.setSelectionRange(start.from, start.to);
  }, [start]);

  const finish = (save: boolean) => {
    if (closed.current) return;
    closed.current = true;
    if (save) review.apply(editSection(review.note, sectionKey, text));
    review.closeEditor(sectionKey);
  };

  return (
    <div ref={box} className={styles.editor}>
      <div className={conversationStyles.box}>
        <label htmlFor={`ed-${sectionKey}`} className="sr-only">
          {TITLES[sectionKey]}
        </label>
        <textarea
          id={`ed-${sectionKey}`}
          ref={field}
          className={styles.field}
          rows={sectionKey === "plan" ? 4 : 3}
          value={text}
          placeholder={PROMPT[sectionKey]}
          onChange={(event) => {
            setText(event.target.value);
            growToFit(event.target);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Escape" ||
              (event.key === "Enter" && (event.metaKey || event.ctrlKey))
            ) {
              event.preventDefault();
              event.stopPropagation();
              finish(true);
            }
          }}
          onBlur={(event) => {
            // leaving for another control in the editor, or leaving the window, is not finishing
            if (
              (event.relatedTarget &&
                box.current?.contains(event.relatedTarget as Node)) ||
              !document.hasFocus()
            )
              return;
            finish(true);
          }}
        />
      </div>
      <div className={styles.editFoot}>
        <p className={styles.hint}>
          {review.hoverable ? "Esc or ⌘Enter to finish. " : ""}
          {review.note.transcript.length
            ? "Sentences you change lose their link to the call."
            : sectionKey === "plan"
              ? "One point per line."
              : ""}
        </p>
        <span className={styles.editActions}>
          <button
            type="button"
            className={styles.inlineBtn}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => finish(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${styles.doneBtn}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => finish(true)}
          >
            Done
          </button>
        </span>
      </div>
    </div>
  );
}

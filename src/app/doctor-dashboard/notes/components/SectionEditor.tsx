"use client";

import { useEffect, useRef, useState } from "react";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import type { NoteSectionKey } from "@/types/clinicalNote";
import { editSection, sectionOf, TITLES } from "./noteEdits";
import { PROMPT } from "./noteFormat";
import { useNoteReview } from "./NoteReviewContext";
import styles from "./NoteBody.module.css";

const growToFit = (field: HTMLTextAreaElement | null) => {
  if (!field) return;
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight}px`;
};

/**
 * A section opened for editing in place. Leaving the field, Esc or Cmd+Enter keeps the text;
 * Cancel drops it. "Edit it myself" on a flag opens it with that sentence selected.
 */
export default function SectionEditor({ sectionKey, caret }: { sectionKey: NoteSectionKey; caret?: string }) {
  const review = useNoteReview();
  const [start] = useState(() => {
    const current = sectionOf(review.note, sectionKey).current;
    const text = current.map((y) => y.text).join(sectionKey === "plan" ? "\n" : " ");
    const target = caret ? current.find((y) => y.id === caret)?.text : undefined;
    const at = target ? text.indexOf(target) : text.length;
    return { text, from: at, to: target ? at + target.length : at };
  });
  const [text, setText] = useState(start.text);
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const closed = useRef(false);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    growToFit(el);
    el.focus({ preventScroll: true });
    el.setSelectionRange(start.from, start.to);
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
          onChange={(e) => {
            setText(e.target.value);
            growToFit(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
              e.preventDefault();
              e.stopPropagation();
              finish(true);
            }
          }}
          onBlur={(e) => {
            // leaving for another control in the editor, or leaving the window, is not finishing
            if ((e.relatedTarget && box.current?.contains(e.relatedTarget as Node)) || !document.hasFocus()) return;
            finish(true);
          }}
        />
      </div>
      <div className={styles.editFoot}>
        <p className={styles.hint}>
          {review.hoverable ? "Esc or ⌘Enter to finish. " : ""}
          {review.note.transcript.length ? "Sentences you change lose their link to the call." : sectionKey === "plan" ? "One point per line." : ""}
        </p>
        <span className={styles.editActions}>
          <button type="button" className={styles.inlineBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => finish(false)}>
            Cancel
          </button>
          <button type="button" className={`btn ${styles.doneBtn}`} onMouseDown={(e) => e.preventDefault()} onClick={() => finish(true)}>
            Done
          </button>
        </span>
      </div>
    </div>
  );
}

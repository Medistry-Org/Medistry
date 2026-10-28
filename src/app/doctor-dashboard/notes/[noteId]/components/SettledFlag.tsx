/** What is left of a flag once settled: the choice, and Undo while this visit lasts. */

import { Check } from "@phosphor-icons/react";
import { useNoteReview } from "./NoteReviewContext";
import styles from "./NoteSections.module.css";

export default function SettledFlag({
  sentenceId,
  label,
}: {
  sentenceId: string;
  label: string;
}) {
  const review = useNoteReview();
  const undo = review.undos[sentenceId];
  return (
    <p className={styles.settled}>
      <Check size={13} weight="bold" aria-hidden="true" /> Checked: {label}
      {undo && (
        <button
          type="button"
          className={styles.inlineBtn}
          onClick={() => {
            undo.undo();
            review.toast("Put back as the scribe wrote it");
          }}
        >
          Undo
        </button>
      )}
    </p>
  );
}

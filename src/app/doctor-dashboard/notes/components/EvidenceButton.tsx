import { Waveform } from "@phosphor-icons/react";
import type { Evidence } from "@/types/clinicalNote";
import { useNoteReview } from "./NoteReviewContext";
import styles from "./NoteLists.module.css";

/** "Where this was said" for a medicine or a follow-up: pins its moments in the transcript. */
export default function EvidenceButton({ id, evidence, label }: { id: string; evidence: Evidence[]; label: string }) {
  const review = useNoteReview();
  if (!evidence.length) return <span />;
  return (
    <button
      type="button"
      className={styles.evBtn}
      aria-label={`Where this was said: ${label}`}
      aria-pressed={review.pin?.id === id}
      onClick={() => review.pinIt({ id, evidence, by: "scribe", at: id })}
      onMouseEnter={review.hoverable ? () => review.setHover(evidence) : undefined}
      onMouseLeave={review.hoverable ? () => review.setHover(null) : undefined}
    >
      <Waveform size={18} />
    </button>
  );
}

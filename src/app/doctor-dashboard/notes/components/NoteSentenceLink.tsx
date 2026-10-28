import type { NoteSentence } from "@/types/clinicalNote";
import { useNoteReview } from "./NoteReviewContext";
import styles from "./NoteBody.module.css";

/** One sentence: press it to see where it was said. A link, not a button, so a paragraph still wraps as prose. */
export default function NoteSentenceLink({ sentence }: { sentence: NoteSentence }) {
  const review = useNoteReview();
  const open = !!sentence.flag && !sentence.flag.resolved && !review.done;
  const press = () => review.pinIt({ id: sentence.id, evidence: sentence.evidence, by: sentence.by, at: sentence.id });
  return (
    <a
      href={`#sent-${sentence.id}`}
      id={`sent-${sentence.id}`}
      role="button"
      className={styles.sent}
      data-by={sentence.by}
      data-flag={open || undefined}
      data-lit={review.lit.has(sentence.id) || undefined}
      data-flash={review.flash === sentence.id || undefined}
      aria-pressed={review.pin?.id === sentence.id}
      aria-describedby={open ? `flag-${sentence.id}` : undefined}
      onClick={(e) => {
        e.preventDefault();
        press();
      }}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          press();
        }
      }}
      onMouseEnter={review.hoverable ? () => review.setHover(sentence.evidence) : undefined}
      onMouseLeave={review.hoverable ? () => review.setHover(null) : undefined}
    >
      {sentence.text}
    </a>
  );
}

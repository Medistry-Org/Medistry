/** A sentence the scribe was not sure of: why, and the ways to settle it. */

import { WarningCircle } from "@phosphor-icons/react";
import type { NoteSectionKey, NoteSentence } from "@/types/clinicalNote";
import { FLAG_TITLE } from "@/app/doctor-dashboard/notes/components/noteFormat";
import { useNoteReview } from "./NoteReviewContext";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "./NoteSections.module.css";

export default function FlagCard({
  sentence,
  sectionKey,
}: {
  sentence: NoteSentence;
  sectionKey: NoteSectionKey;
}) {
  const review = useNoteReview();
  if (!sentence.flag) return null;
  const flag = sentence.flag;
  return (
    <div
      className={styles.flag}
      role="group"
      id={`flag-${sentence.id}`}
      aria-labelledby={`flag-t-${sentence.id}`}
    >
      <p id={`flag-t-${sentence.id}`} className={styles.flagTitle}>
        <WarningCircle size={15} weight="fill" aria-hidden="true" />{" "}
        {FLAG_TITLE[flag.kind]}
      </p>
      <p className={styles.flagWhy}>{flag.why}</p>
      <div className={styles.flagOpts}>
        {flag.options.map((option, i) => (
          <button
            key={option.label}
            type="button"
            className={clinicStyles.outcome}
            onClick={() => review.resolve(sentence.id, i)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          className={`${clinicStyles.textBtn} ${styles.flagEdit}`}
          onClick={() => review.openEditor(sectionKey, sentence.id)}
        >
          Edit it myself
        </button>
      </div>
    </div>
  );
}

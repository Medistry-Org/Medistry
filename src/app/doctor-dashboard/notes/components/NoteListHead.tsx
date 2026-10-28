import { Check } from "@phosphor-icons/react";
import type { NoteListKey } from "@/types/clinicalNote";
import { checkSection, TITLES } from "./noteEdits";
import { useNoteReview } from "./NoteReviewContext";
import SectionCheckButton from "./SectionCheckButton";
import SectionHead from "./SectionHead";
import styles from "./NoteBody.module.css";

/** The heading of a list under the prose (medicines, follow-ups, record updates), with its tick. */
export default function NoteListHead({ listKey }: { listKey: NoteListKey }) {
  const review = useNoteReview();
  const on = !!review.note.checks[listKey];
  return (
    <SectionHead
      sectionKey={listKey}
      title={TITLES[listKey]}
      meta={
        review.done ? null : on ? (
          <>
            <Check size={13} weight="bold" className={styles.metaTick} aria-hidden="true" /> Checked
          </>
        ) : (
          "Found by the scribe"
        )
      }
    >
      {!review.done && <SectionCheckButton on={on} title={TITLES[listKey]} onClick={() => review.apply(checkSection(review.note, listKey, !on))} />}
    </SectionHead>
  );
}

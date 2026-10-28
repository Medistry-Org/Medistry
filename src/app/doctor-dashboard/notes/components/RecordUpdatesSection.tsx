import { ArrowRight } from "@phosphor-icons/react";
import { toggleRecordUpdate } from "./noteEdits";
import { useNoteReview } from "./NoteReviewContext";
import NoteListHead from "./NoteListHead";
import TickBox from "./TickBox";
import bodyStyles from "./NoteBody.module.css";
import styles from "./NoteLists.module.css";

/** Changes to the patient's record heard on the call (allergies, identity, other medicines), applied on signing. */
export default function RecordUpdatesSection() {
  const review = useNoteReview();
  const { note, done } = review;
  return (
    <section id="sec-recordUpdates" data-sec="recordUpdates" tabIndex={-1} aria-labelledby="h-recordUpdates" className={bodyStyles.sec}>
      <NoteListHead listKey="recordUpdates" />
      <div className={bodyStyles.body}>
        <ul className={styles.rows}>
          {note.recordUpdates
            .filter((u) => !done || u.include)
            .map((u) => (
              <li key={u.id} className={styles.upRow} data-out={!u.include || undefined}>
                <p>
                  <span className={styles.upLabel}>{u.label}</span>
                  <s>{u.from}</s>
                  <ArrowRight size={14} aria-label="to" className={styles.upArrow} />
                  <span>{u.to}</span>
                </p>
                {!done && (
                  <TickBox
                    on={u.include}
                    onChange={() => review.apply(toggleRecordUpdate(note, u.id))}
                    label={
                      <>
                        Include<span className="sr-only">: {u.label}</span>
                      </>
                    }
                  />
                )}
              </li>
            ))}
        </ul>
        <p className={styles.foot}>{done ? "Applied to the record when you signed." : "Applied to the record when you sign."}</p>
      </div>
    </section>
  );
}

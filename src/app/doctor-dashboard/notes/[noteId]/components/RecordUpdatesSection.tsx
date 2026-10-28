/** Changes to the patient's record heard on the call (allergies, identity, other medicines), applied on signing. */

import { ArrowRight } from "@phosphor-icons/react";
import { toggleRecordUpdate } from "@/app/doctor-dashboard/notes/components/noteEdits";
import { useNoteReview } from "./NoteReviewContext";
import ListSectionHead from "./ListSectionHead";
import TickBox from "./TickBox";
import sectionStyles from "./NoteSections.module.css";
import styles from "./NoteListSections.module.css";

export default function RecordUpdatesSection() {
  const review = useNoteReview();
  const { note, done } = review;
  return (
    <section
      id="sec-recordUpdates"
      data-sec="recordUpdates"
      tabIndex={-1}
      aria-labelledby="h-recordUpdates"
      className={sectionStyles.sec}
    >
      <ListSectionHead listKey="recordUpdates" />
      <div className={sectionStyles.body}>
        <ul className={styles.rows}>
          {note.recordUpdates
            .filter((update) => !done || update.include)
            .map((update) => (
              <li
                key={update.id}
                className={styles.upRow}
                data-out={!update.include || undefined}
              >
                <p>
                  <span className={styles.upLabel}>{update.label}</span>
                  <s>{update.from}</s>
                  <ArrowRight
                    size={14}
                    aria-label="to"
                    className={styles.upArrow}
                  />
                  <span>{update.to}</span>
                </p>
                {!done && (
                  <TickBox
                    on={update.include}
                    onChange={() =>
                      review.apply(toggleRecordUpdate(note, update.id))
                    }
                    label={
                      <>
                        Include<span className="sr-only">: {update.label}</span>
                      </>
                    }
                  />
                )}
              </li>
            ))}
        </ul>
        <p className={styles.foot}>
          {done
            ? "Applied to the record when you signed."
            : "Applied to the record when you sign."}
        </p>
      </div>
    </section>
  );
}

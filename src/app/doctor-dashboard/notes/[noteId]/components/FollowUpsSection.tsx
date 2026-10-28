/** Follow-ups from the call: chosen before signing, ticked off as done after. */

import type { NoteFollowUp } from "@/types/clinicalNote";
import {
  markFollowUpDone,
  toggleFollowUp,
} from "@/app/doctor-dashboard/notes/components/noteEdits";
import { useNoteReview } from "./NoteReviewContext";
import EvidenceButton from "./EvidenceButton";
import EvidenceCard from "./EvidenceCard";
import ListSectionHead from "./ListSectionHead";
import TickBox from "./TickBox";
import sectionStyles from "./NoteSections.module.css";
import styles from "./NoteListSections.module.css";

/** Who a follow-up went to when the note was signed; the doctor's own stay on their list. */
const sentTo = (followUp: NoteFollowUp) =>
  followUp.owner === "Care team"
    ? "the care team"
    : followUp.owner === "Dietitian"
      ? "the dietitian"
      : null;

export default function FollowUpsSection() {
  const review = useNoteReview();
  const { note, done, pin } = review;
  const rows = done
    ? note.followUps.filter((followUp) => followUp.include)
    : note.followUps;
  return (
    <section
      id="sec-followUps"
      data-sec="followUps"
      tabIndex={-1}
      aria-labelledby="h-followUps"
      className={sectionStyles.sec}
    >
      <ListSectionHead listKey="followUps" />
      <div className={sectionStyles.body}>
        {rows.length ? (
          <ul className={styles.rows}>
            {rows.map((followUp) => (
              <li key={followUp.id}>
                <div
                  className={styles.fuRow}
                  data-out={
                    (!done && !followUp.include) ||
                    (done && followUp.done) ||
                    undefined
                  }
                >
                  <TickBox
                    on={done ? followUp.done : followUp.include}
                    onChange={() =>
                      review.apply(
                        done
                          ? markFollowUpDone(note, followUp.id)
                          : toggleFollowUp(note, followUp.id),
                      )
                    }
                    label={
                      <>
                        <span className="sr-only">
                          {done ? "Done: " : "Include: "}
                        </span>
                        {followUp.text}
                      </>
                    }
                  />
                  <span className={styles.owner}>
                    {done && sentTo(followUp)
                      ? `Sent to ${sentTo(followUp)}`
                      : followUp.owner}
                  </span>
                  <EvidenceButton
                    id={`fu-${followUp.id}`}
                    evidence={followUp.evidence}
                    label={followUp.text}
                  />
                </div>
                {pin && !review.shown && pin.at === `fu-${followUp.id}` && (
                  <EvidenceCard />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={sectionStyles.none}>No follow-ups.</p>
        )}
        {!done && rows.some((followUp) => followUp.owner !== "You") && (
          <p className={styles.foot}>
            Care team and dietitian items go to them when you sign.
          </p>
        )}
      </div>
    </section>
  );
}

import type { NoteFollowUp } from "@/types/clinicalNote";
import { markFollowUpDone, toggleFollowUp } from "./noteEdits";
import { useNoteReview } from "./NoteReviewContext";
import EvidenceButton from "./EvidenceButton";
import EvidenceCard from "./EvidenceCard";
import NoteListHead from "./NoteListHead";
import TickBox from "./TickBox";
import bodyStyles from "./NoteBody.module.css";
import styles from "./NoteLists.module.css";

/** Who a follow-up went to when the note was signed; the doctor's own stay on their list. */
const sentTo = (f: NoteFollowUp) => (f.owner === "Care team" ? "the care team" : f.owner === "Dietitian" ? "the dietitian" : null);

/** Follow-ups from the call: chosen before signing, ticked off as done after. */
export default function FollowUpsSection() {
  const review = useNoteReview();
  const { note, done, pin } = review;
  const rows = done ? note.followUps.filter((f) => f.include) : note.followUps;
  return (
    <section id="sec-followUps" data-sec="followUps" tabIndex={-1} aria-labelledby="h-followUps" className={bodyStyles.sec}>
      <NoteListHead listKey="followUps" />
      <div className={bodyStyles.body}>
        {rows.length ? (
          <ul className={styles.rows}>
            {rows.map((f) => (
              <li key={f.id}>
                <div className={styles.fuRow} data-out={(!done && !f.include) || (done && f.done) || undefined}>
                  <TickBox
                    on={done ? f.done : f.include}
                    onChange={() => review.apply(done ? markFollowUpDone(note, f.id) : toggleFollowUp(note, f.id))}
                    label={
                      <>
                        <span className="sr-only">{done ? "Done: " : "Include: "}</span>
                        {f.text}
                      </>
                    }
                  />
                  <span className={styles.owner}>{done && sentTo(f) ? `Sent to ${sentTo(f)}` : f.owner}</span>
                  <EvidenceButton id={`fu-${f.id}`} evidence={f.evidence} label={f.text} />
                </div>
                {pin && !review.shown && pin.at === `fu-${f.id}` && <EvidenceCard />}
              </li>
            ))}
          </ul>
        ) : (
          <p className={bodyStyles.none}>No follow-ups.</p>
        )}
        {!done && rows.some((f) => f.owner !== "You") && <p className={styles.foot}>Care team and dietitian items go to them when you sign.</p>}
      </div>
    </section>
  );
}

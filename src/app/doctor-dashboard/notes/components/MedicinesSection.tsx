import { rxChanges, toggleMedicine } from "./noteEdits";
import { useNoteReview } from "./NoteReviewContext";
import EvidenceButton from "./EvidenceButton";
import EvidenceCard from "./EvidenceCard";
import NoteListHead from "./NoteListHead";
import TickBox from "./TickBox";
import bodyStyles from "./NoteBody.module.css";
import styles from "./NoteLists.module.css";

const ACTION = { START: "Start", CHANGE: "Change", STOP: "Stop", CONTINUE: "Continue" } as const;

/** Medicine changes found in the call. Included ones become a draft prescription, signed separately. */
export default function MedicinesSection({ nextPrescriptionVersion }: { nextPrescriptionVersion: number }) {
  const review = useNoteReview();
  const { note, done, pin } = review;
  const changes = rxChanges(note).length;
  const signedVersion = note.signed?.prescriptionVersion ?? null;
  return (
    <section id="sec-medicines" data-sec="medicines" tabIndex={-1} aria-labelledby="h-medicines" className={bodyStyles.sec}>
      <NoteListHead listKey="medicines" />
      <div className={bodyStyles.body}>
        {note.medicines.length ? (
          <ul className={styles.rows}>
            {note.medicines.map((d) => (
              <li key={d.id}>
                <div className={styles.medRow} data-out={(!d.include && d.action !== "CONTINUE") || undefined}>
                  <span className={styles.act} data-act={d.action}>
                    {ACTION[d.action]}
                  </span>
                  <span className={styles.medText}>
                    <strong>
                      {d.name} {d.strength}
                    </strong>
                    <span>{d.detail}</span>
                    {d.was && <em>Was: {d.was}</em>}
                  </span>
                  <span className={styles.rowTools}>
                    <EvidenceButton id={`med-${d.id}`} evidence={d.evidence} label={d.name} />
                    {d.action !== "CONTINUE" && !done && (
                      <TickBox
                        on={d.include}
                        onChange={() => review.apply(toggleMedicine(note, d.id))}
                        label={
                          <>
                            Include<span className="sr-only">: {ACTION[d.action].toLowerCase()} {d.name}</span>
                          </>
                        }
                      />
                    )}
                  </span>
                </div>
                {pin && !review.shown && pin.at === `med-${d.id}` && <EvidenceCard />}
              </li>
            ))}
          </ul>
        ) : (
          <p className={bodyStyles.none}>No medicine came up on this call.</p>
        )}
        <p className={styles.foot}>
          {done
            ? signedVersion !== null
              ? `The changes became prescription version ${signedVersion}, for you to sign separately.`
              : "No change to the prescription."
            : changes
              ? `Included changes become prescription version ${nextPrescriptionVersion}, a draft you sign separately.`
              : "No change to the prescription."}
        </p>
      </div>
    </section>
  );
}

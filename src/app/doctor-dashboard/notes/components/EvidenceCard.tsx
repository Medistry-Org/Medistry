import { ArrowRight } from "@phosphor-icons/react";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import type { TranscriptSegment } from "@/types/clinicalNote";
import { firstName } from "./noteEdits";
import { minutesSeconds, segmentIds } from "./noteFormat";
import { useNoteReview } from "./NoteReviewContext";
import MarkedText from "./MarkedText";
import styles from "./NoteBody.module.css";

/** Where a pinned sentence came from, shown in place when the transcript is not on screen. */
export default function EvidenceCard() {
  const review = useNoteReview();
  const pin = review.pin;
  if (!pin) return null;
  const segments = segmentIds(pin.evidence)
    .map((id) => review.note.transcript.find((g) => g.id === id))
    .filter((g): g is TranscriptSegment => !!g);
  return (
    <div id="evidence" className={styles.evidence}>
      {segments.length ? (
        <>
          {segments.map((g) => (
            <div key={g.id} className={styles.evRow}>
              <p className={`${styles.evWhen} num`}>
                {minutesSeconds(g.t)} · {g.who === "doctor" ? review.doctor.shortName : firstName(review.note)}
              </p>
              <p className={styles.evText}>
                <MarkedText text={g.text} quotes={pin.evidence.filter((e) => e.segmentId === g.id && e.quote).map((e) => e.quote ?? "")} unsure={g.unsure} />
              </p>
              {g.english && <p className={styles.en}>In English: {g.english}</p>}
            </div>
          ))}
          <button type="button" className={clinicStyles.textBtn} onClick={() => review.openTranscript(segments[0].id)}>
            Open the transcript <ArrowRight size={15} aria-hidden="true" />
          </button>
        </>
      ) : (
        <p className={styles.evNone}>{pin.by === "doctor" ? "Written by you." : "Not linked to the call."}</p>
      )}
    </div>
  );
}

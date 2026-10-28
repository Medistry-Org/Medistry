/** Where a pinned sentence came from, shown in place when the transcript is not on screen. */

import { ArrowRight } from "@phosphor-icons/react";
import type { TranscriptSegment } from "@/types/clinicalNote";
import { firstName } from "@/app/doctor-dashboard/notes/components/noteState";
import {
  minutesSeconds,
  segmentIds,
} from "@/app/doctor-dashboard/notes/components/noteFormat";
import { useNoteReview } from "./NoteReviewContext";
import MarkedText from "./MarkedText";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "./NoteSections.module.css";

export default function EvidenceCard() {
  const review = useNoteReview();
  const pin = review.pin;
  if (!pin) return null;
  const segments = segmentIds(pin.evidence)
    .map((id) => review.note.transcript.find((segment) => segment.id === id))
    .filter((segment): segment is TranscriptSegment => !!segment);
  return (
    <div id="evidence" className={styles.evidence}>
      {segments.length ? (
        <>
          {segments.map((segment) => (
            <div key={segment.id} className={styles.evRow}>
              <p className={`${styles.evWhen} num`}>
                {minutesSeconds(segment.t)} ·{" "}
                {segment.who === "doctor"
                  ? review.doctor.shortName
                  : firstName(review.note)}
              </p>
              <p className={styles.evText}>
                <MarkedText
                  text={segment.text}
                  quotes={pin.evidence
                    .filter(
                      (evidence) =>
                        evidence.segmentId === segment.id && evidence.quote,
                    )
                    .map((evidence) => evidence.quote ?? "")}
                  unsure={segment.unsure}
                />
              </p>
              {segment.english && (
                <p className={styles.en}>In English: {segment.english}</p>
              )}
            </div>
          ))}
          <button
            type="button"
            className={clinicStyles.textBtn}
            onClick={() => review.openTranscript(segments[0].id)}
          >
            Open the transcript <ArrowRight size={15} aria-hidden="true" />
          </button>
        </>
      ) : (
        <p className={styles.evNone}>
          {pin.by === "doctor" ? "Written by you." : "Not linked to the call."}
        </p>
      )}
    </div>
  );
}

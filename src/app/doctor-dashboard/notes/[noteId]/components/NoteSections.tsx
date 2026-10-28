/*
  The body of a note under review, in reading order: the three prose sections, the medicine,
  follow-up and record-update lists once the draft is written, then the patient's summary.
  `fadeIn`: the draft was still being written when the screen opened, so its sections fade in.
*/

import FollowUpsSection from "./FollowUpsSection";
import MedicinesSection from "./MedicinesSection";
import { useNoteReview } from "./NoteReviewContext";
import ProseSection from "./ProseSection";
import RecordUpdatesSection from "./RecordUpdatesSection";
import styles from "./NoteSections.module.css";

export default function NoteSections({
  fadeIn,
  isWriting,
  showMedicines,
  showFollowUps,
  nextPrescriptionVersion,
}: {
  fadeIn: boolean;
  isWriting: boolean;
  showMedicines: boolean;
  showFollowUps: boolean;
  nextPrescriptionVersion: number;
}) {
  const { note } = useNoteReview();
  return (
    <div
      className={styles.sections}
      data-fade={(fadeIn && !isWriting) || undefined}
    >
      <ProseSection sectionKey="summary" isWriting={isWriting} />
      <ProseSection sectionKey="assessment" isWriting={isWriting} />
      <ProseSection sectionKey="plan" isWriting={isWriting} />
      {!isWriting && showMedicines && (
        <MedicinesSection nextPrescriptionVersion={nextPrescriptionVersion} />
      )}
      {!isWriting && showFollowUps && <FollowUpsSection />}
      {!isWriting && note.recordUpdates.length > 0 && <RecordUpdatesSection />}
      <ProseSection sectionKey="patient" isWriting={isWriting} />
    </div>
  );
}

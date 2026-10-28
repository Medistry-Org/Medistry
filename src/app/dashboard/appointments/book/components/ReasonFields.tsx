/** What the consultation is about: the reason (required) and optional notes, 300 characters each. */

import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../BookPage.module.css";

const MAX_LENGTH = 300;

export default function ReasonFields({
  symptoms,
  notes,
  reasonMissing,
  onSymptomsChange,
  onNotesChange,
}: {
  symptoms: string;
  notes: string;
  reasonMissing: boolean;
  onSymptomsChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}) {
  return (
    <div className={styles.fields}>
      <label className={formStyles.field}>
        <span className={styles.labelRow}>
          <span className={formStyles.label}>Reason / Symptoms</span>
          <span className={`${formStyles.hint} num`}>
            {symptoms.length}/{MAX_LENGTH}
          </span>
        </span>
        <textarea
          className={styles.textarea}
          rows={3}
          maxLength={MAX_LENGTH}
          required
          aria-invalid={reasonMissing}
          value={symptoms}
          placeholder="Describe your symptoms or reason for consultation"
          onChange={(event) => onSymptomsChange(event.target.value)}
        />
      </label>
      <label className={formStyles.field}>
        <span className={styles.labelRow}>
          <span className={formStyles.label}>Notes (optional)</span>
          <span className={`${formStyles.hint} num`}>
            {notes.length}/{MAX_LENGTH}
          </span>
        </span>
        <textarea
          className={styles.textarea}
          rows={2}
          maxLength={MAX_LENGTH}
          value={notes}
          placeholder="Any additional information"
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </label>
    </div>
  );
}

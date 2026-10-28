/*
  A flagged symptom is closed by saying what was done about it (Arhaan's Acknowledge): one tap
  records the outcome in the record, with Undo in the toast.
*/

import { useToast } from "@/components/ui/ToastProvider";
import { errorMessage } from "@/lib/http/apiClient";
import { acknowledgeSymptom, undoSymptomAcknowledgement } from "@/services/patientRecordService";
import type { Symptom } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";

const OUTCOMES = ["Called the patient", "Advised by message", "Booked a visit"];

export default function SymptomOutcomes({ patientId, symptom, onChanged }: { patientId: string; symptom: Symptom; onChanged: () => void }) {
  const toast = useToast();
  const record = async (outcome: string) => {
    try {
      await acknowledgeSymptom(patientId, symptom.id, outcome);
      onChanged();
      toast(`Recorded: ${outcome.toLowerCase()}`, () => {
        undoSymptomAcknowledgement(patientId, symptom.id)
          .then(onChanged)
          .catch((caught) => toast(errorMessage(caught)));
      });
    } catch (caught) {
      toast(errorMessage(caught));
    }
  };
  return (
    <div className={clinicStyles.outcomes} role="group" aria-label={`What did you do about the ${symptom.label.toLowerCase()}?`}>
      {OUTCOMES.map((outcome) => (
        <button key={outcome} type="button" className={clinicStyles.outcome} onClick={() => record(outcome)}>
          {outcome}
        </button>
      ))}
    </div>
  );
}

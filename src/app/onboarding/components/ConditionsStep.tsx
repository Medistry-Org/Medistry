/** Question 7: health conditions in a grid, "None of these", and a box for "Something else". */

import formStyles from "@/components/ui/styles/FormControls.module.css";
import { conditionsFor } from "../onboardingOptions";
import { visibleConditionCodes, type DraftChanges, type OnboardingDraft, type Problem } from "../useOnboardingProgress";
import FieldError, { fieldErrorId } from "./FieldError";
import AnswerOptions from "./AnswerOptions";
import styles from "../OnboardingPage.module.css";

const NONE = "NONE";

type Props = { draft: OnboardingDraft; problem: Problem | null; update: (changes: DraftChanges) => void };

export default function ConditionsStep({ draft, problem, update }: Props) {
  const shown = visibleConditionCodes(draft);
  const invalid = problem?.field === "otherText";
  return (
    <div className={styles.fields}>
      <AnswerOptions
        label="Conditions"
        multi
        grid
        options={[...conditionsFor(draft.gender).map((c) => ({ value: c.code, label: c.label })), { value: NONE, label: "None of these" }]}
        selected={draft.noConditions ? [NONE] : shown}
        onToggle={(code) => {
          if (code === NONE) update({ noConditions: !draft.noConditions, conditionCodes: [], otherText: "" });
          else update({ noConditions: false, conditionCodes: draft.conditionCodes.includes(code) ? draft.conditionCodes.filter((x) => x !== code) : [...draft.conditionCodes, code] });
        }}
      />
      {shown.includes("OTHER") && !draft.noConditions && (
        <div className={`${formStyles.field} ${styles.reveal}`}>
          <label className="sr-only" htmlFor="onboarding-other-condition">
            What is it?
          </label>
          <input
            id="onboarding-other-condition"
            className={`${formStyles.input} ${styles.otherInput}`}
            value={draft.otherText}
            placeholder="What is it? For example, asthma"
            autoFocus
            aria-invalid={invalid}
            aria-describedby={invalid ? fieldErrorId("otherText") : undefined}
            onChange={(e) => update({ otherText: e.target.value })}
          />
          <FieldError problem={problem} field="otherText" />
        </div>
      )}
    </div>
  );
}

/** Question 7: health conditions in a grid, "None of these", and a box for "Something else". */

import formStyles from "@/components/ui/styles/FormControls.module.css";
import type { OnboardingConfig } from "@/types/onboarding";
import { conditionsFor } from "@/app/onboarding/onboardingOptions";
import {
  visibleConditionCodes,
  type DraftChanges,
  type OnboardingDraft,
  type Problem,
} from "@/app/onboarding/onboardingDraft";
import FieldError, { fieldErrorId } from "./FieldError";
import AnswerOptions from "./AnswerOptions";
import pageStyles from "@/app/onboarding/OnboardingPage.module.css";
import styles from "./ConditionsQuestion.module.css";

type Props = {
  config: OnboardingConfig;
  draft: OnboardingDraft;
  problem: Problem | null;
  update: (changes: DraftChanges) => void;
};

const NONE = "NONE";

export default function ConditionsQuestion({
  config,
  draft,
  problem,
  update,
}: Props) {
  const shown = visibleConditionCodes(draft, config);
  const invalid = problem?.field === "otherText";
  return (
    <div className={pageStyles.fields}>
      <AnswerOptions
        label="Conditions"
        multi
        grid
        options={[
          ...conditionsFor(config.conditions, draft.gender).map(
            (condition) => ({ value: condition.code, label: condition.label }),
          ),
          { value: NONE, label: "None of these" },
        ]}
        selected={draft.noConditions ? [NONE] : shown}
        onToggle={(code) => {
          if (code === NONE)
            update({
              noConditions: !draft.noConditions,
              conditionCodes: [],
              otherText: "",
            });
          else
            update({
              noConditions: false,
              conditionCodes: draft.conditionCodes.includes(code)
                ? draft.conditionCodes.filter((ticked) => ticked !== code)
                : [...draft.conditionCodes, code],
            });
        }}
      />
      {shown.includes("OTHER") && !draft.noConditions && (
        <div className={`${formStyles.field} ${styles.reveal}`}>
          <label className="sr-only" htmlFor="onboarding-other-condition">
            What is it?
          </label>
          <input
            id="onboarding-other-condition"
            className={`${formStyles.input} ${pageStyles.otherInput}`}
            value={draft.otherText}
            placeholder="What is it? For example, asthma"
            autoFocus
            aria-invalid={invalid}
            aria-describedby={invalid ? fieldErrorId("otherText") : undefined}
            onChange={(event) => update({ otherText: event.target.value })}
          />
          <FieldError problem={problem} field="otherText" />
        </div>
      )}
    </div>
  );
}

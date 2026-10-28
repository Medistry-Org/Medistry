/** Question 5: weight on a ruler, in kg or lb, with the BMI it gives against Indian cut-offs. */

import MeasureField from "./measure-field/MeasureField";
import {
  bmiOf,
  type DraftChanges,
  type OnboardingDraft,
} from "@/app/onboarding/onboardingDraft";
import {
  HEIGHT_FROM_CM,
  WEIGHT_FROM_KG,
} from "@/app/onboarding/onboardingOptions";
import BmiReadout from "@/app/onboarding/components/BmiReadout";
import MeasureInstrument from "./MeasureInstrument";

export default function WeightQuestion({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (changes: DraftChanges) => void;
}) {
  return (
    <MeasureInstrument
      empty={draft.weightKg === null}
      hint="Your weight"
      onStart={() => update({ weightKg: WEIGHT_FROM_KG })}
    >
      <MeasureField
        kind="weight"
        label="Weight"
        value={draft.weightKg ?? WEIGHT_FROM_KG}
        min={30}
        max={250}
        onChange={(weightKg) => update({ weightKg })}
      />
      <BmiReadout
        bmi={bmiOf(draft.heightCm ?? HEIGHT_FROM_CM, draft.weightKg)}
      />
    </MeasureInstrument>
  );
}

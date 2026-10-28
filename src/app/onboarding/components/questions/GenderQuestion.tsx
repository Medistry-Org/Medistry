/** Question 2: one answer, which moves on by itself a beat after the tap. */

import type {
  Gender,
  OnboardingConfig,
  OnboardingStepAnswer,
} from "@/types/onboarding";
import type {
  DraftChanges,
  OnboardingDraft,
} from "@/app/onboarding/onboardingDraft";
import AnswerOptions from "./AnswerOptions";

type Props = {
  genders: OnboardingConfig["genders"];
  draft: OnboardingDraft;
  update: (changes: DraftChanges) => void;
  pickThenGo: (answer: OnboardingStepAnswer) => void;
};

export default function GenderQuestion({
  genders,
  draft,
  update,
  pickThenGo,
}: Props) {
  return (
    <AnswerOptions
      label="Gender"
      options={genders.map((gender) => ({
        value: gender.code,
        label: gender.label,
      }))}
      selected={draft.gender ? [draft.gender] : []}
      onToggle={(value) => {
        const gender = value as Gender;
        update({ gender });
        pickThenGo({ step: 2, gender });
      }}
    />
  );
}

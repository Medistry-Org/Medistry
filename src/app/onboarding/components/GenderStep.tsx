/** Question 2: one answer, which moves on by itself a beat after the tap. */

import type { Gender, OnboardingStepAnswer } from "@/types/onboarding";
import { GENDERS } from "../onboardingOptions";
import type { DraftChanges, OnboardingDraft } from "../useOnboardingProgress";
import AnswerOptions from "./AnswerOptions";

type Props = {
  draft: OnboardingDraft;
  update: (changes: DraftChanges) => void;
  pickThenGo: (answer: OnboardingStepAnswer) => void;
};

export default function GenderStep({ draft, update, pickThenGo }: Props) {
  return (
    <AnswerOptions
      label="Gender"
      options={GENDERS}
      selected={draft.gender ? [draft.gender] : []}
      onToggle={(value) => {
        const gender = value as Gender;
        update({ gender });
        pickThenGo({ step: 2, gender });
      }}
    />
  );
}

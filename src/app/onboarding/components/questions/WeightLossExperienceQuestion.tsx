/** Question 6: what the patient has tried before (many answers; a first attempt clears the rest). */

import type { OnboardingOption } from "@/types/onboarding";
import AnswerOptions from "./AnswerOptions";

type Props = {
  experiences: OnboardingOption[];
  selected: string[];
  onToggle: (code: string) => void;
};

export default function WeightLossExperienceQuestion({
  experiences,
  selected,
  onToggle,
}: Props) {
  return (
    <AnswerOptions
      label="Previous experience"
      multi
      options={experiences.map((experience) => ({
        value: experience.code,
        label: experience.label,
      }))}
      selected={selected}
      onToggle={onToggle}
    />
  );
}

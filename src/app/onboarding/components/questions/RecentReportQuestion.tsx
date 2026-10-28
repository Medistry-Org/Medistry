/** Question 9: a blood test report from the last 3 months, yes or no. Moves on a beat after the tap. */

import type { OnboardingDraft } from "@/app/onboarding/onboardingDraft";
import AnswerOptions from "./AnswerOptions";

const YES = "YES";
const NO = "NO";

export default function RecentReportQuestion({
  draft,
  onPick,
}: {
  draft: OnboardingDraft;
  onPick: (hasRecentReport: boolean) => void;
}) {
  const selected =
    draft.hasRecentReport === null ? [] : [draft.hasRecentReport ? YES : NO];
  return (
    <AnswerOptions
      label="A blood test report from the last 3 months"
      options={[
        { value: YES, label: "Yes, I have one to upload" },
        { value: NO, label: "No, book a home blood test" },
      ]}
      selected={selected}
      onToggle={(value) => onPick(value === YES)}
    />
  );
}

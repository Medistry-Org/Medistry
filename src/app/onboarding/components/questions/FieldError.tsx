/** A problem, right under the box it is about. Renders nothing when the problem is about another field. */

import { WarningCircle } from "@phosphor-icons/react";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import type { Problem } from "@/app/onboarding/onboardingDraft";
import styles from "@/app/onboarding/OnboardingPage.module.css";

/** The id a box points its aria-describedby at, when it has a problem. */
export const fieldErrorId = (field: string) => `onboarding-${field}-error`;

export default function FieldError({
  problem,
  field,
}: {
  problem: Problem | null;
  field: NonNullable<Problem["field"]>;
}) {
  if (problem?.field !== field) return null;
  return (
    <p
      id={fieldErrorId(field)}
      className={`${formStyles.err} ${styles.fieldErr}`}
      role="alert"
    >
      <WarningCircle size={16} weight="fill" />
      {problem.message}
    </p>
  );
}

/** Question 3: age in years, typed or stepped with minus and plus (18 to 90). */

import { AGE_MAX, AGE_MIN } from "../onboardingOptions";
import type { DraftChanges, OnboardingDraft, Problem } from "../useOnboardingProgress";
import AgeStepButton from "./AgeStepButton";
import FieldError, { fieldErrorId } from "./FieldError";
import styles from "../OnboardingPage.module.css";

/** Where the steppers start counting from when nothing is typed yet; never shown as an answer. */
const AGE_FROM = 34;

type Props = { draft: OnboardingDraft; problem: Problem | null; update: (changes: DraftChanges) => void };

export default function AgeStep({ draft, problem, update }: Props) {
  const age = draft.age;
  const ageNumber = age ? Number(age) : null;
  const invalid = problem?.field === "ageYears";
  const stepAge = (d: 1 | -1) =>
    update((current) => {
      const from = current.age ? Number(current.age) : AGE_FROM;
      return { age: String(Math.min(AGE_MAX, Math.max(AGE_MIN, from + d))) };
    });
  return (
    <div className={styles.ageWrap}>
      <div className={`${styles.instrument} ${styles.age}`} data-invalid={invalid}>
        <div className={styles.ageHead}>
          <label htmlFor="onboarding-age">Age</label>
          <span className="num">
            {AGE_MIN} to {AGE_MAX}
          </span>
        </div>
        <div className={styles.ageRow}>
          <AgeStepButton direction={-1} label="One year less" disabled={ageNumber !== null && ageNumber <= AGE_MIN} onStep={stepAge} />
          <span className={styles.ageValue}>
            <input
              id="onboarding-age"
              className={`${styles.bigInput} num`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              placeholder="Your age"
              data-empty={!age}
              // two digits wide, three when typed, so "years" always sits beside the number; empty, the hint's width
              style={{ width: age ? `${Math.max(2, age.length)}ch` : "5.5rem" }}
              value={age}
              aria-invalid={invalid}
              aria-describedby={invalid ? fieldErrorId("ageYears") : undefined}
              onChange={(e) => update({ age: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            />
            {age && <span className={styles.bigUnit}>years</span>}
          </span>
          <AgeStepButton direction={1} label="One year more" disabled={ageNumber !== null && ageNumber >= AGE_MAX} onStep={stepAge} />
        </div>
      </div>
      <FieldError problem={problem} field="ageYears" />
    </div>
  );
}

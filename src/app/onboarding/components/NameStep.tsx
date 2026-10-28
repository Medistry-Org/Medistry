/** Question 1: first name, optional last name and email. */

import formStyles from "@/components/ui/styles/FormControls.module.css";
import type { DraftChanges, OnboardingDraft, Problem } from "../useOnboardingProgress";
import FieldError, { fieldErrorId } from "./FieldError";
import styles from "../OnboardingPage.module.css";

type Props = { draft: OnboardingDraft; problem: Problem | null; update: (changes: DraftChanges) => void };

export default function NameStep({ draft, problem, update }: Props) {
  const describedBy = (field: "firstName" | "email") => (problem?.field === field ? fieldErrorId(field) : undefined);
  return (
    <div className={styles.fields}>
      <div className={styles.two}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="onboarding-first-name">
            First name
          </label>
          <input
            id="onboarding-first-name"
            className={formStyles.input}
            autoComplete="given-name"
            autoCapitalize="words"
            value={draft.firstName}
            aria-invalid={problem?.field === "firstName"}
            aria-describedby={describedBy("firstName")}
            onChange={(e) => update({ firstName: e.target.value })}
          />
          <FieldError problem={problem} field="firstName" />
        </div>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="onboarding-last-name">
            Last name <span className={styles.opt}>optional</span>
          </label>
          <input
            id="onboarding-last-name"
            className={formStyles.input}
            autoComplete="family-name"
            autoCapitalize="words"
            value={draft.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
          />
        </div>
      </div>
      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="onboarding-email">
          Email
        </label>
        <input
          id="onboarding-email"
          className={formStyles.input}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="you@example.com"
          value={draft.email}
          aria-invalid={problem?.field === "email"}
          aria-describedby={describedBy("email")}
          onChange={(e) => update({ email: e.target.value })}
        />
        <FieldError problem={problem} field="email" />
      </div>
    </div>
  );
}

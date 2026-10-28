/** Question 1: first name, optional last name and email. */

import formStyles from "@/components/ui/styles/FormControls.module.css";
import type {
  DraftChanges,
  OnboardingDraft,
  Problem,
} from "@/app/onboarding/onboardingDraft";
import FieldError, { fieldErrorId } from "./FieldError";
import pageStyles from "@/app/onboarding/OnboardingPage.module.css";
import styles from "./NameQuestion.module.css";

type Props = {
  draft: OnboardingDraft;
  problem: Problem | null;
  update: (changes: DraftChanges) => void;
};

export default function NameQuestion({ draft, problem, update }: Props) {
  const describedBy = (field: "firstName" | "email") =>
    problem?.field === field ? fieldErrorId(field) : undefined;
  return (
    <div className={pageStyles.fields}>
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
            onChange={(event) => update({ firstName: event.target.value })}
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
            onChange={(event) => update({ lastName: event.target.value })}
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
          onChange={(event) => update({ email: event.target.value })}
        />
        <FieldError problem={problem} field="email" />
      </div>
    </div>
  );
}

/**
 * One question on screen: the chapter tag, the question and its reason, the answers (children),
 * a problem with no box of its own, and the docked Continue with the "saved as you go" line.
 */

import type { CSSProperties, ReactNode, RefObject } from "react";
import { ArrowRight, Check, LockSimple, WarningCircle } from "@phosphor-icons/react";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import { STEP_QUESTIONS, TOTAL_STEPS } from "../onboardingOptions";
import type { Problem } from "../useOnboardingProgress";
import ChapterTag from "./ChapterTag";
import styles from "../OnboardingPage.module.css";

type Props = {
  step: number;
  chapterName: string;
  direction: 1 | -1;
  busy: boolean;
  canContinue: boolean;
  problem: Problem | null;
  welcomeBack: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSubmit: () => void;
  children: ReactNode;
};

export default function QuestionForm({ step, chapterName, direction, busy, canContinue, problem, welcomeBack, formRef, headingRef, onSubmit, children }: Props) {
  const { question, why } = STEP_QUESTIONS[step];
  return (
    <form
      ref={formRef}
      className={styles.stage}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div key={step} className={styles.step} style={{ "--dir": direction } as CSSProperties}>
        <ChapterTag>{chapterName}</ChapterTag>
        <div className={styles.head}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.q}>
            {question}
          </h1>
          <p className={styles.why}>{why}</p>
        </div>
        {children}
        {problem && !problem.field && (
          <p className={`${formStyles.err} ${styles.fieldErr}`} role="alert">
            <WarningCircle size={16} weight="fill" />
            {problem.message}
          </p>
        )}
      </div>

      <div className={styles.dock}>
        {/* looks unavailable until the answer is complete, but a tap still says what is missing */}
        <button type="submit" className={`btn ${formStyles.go}`} aria-disabled={!canContinue} data-busy={busy} aria-busy={busy}>
          <span>{busy ? "Saving" : step === TOTAL_STEPS ? "Finish" : "Continue"}</span>
          <span className="well" aria-hidden="true">
            {busy ? <i className={formStyles.spin} /> : <ArrowRight size={18} />}
          </span>
        </button>
        <p className={`${formStyles.demo} ${welcomeBack ? styles.back : ""}`} role="status">
          {welcomeBack ? <Check size={13} weight="bold" /> : <LockSimple size={13} />}
          {welcomeBack ? "Welcome back. Your answers are saved." : "Saved as you go."}
        </p>
      </div>
    </form>
  );
}

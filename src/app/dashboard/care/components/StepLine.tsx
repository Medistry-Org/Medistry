/**
 * A short status, step by step, across the card at every width: done steps solid, the current one a
 * thicker bar in the signal colour, the rest as hairlines (the design's Care "Steps").
 */

import styles from "../CarePage.module.css";

export default function StepLine({ steps, currentIndex, label }: { steps: { label: string; when?: string | null }[]; currentIndex: number; label: string }) {
  return (
    <ol className={styles.steps} aria-label={label}>
      {steps.map((step, i) => (
        <li key={step.label} data-state={i < currentIndex ? "done" : i === currentIndex ? "now" : "later"}>
          <i aria-hidden="true" />
          <span className={styles.stepLabel}>{step.label}</span>
          {step.when && <span className={`${styles.stepWhen} num`}>{step.when}</span>}
          <span className="sr-only">{i < currentIndex ? ", done" : i === currentIndex ? ", now" : ", to come"}</span>
        </li>
      ))}
    </ol>
  );
}

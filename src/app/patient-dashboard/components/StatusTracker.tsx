/**
 * A status, step by step (lab booking, medicine order): done steps solid, the current one lit,
 * the rest as hairlines. `currentIndex` is the step happening now.
 */

import styles from "./StatusTracker.module.css";

const SPOKEN_STATE = {
  done: "done",
  now: "current",
  later: "to come",
} as const;

const stateOf = (index: number, currentIndex: number) =>
  index < currentIndex ? "done" : index === currentIndex ? "now" : "later";

export default function StatusTracker({
  steps,
  currentIndex,
  whenFor,
}: {
  steps: { label: string }[];
  currentIndex: number;
  whenFor?: (index: number) => string | null;
}) {
  return (
    <ol className={styles.tracker}>
      {steps.map((step, i) => {
        const state = stateOf(i, currentIndex);
        const when = whenFor?.(i);
        return (
          <li key={step.label} data-state={state}>
            <span className={styles.trackDot} aria-hidden="true" />
            <span className={styles.trackLabel}>{step.label}</span>
            {when && <span className={`${styles.trackWhen} num`}>{when}</span>}
            <span className="sr-only">{SPOKEN_STATE[state]}</span>
          </li>
        );
      })}
    </ol>
  );
}

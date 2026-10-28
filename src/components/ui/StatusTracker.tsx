import surfaceStyles from "./styles/Surfaces.module.css";

/**
 * A status, step by step (lab booking, medicine order): done steps solid, the current one lit,
 * the rest as hairlines. `currentIndex` is the step happening now.
 */
export default function StatusTracker({ steps, currentIndex, whenFor }: { steps: { label: string }[]; currentIndex: number; whenFor?: (index: number) => string | null }) {
  return (
    <ol className={surfaceStyles.tracker}>
      {steps.map((step, i) => (
        <li key={step.label} data-state={i < currentIndex ? "done" : i === currentIndex ? "now" : "later"}>
          <span className={surfaceStyles.trackDot} aria-hidden="true" />
          <span className={surfaceStyles.trackLabel}>{step.label}</span>
          {whenFor?.(i) && <span className={`${surfaceStyles.trackWhen} num`}>{whenFor(i)}</span>}
          <span className="sr-only">{i < currentIndex ? "done" : i === currentIndex ? "current" : "to come"}</span>
        </li>
      ))}
    </ol>
  );
}

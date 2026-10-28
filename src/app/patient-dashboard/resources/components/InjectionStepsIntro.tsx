/*
  The first injection's written version (Arhaan Guides.tsx StepsIntro): the way into the steps
  straight under the video, then the six step titles as a read-only outline.
*/

import { ArrowRight } from "@phosphor-icons/react";
import { INJECTION_STEPS } from "../content/guideContent";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "./InjectionStepsIntro.module.css";

export default function InjectionStepsIntro({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <div className={styles.stepsIntro}>
      <button
        type="button"
        className={`btn ${formStyles.go} ${styles.stepsGo}`}
        onClick={onStart}
      >
        <span>Go through the steps</span>
        <span className="well" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      </button>
      <p>
        One step a screen, with a timer for the hold. If a weekly injection is
        prescribed for you, follow the leaflet in your box with these steps.
      </p>
      {/* a read-only outline, so no rules between the lines: nothing here looks tappable */}
      <ol className={`${styles.stepTitles} ${styles.outline}`}>
        {INJECTION_STEPS.map((step) => (
          <li key={step.title}>{step.title}</li>
        ))}
      </ol>
      <p className={formStyles.hint}>
        If you feel nervous or get stuck on a step, message your care team in
        Chat and someone can talk you through it.
      </p>
    </div>
  );
}

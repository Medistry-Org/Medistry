/** Question 5: weight on a ruler, in kg or lb, with the BMI it gives against Indian cut-offs. */

import BandTrack from "@/components/ui/BandTrack";
import MeasureField from "@/components/ui/MeasureField";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import type { DraftChanges, OnboardingDraft } from "../useOnboardingProgress";
import { HEIGHT_FROM_CM, WEIGHT_FROM_KG } from "../onboardingOptions";
import MeasureInstrument from "./MeasureInstrument";
import styles from "../OnboardingPage.module.css";

const bmiOf = (heightCm: number, weightKg: number) => Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;

export default function WeightStep({ draft, update }: { draft: OnboardingDraft; update: (changes: DraftChanges) => void }) {
  const bmi = draft.weightKg !== null ? bmiOf(draft.heightCm ?? HEIGHT_FROM_CM, draft.weightKg) : null;
  return (
    <MeasureInstrument empty={draft.weightKg === null} hint="Your weight" onStart={() => update({ weightKg: WEIGHT_FROM_KG })}>
      <MeasureField kind="weight" label="Weight" value={draft.weightKg ?? WEIGHT_FROM_KG} min={30} max={250} onChange={(weightKg) => update({ weightKg })} />
      <div className={styles.bmi}>
        <div className={styles.bmiHead}>
          <span>Your BMI</span>
          {bmi !== null && <strong className="num">{bmi.toFixed(1)}</strong>}
        </div>
        <BandTrack
          min={15}
          max={40}
          value={bmi ?? undefined}
          bands={[
            { to: 18.5, tone: 0 },
            { to: 23, tone: 1 },
            { to: 40, tone: 2 },
          ]}
          cuts={[18.5, 23]}
        />
        <p className={`${formStyles.hint} ${styles.bmiHint}`}>Indian guidelines put the healthy range at 18.5 to 23.</p>
      </div>
    </MeasureInstrument>
  );
}

/** The BMI from the height and weight answers, on the banded track, against Indian cut-offs. */

import BandTrack from "./BandTrack";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import pageStyles from "../OnboardingPage.module.css";
import styles from "./BmiReadout.module.css";

export default function BmiReadout({ bmi }: { bmi: number | null }) {
  return (
    <div className={pageStyles.bmi}>
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
      <p className={`${formStyles.hint} ${pageStyles.bmiHint}`}>
        Indian guidelines put the healthy range at 18.5 to 23.
      </p>
    </div>
  );
}

/** Question 4: height on a ruler, in feet and inches or centimetres. */

import MeasureField from "./measure-field/MeasureField";
import type {
  DraftChanges,
  OnboardingDraft,
} from "@/app/onboarding/onboardingDraft";
import { HEIGHT_FROM_CM } from "@/app/onboarding/onboardingOptions";
import MeasureInstrument from "./MeasureInstrument";

export default function HeightQuestion({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (changes: DraftChanges) => void;
}) {
  return (
    <MeasureInstrument
      empty={draft.heightCm === null}
      hint="Your height"
      onStart={() => update({ heightCm: HEIGHT_FROM_CM })}
    >
      <MeasureField
        kind="height"
        label="Height"
        value={draft.heightCm ?? HEIGHT_FROM_CM}
        min={137}
        max={213}
        onChange={(heightCm) => update({ heightCm })}
      />
    </MeasureInstrument>
  );
}

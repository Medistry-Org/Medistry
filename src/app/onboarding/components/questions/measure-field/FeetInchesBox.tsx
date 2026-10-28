"use client";

/** Height in feet and inches as two small typeable boxes beside the ruler; the value is total inches. */

import { useState } from "react";
// the same typed-number look as NumberBox, plus its narrow two-digit box (typeShort)
import numberBoxStyles from "./NumberBox.module.css";

type Props = {
  id: string;
  inches: number;
  min: number;
  max: number;
  onChange: (inches: number) => void;
};

export default function FeetInchesBox({
  id,
  inches,
  min,
  max,
  onChange,
}: Props) {
  const total = Math.round(inches);
  const feet = Math.floor(total / 12);
  const extraInches = total % 12;
  const [draftFeet, setDraftFeet] = useState<string | null>(null);
  const [draftInches, setDraftInches] = useState<string | null>(null);
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  // live: commit only a valid value while typing; otherwise clamp it (on blur)
  const commit = (typedFeet: number, typedInches: number, live: boolean) => {
    const inchesTotal = typedFeet * 12 + typedInches;
    if (!Number.isFinite(inchesTotal)) return;
    if (!live) onChange(clamp(inchesTotal));
    else if (
      inchesTotal >= min &&
      inchesTotal <= max &&
      typedInches >= 0 &&
      typedInches < 12
    )
      onChange(inchesTotal);
  };
  const boxClass = `${numberBoxStyles.type} ${numberBoxStyles.typeShort}`;
  return (
    <span className={numberBoxStyles.typeWrap}>
      <input
        id={id}
        aria-label="Feet"
        className={boxClass}
        onFocus={(event) => event.currentTarget.select()}
        type="number"
        inputMode="numeric"
        min={3}
        max={7}
        value={draftFeet ?? String(feet)}
        onChange={(event) => {
          setDraftFeet(event.target.value);
          if (event.target.value !== "")
            commit(Number(event.target.value), extraInches, true);
        }}
        onBlur={() => {
          if (draftFeet !== null && draftFeet !== "")
            commit(Number(draftFeet), extraInches, false);
          setDraftFeet(null);
        }}
      />
      <span className={numberBoxStyles.typeUnit}>ft</span>
      <input
        aria-label="Inches"
        className={boxClass}
        onFocus={(event) => event.currentTarget.select()}
        type="number"
        inputMode="numeric"
        min={0}
        max={11}
        value={draftInches ?? String(extraInches)}
        onChange={(event) => {
          setDraftInches(event.target.value);
          if (event.target.value !== "")
            commit(feet, Number(event.target.value), true);
        }}
        onBlur={() => {
          if (draftInches !== null && draftInches !== "")
            commit(feet, Math.min(11, Math.max(0, Number(draftInches))), false);
          setDraftInches(null);
        }}
      />
      <span className={numberBoxStyles.typeUnit}>in</span>
    </span>
  );
}

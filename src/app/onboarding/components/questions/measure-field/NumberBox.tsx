"use client";

/** The typeable number beside a ruler: commits valid values live and clamps on blur. */

import { useState } from "react";
import styles from "./NumberBox.module.css";

type Props = {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
};

export default function NumberBox({
  id,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: Props) {
  // what the visitor is typing, kept until it is a usable number; the value follows valid input live
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (typed: number) => Math.min(max, Math.max(min, typed));
  // one decimal, so a typed 79.6 never reads as 80; the box grows to fit it
  const shown = String(Math.round(value * 10) / 10);
  const chars = (draft ?? shown).length;
  return (
    <span className={styles.typeWrap}>
      <input
        id={id}
        className={styles.type}
        // a tap selects the number, so typing replaces it instead of adding to it
        onFocus={(event) => event.currentTarget.select()}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? shown}
        style={chars > 4 ? { width: `${chars + 0.4}ch` } : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          const typed = Number(event.target.value);
          if (
            event.target.value !== "" &&
            Number.isFinite(typed) &&
            typed >= min &&
            typed <= max
          )
            onChange(typed);
        }}
        onBlur={() => {
          const typed = Number(draft);
          if (draft !== null && draft !== "" && Number.isFinite(typed))
            onChange(clamp(typed));
          setDraft(null);
        }}
      />
      <span className={styles.typeUnit}>{unit}</span>
    </span>
  );
}

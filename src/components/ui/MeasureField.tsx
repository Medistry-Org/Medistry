"use client";

/**
 * MeasureField: weight, height or waist on a ruler slider, with a typeable number and a unit switch
 * (from the design repository's tools kit). The visitor picks kg/lb, cm/ft or cm/in, remembered on
 * this device by @/lib/units/measurementUnits; the value in and out is always kilograms or centimetres.
 */

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { cmTo, fmtHeight, fmtLength, fmtWeight, kgTo, setUnits, toCm, toKg, useUnits } from "@/lib/units/measurementUnits";
import styles from "./MeasureField.module.css";

/* ruler graduations that read like a real edge: a minor tick every m units, a major every 5m */
function graduations(span: number) {
  const minor = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find((c) => span / c <= 56) ?? 100;
  return { "--major": span / (minor * 5), "--minor": span / minor };
}

/** A typeable number that commits valid values live and clamps on blur. */
function NumberBox({
  id,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  // what the visitor is typing, kept until it is a usable number; the value follows valid input live
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  // one decimal, so a typed 79.6 never reads as 80; the box grows to fit it
  const shown = String(Math.round(value * 10) / 10);
  const chars = (draft ?? shown).length;
  return (
    <span className={styles.typeWrap}>
      <input
        id={id}
        className={styles.type}
        // a tap selects the number, so typing replaces it instead of adding to it
        onFocus={(e) => e.currentTarget.select()}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? shown}
        style={chars > 4 ? { width: `${chars + 0.4}ch` } : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(v) && v >= min && v <= max) onChange(v);
        }}
        onBlur={() => {
          const v = Number(draft);
          if (draft !== null && draft !== "" && Number.isFinite(v)) onChange(clamp(v));
          setDraft(null);
        }}
      />
      <span className={styles.typeUnit}>{unit}</span>
    </span>
  );
}

/** Feet and inches as two small boxes; the value is total inches. */
function FeetInchesBox({ id, inches, min, max, onChange }: { id: string; inches: number; min: number; max: number; onChange: (inches: number) => void }) {
  const total = Math.round(inches);
  const feet = Math.floor(total / 12);
  const inch = total % 12;
  const [draftFeet, setDraftFeet] = useState<string | null>(null);
  const [draftInches, setDraftInches] = useState<string | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const commit = (f: number, i: number, live: boolean) => {
    const t = f * 12 + i;
    if (!Number.isFinite(t)) return;
    if (!live) onChange(clamp(t));
    else if (t >= min && t <= max && i >= 0 && i < 12) onChange(t);
  };
  return (
    <span className={styles.typeWrap}>
      <input
        id={id}
        aria-label="Feet"
        className={`${styles.type} ${styles.typeShort}`}
        onFocus={(e) => e.currentTarget.select()}
        type="number"
        inputMode="numeric"
        min={3}
        max={7}
        value={draftFeet ?? String(feet)}
        onChange={(e) => {
          setDraftFeet(e.target.value);
          if (e.target.value !== "") commit(Number(e.target.value), inch, true);
        }}
        onBlur={() => {
          if (draftFeet !== null && draftFeet !== "") commit(Number(draftFeet), inch, false);
          setDraftFeet(null);
        }}
      />
      <span className={styles.typeUnit}>ft</span>
      <input
        aria-label="Inches"
        className={`${styles.type} ${styles.typeShort}`}
        onFocus={(e) => e.currentTarget.select()}
        type="number"
        inputMode="numeric"
        min={0}
        max={11}
        value={draftInches ?? String(inch)}
        onChange={(e) => {
          setDraftInches(e.target.value);
          if (e.target.value !== "") commit(feet, Number(e.target.value), true);
        }}
        onBlur={() => {
          if (draftInches !== null && draftInches !== "") commit(feet, Math.min(11, Math.max(0, Number(draftInches))), false);
          setDraftInches(null);
        }}
      />
      <span className={styles.typeUnit}>in</span>
    </span>
  );
}

/** Two small options beside the label: which unit this measure is shown and typed in. */
function UnitSwitch<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; label: string; name: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <span
      className={styles.units}
      role="radiogroup"
      aria-label={`${label} unit`}
      style={{ "--at": Math.max(0, options.findIndex((o) => o.v === value)) } as CSSProperties}
    >
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={o.v === value}
          aria-label={o.name}
          tabIndex={o.v === value ? 0 : -1}
          onClick={() => onChange(o.v)}
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
            e.preventDefault();
            const other = options.find((x) => x.v !== value) ?? o;
            onChange(other.v);
            (e.currentTarget.parentElement?.querySelector(`[aria-label="${other.name}"]`) as HTMLElement | null)?.focus();
          }}
          className={styles.unitBtn}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

type SliderSpec = { value: number; min: number; max: number; step: number; ends: [string, string]; text: string; to: (v: number) => number };

export default function MeasureField({
  kind,
  label,
  value,
  min,
  max,
  plain = false,
  onChange,
}: {
  kind: "weight" | "height" | "waist";
  label: string;
  /** kilograms for weight, centimetres for height and waist */
  value: number;
  min: number;
  max: number;
  /** a bare slider without graduations or end labels */
  plain?: boolean;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const units = useUnits();

  let head: ReactNode;
  let switcher: ReactNode;
  let slider: SliderSpec;

  if (kind === "weight") {
    const u = units.weight;
    const displayMin = Math.ceil(kgTo(min, u));
    const displayMax = Math.floor(kgTo(max, u));
    const v = kgTo(value, u);
    slider = { value: Math.round(v), min: displayMin, max: displayMax, step: 1, ends: [String(displayMin), String(displayMax)], text: fmtWeight(value, u), to: (x) => toKg(x, u) };
    head = <NumberBox id={`${id}-n`} value={v} min={displayMin} max={displayMax} step={1} unit={u} onChange={(x) => onChange(toKg(x, u))} />;
    switcher = (
      <UnitSwitch
        label={label}
        value={u}
        onChange={(w) => {
          setUnits({ weight: w });
          // land on a whole number in the new unit, so the box never shows a long conversion
          onChange(toKg(Math.round(kgTo(value, w)), w));
        }}
        options={[
          { v: "kg", label: "kg", name: "Kilograms" },
          { v: "lb", label: "lb", name: "Pounds" },
        ]}
      />
    );
  } else if (kind === "height") {
    const u = units.height;
    if (u === "cm") {
      slider = { value: Math.round(value), min, max, step: 1, ends: [String(min), String(max)], text: fmtHeight(value, u), to: (x) => x };
      head = <NumberBox id={`${id}-n`} value={value} min={min} max={max} step={1} unit="cm" onChange={onChange} />;
    } else {
      const inchMin = Math.ceil(min / 2.54);
      const inchMax = Math.floor(max / 2.54);
      const now = Math.round(value / 2.54);
      slider = {
        value: now,
        min: inchMin,
        max: inchMax,
        step: 1,
        ends: [fmtHeight(inchMin * 2.54, "ftin"), fmtHeight(inchMax * 2.54, "ftin")],
        text: `${Math.floor(now / 12)} feet ${now % 12} inches`,
        to: (x) => x * 2.54,
      };
      head = <FeetInchesBox id={`${id}-n`} inches={value / 2.54} min={inchMin} max={inchMax} onChange={(x) => onChange(x * 2.54)} />;
    }
    switcher = (
      <UnitSwitch
        label={label}
        value={u}
        onChange={(h) => {
          setUnits({ height: h });
          onChange(h === "cm" ? Math.round(value) : Math.round(value / 2.54) * 2.54);
        }}
        options={[
          { v: "cm", label: "cm", name: "Centimetres" },
          { v: "ftin", label: "ft", name: "Feet and inches" },
        ]}
      />
    );
  } else {
    const u = units.waist;
    const step = u === "in" ? 0.5 : 1;
    const displayMin = u === "in" ? Math.ceil(cmTo(min, u)) : min;
    const displayMax = u === "in" ? Math.floor(cmTo(max, u)) : max;
    const v = cmTo(value, u);
    slider = { value: Math.round(v / step) * step, min: displayMin, max: displayMax, step, ends: [String(displayMin), String(displayMax)], text: fmtLength(value, u), to: (x) => toCm(x, u) };
    head = <NumberBox id={`${id}-n`} value={v} min={displayMin} max={displayMax} step={0.1} unit={u} onChange={(x) => onChange(toCm(x, u))} />;
    switcher = (
      <UnitSwitch
        label={label}
        value={u}
        onChange={(w) => setUnits({ waist: w })}
        options={[
          { v: "cm", label: "cm", name: "Centimetres" },
          { v: "in", label: "in", name: "Inches" },
        ]}
      />
    );
  }

  const clamped = Math.min(slider.max, Math.max(slider.min, slider.value));
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <span className={styles.labelRow}>
          <label htmlFor={`${id}-n`}>{label}</label>
          {switcher}
        </span>
        {head}
      </div>
      <div
        className={`${styles.rangeWrap} ${plain ? styles.plainRange : ""}`}
        style={{ "--fill": (clamped - slider.min) / (slider.max - slider.min), ...(plain ? {} : graduations(slider.max - slider.min)) } as CSSProperties}
      >
        <input
          aria-label={`${label}, slider`}
          type="range"
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={clamped}
          aria-valuetext={slider.text}
          onChange={(e) => onChange(slider.to(Number(e.target.value)))}
          className={styles.range}
        />
      </div>
      {!plain && (
        <div className={styles.scaleEnds} aria-hidden="true">
          <span className="num">{slider.ends[0]}</span>
          <span className="num">{slider.ends[1]}</span>
        </div>
      )}
    </div>
  );
}

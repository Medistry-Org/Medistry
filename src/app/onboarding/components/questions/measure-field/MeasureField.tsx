"use client";

/**
 * Height or weight on a ruler slider, with a typeable number (NumberBox, or FeetInchesBox for
 * feet and inches) and a unit switch (from the design repository's tools kit). The patient picks
 * kg/lb or cm/ft, remembered on this device by @/lib/units/measurementUnits; the value in and out
 * is always kilograms or centimetres.
 */

import { useId, type CSSProperties, type ReactNode } from "react";
import {
  formatHeight,
  formatWeight,
  kgTo,
  setUnits,
  toKg,
  useUnits,
} from "@/lib/units/measurementUnits";
import FeetInchesBox from "./FeetInchesBox";
import NumberBox from "./NumberBox";
import UnitSwitch from "./UnitSwitch";
import styles from "./MeasureField.module.css";

type Props = {
  kind: "weight" | "height";
  label: string;
  /** kilograms for weight, centimetres for height */
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** The range input in display units; `to` turns its value back into kilograms or centimetres. */
type SliderSpec = {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  text: string;
  to: (shown: number) => number;
};

const CM_PER_INCH = 2.54;

/** Ruler graduations that read like a real edge: a minor tick every `minor` units, a major every five. */
function graduations(span: number) {
  const minor =
    [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find(
      (candidate) => span / candidate <= 56,
    ) ?? 100;
  return { "--major": span / (minor * 5), "--minor": span / minor };
}

/**
 * Labelled marks under the ruler at round values ("50 kg", "5 ft"), at most five; marks too close to
 * an end are left out so their text never runs past the ruler.
 */
function scaleMarks(
  min: number,
  max: number,
  every: number,
  text: (value: number) => string,
) {
  const marks: { at: number; text: string }[] = [];
  for (
    let value = Math.ceil(min / every) * every;
    value <= max;
    value += every
  ) {
    const at = (value - min) / (max - min);
    if (at >= 0.06 && at <= 0.94) marks.push({ at, text: text(value) });
  }
  return marks;
}

/** A round interval that gives at most five labelled marks. */
const roundStep = (span: number) =>
  [1, 2, 5, 10, 20, 25, 50, 100, 200].find((step) => span / step <= 5) ?? 500;

export default function MeasureField({
  kind,
  label,
  value,
  min,
  max,
  onChange,
}: Props) {
  const id = useId();
  const units = useUnits();

  let numberBox: ReactNode;
  let unitSwitch: ReactNode;
  let slider: SliderSpec;

  if (kind === "weight") {
    const unit = units.weight;
    const displayMin = Math.ceil(kgTo(min, unit));
    const displayMax = Math.floor(kgTo(max, unit));
    const shown = kgTo(value, unit);
    slider = {
      value: Math.round(shown),
      min: displayMin,
      max: displayMax,
      step: 1,
      unit,
      text: formatWeight(value, unit),
      to: (typed) => toKg(typed, unit),
    };
    numberBox = (
      <NumberBox
        id={`${id}-n`}
        value={shown}
        min={displayMin}
        max={displayMax}
        step={1}
        unit={unit}
        onChange={(typed) => onChange(toKg(typed, unit))}
      />
    );
    unitSwitch = (
      <UnitSwitch
        label={label}
        value={unit}
        onChange={(nextUnit) => {
          setUnits({ weight: nextUnit });
          // land on a whole number in the new unit, so the box never shows a long conversion
          onChange(toKg(Math.round(kgTo(value, nextUnit)), nextUnit));
        }}
        options={[
          { value: "kg", label: "kg", name: "Kilograms" },
          { value: "lb", label: "lb", name: "Pounds" },
        ]}
      />
    );
  } else {
    const unit = units.height;
    if (unit === "cm") {
      slider = {
        value: Math.round(value),
        min,
        max,
        step: 1,
        unit: "cm",
        text: formatHeight(value, unit),
        to: (typed) => typed,
      };
      numberBox = (
        <NumberBox
          id={`${id}-n`}
          value={value}
          min={min}
          max={max}
          step={1}
          unit="cm"
          onChange={onChange}
        />
      );
    } else {
      const inchMin = Math.ceil(min / CM_PER_INCH);
      const inchMax = Math.floor(max / CM_PER_INCH);
      const totalInches = Math.round(value / CM_PER_INCH);
      slider = {
        value: totalInches,
        min: inchMin,
        max: inchMax,
        step: 1,
        unit: "ft",
        text: `${Math.floor(totalInches / 12)} feet ${totalInches % 12} inches`,
        to: (typed) => typed * CM_PER_INCH,
      };
      numberBox = (
        <FeetInchesBox
          id={`${id}-n`}
          inches={value / CM_PER_INCH}
          min={inchMin}
          max={inchMax}
          onChange={(typed) => onChange(typed * CM_PER_INCH)}
        />
      );
    }
    unitSwitch = (
      <UnitSwitch
        label={label}
        value={unit}
        onChange={(nextUnit) => {
          setUnits({ height: nextUnit });
          onChange(
            nextUnit === "cm"
              ? Math.round(value)
              : Math.round(value / CM_PER_INCH) * CM_PER_INCH,
          );
        }}
        options={[
          { value: "cm", label: "cm", name: "Centimetres" },
          { value: "ftin", label: "ft", name: "Feet and inches" },
        ]}
      />
    );
  }

  const clamped = Math.min(slider.max, Math.max(slider.min, slider.value));
  // feet and inches: a mark at every whole foot (the slider runs in inches)
  const marks =
    slider.unit === "ft"
      ? scaleMarks(slider.min, slider.max, 12, (inches) => `${inches / 12} ft`)
      : scaleMarks(
          slider.min,
          slider.max,
          roundStep(slider.max - slider.min),
          (mark) => `${mark} ${slider.unit}`,
        );
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <span className={styles.labelRow}>
          <label htmlFor={`${id}-n`}>{label}</label>
          {unitSwitch}
        </span>
        {numberBox}
      </div>
      <div
        className={styles.rangeWrap}
        style={
          {
            "--fill": (clamped - slider.min) / (slider.max - slider.min),
            ...graduations(slider.max - slider.min),
          } as CSSProperties
        }
      >
        <input
          aria-label={`${label}, slider`}
          type="range"
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={clamped}
          aria-valuetext={slider.text}
          onChange={(event) => onChange(slider.to(Number(event.target.value)))}
          className={styles.range}
        />
      </div>
      <div className={styles.scaleMarks} aria-hidden="true">
        {marks.map((mark) => (
          <span
            key={mark.text}
            className="num"
            style={{ "--at": mark.at } as CSSProperties}
          >
            {mark.text}
          </span>
        ))}
      </div>
    </div>
  );
}

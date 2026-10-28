/** Two small options beside a ruler's label: which unit the measure is shown and typed in. */

import type { CSSProperties } from "react";
import styles from "./UnitSwitch.module.css";

type Props<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string; name: string }[];
  onChange: (value: T) => void;
};

export default function UnitSwitch<T extends string>({
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <span
      className={styles.units}
      role="radiogroup"
      aria-label={`${label} unit`}
      style={
        {
          "--at": Math.max(
            0,
            options.findIndex((option) => option.value === value),
          ),
        } as CSSProperties
      }
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.name}
          tabIndex={option.value === value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            // two options: any arrow key moves to the other one
            if (
              !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            )
              return;
            event.preventDefault();
            const other =
              options.find((candidate) => candidate.value !== value) ?? option;
            onChange(other.value);
            (
              event.currentTarget.parentElement?.querySelector(
                `[aria-label="${other.name}"]`,
              ) as HTMLElement | null
            )?.focus();
          }}
          className={styles.unitBtn}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}

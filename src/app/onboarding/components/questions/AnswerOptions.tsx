/**
 * A grouped list of answers, one (radio) or many (checkbox). A round mark shows one answer, a
 * rounded-square tick many. `grid` lays many short answers in two or three columns.
 */

import { Check } from "@phosphor-icons/react";
import styles from "@/app/onboarding/OnboardingPage.module.css";

export default function AnswerOptions({
  label,
  multi = false,
  grid = false,
  options,
  selected,
  onToggle,
}: {
  label: string;
  multi?: boolean;
  grid?: boolean;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div
      className={`${styles.options} ${grid ? styles.grid : ""}`}
      role={multi ? "group" : "radiogroup"}
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role={multi ? "checkbox" : "radio"}
          aria-checked={selected.includes(option.value)}
          className={styles.option}
          onClick={() => onToggle(option.value)}
        >
          <span>{option.label}</span>
          <i className={styles.mark} data-multi={multi} aria-hidden="true">
            <Check size={12} weight="bold" />
          </i>
        </button>
      ))}
    </div>
  );
}

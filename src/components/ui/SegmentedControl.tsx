import type { ReactNode } from "react";
import furnitureStyles from "./styles/PageFurniture.module.css";

/** One segmented control for the whole app: a track, a white thumb, 44px tall. */
export default function SegmentedControl<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: ReactNode }[]; onChange: (value: T) => void }) {
  return (
    <div className={furnitureStyles.seg} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

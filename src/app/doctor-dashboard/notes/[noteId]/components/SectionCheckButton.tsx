/** The round tick that marks a section as checked by the doctor (optional before signing). */

import { Check } from "@phosphor-icons/react";
import styles from "./NoteSections.module.css";

export default function SectionCheckButton({
  on,
  title,
  onClick,
}: {
  on: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.check}
      aria-pressed={on}
      aria-label={`Mark ${title} as checked`}
      onClick={onClick}
    >
      <Check size={16} weight="bold" />
    </button>
  );
}

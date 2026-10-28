import { Check } from "@phosphor-icons/react";
import styles from "./NoteBody.module.css";

/** The round tick that marks a section as checked by the doctor (optional before signing). */
export default function SectionCheckButton({ on, title, onClick }: { on: boolean; title: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.check} aria-pressed={on} aria-label={`Mark ${title} as checked`} onClick={onClick}>
      <Check size={16} weight="bold" />
    </button>
  );
}

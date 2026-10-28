/** A checkbox drawn as a small square tick: include a change, or mark a follow-up done. */

import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react";
import styles from "./NoteListSections.module.css";

export default function TickBox({
  on,
  onChange,
  label,
  showLabel = true,
}: {
  on: boolean;
  onChange: () => void;
  label: ReactNode;
  showLabel?: boolean;
}) {
  return (
    <label className={styles.tick}>
      <input type="checkbox" checked={on} onChange={onChange} />
      <span className={styles.box} aria-hidden="true">
        <Check size={13} weight="bold" />
      </span>
      <span className={showLabel ? undefined : "sr-only"}>{label}</span>
    </label>
  );
}

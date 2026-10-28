import type { ReactNode } from "react";
import styles from "./SignSheet.module.css";

/** One thing that signing writes, and where it goes. `off`: nothing is written for it. */
export default function SignSheetRow({ icon, title, where, off, children }: { icon: ReactNode; title: ReactNode; where: ReactNode; off?: boolean; children?: ReactNode }) {
  return (
    <li className={styles.sRow} data-off={off || undefined}>
      <span className={styles.sIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.sText}>
        <strong>{title}</strong>
        <span>{where}</span>
        {children}
      </span>
    </li>
  );
}

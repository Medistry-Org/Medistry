import type { ReactNode } from "react";
import styles from "./NoteBody.module.css";

/** A note section's heading row: title, a quiet status line, and its tools on the right. */
export default function SectionHead({ sectionKey, title, meta, children }: { sectionKey: string; title: string; meta: ReactNode; children?: ReactNode }) {
  return (
    <div className={styles.secHead}>
      <h2 id={`h-${sectionKey}`} className={styles.h2}>
        {title}
      </h2>
      <span className={styles.secMeta}>{meta}</span>
      {children && <div className={styles.tools}>{children}</div>}
    </div>
  );
}

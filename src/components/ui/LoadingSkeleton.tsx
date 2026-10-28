/** The waiting state for a whole page: the title and two surfaces as soft placeholders. */

import styles from "./LoadingSkeleton.module.css";

export default function LoadingSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading">
      <span className={styles.ghost} style={{ width: "48%", height: 44 }} />
      <span className={styles.ghost} style={{ height: 120 }} />
      <span className={styles.ghost} style={{ height: 180 }} />
    </div>
  );
}

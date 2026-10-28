/**
 * A surface with an optional heading row: the only container the dashboards use. `action` sits at
 * the right of the heading (a link or a small button).
 */

import type { ReactNode } from "react";
import surfaceStyles from "./styles/CardSurface.module.css";
import styles from "./Card.module.css";

export default function Card({
  title,
  action,
  children,
  id,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const headingId = id && title ? `${id}-h` : undefined;
  return (
    <section
      className={`${surfaceStyles.card} ${styles.card} ${className}`}
      id={id}
      aria-labelledby={headingId}
    >
      {(title || action) && (
        <div className={styles.cardHead}>
          {title && (
            <h2 className={styles.title} id={headingId}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

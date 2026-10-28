import type { ReactNode } from "react";
import surfaceStyles from "./styles/Surfaces.module.css";
import furnitureStyles from "./styles/PageFurniture.module.css";

/**
 * A surface with an optional heading row: the only container the dashboards use.
 * `action` sits at the right of the heading (a link or a small button).
 */
export default function Card({ title, action, children, id, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <section className={`${surfaceStyles.card} ${furnitureStyles.card} ${className}`} id={id} aria-labelledby={id && title ? `${id}-h` : undefined}>
      {(title || action) && (
        <div className={`${surfaceStyles.cardHead} ${furnitureStyles.cardHead}`}>
          {title && (
            <h2 className={`${surfaceStyles.h2} ${furnitureStyles.cardTitle}`} id={id ? `${id}-h` : undefined}>
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

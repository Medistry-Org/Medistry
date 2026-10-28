/**
 * The plate around the height or weight ruler, empty until the first touch: the number box shows a
 * quiet hint in place of a number (CSS), so nothing reads as an answer. Touching or arrowing the
 * ruler sets it from where it rests; the unit switch and the typed box do not answer by themselves.
 */

import type { CSSProperties, ReactNode } from "react";
import styles from "../OnboardingPage.module.css";

export default function MeasureInstrument({ empty, hint, onStart, children }: { empty: boolean; hint: string; onStart: () => void; children: ReactNode }) {
  const start = (target: EventTarget) => {
    if (empty && target instanceof HTMLInputElement && target.type === "range") onStart();
  };
  return (
    <div
      className={styles.instrument}
      data-empty={empty}
      style={{ "--hint": JSON.stringify(hint) } as CSSProperties}
      onPointerDownCapture={(e) => start(e.target)}
      onKeyDownCapture={(e) => {
        if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End" || e.key.startsWith("Page")) start(e.target);
      }}
    >
      {empty && <span className="sr-only">{hint}, not answered yet</span>}
      {children}
    </div>
  );
}

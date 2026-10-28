"use client";

/* A slow count to hold the pen's button for long enough (Arhaan Guides.tsx HoldTimer). Linear on purpose: it is a clock. */

import { useEffect, useState, type CSSProperties } from "react";
import stepperStyles from "./InjectionStepper.module.css";

export default function HoldTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left === 0) return;
    const timer = setTimeout(
      () =>
        setLeft((secondsLeft) =>
          secondsLeft === null ? null : secondsLeft - 1,
        ),
      1000,
    );
    return () => clearTimeout(timer);
  }, [left]);
  const running = left !== null && left > 0;
  return (
    <div className={stepperStyles.timer}>
      <span
        className={stepperStyles.timerRing}
        data-running={running}
        data-done={left === 0}
        aria-hidden="true"
        style={{ "--count": `${seconds}s` } as CSSProperties}
      >
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" />
          <circle cx="24" cy="24" r="21" pathLength={1} key={String(running)} />
        </svg>
        <b className="num">{left === null ? seconds : left}</b>
      </span>
      <p role="status" aria-live="polite">
        {left === null
          ? "Press start when the needle is in and the button is down."
          : left > 0
            ? "Keep holding the button down."
            : "Done. Lift the pen away."}
      </p>
      <button
        type="button"
        className={stepperStyles.pairBtn}
        onClick={() => setLeft(seconds)}
      >
        {left === null ? "Start count" : "Count again"}
      </button>
    </div>
  );
}

"use client";

/** A minus or plus beside the age: one step a tap, and held down it keeps counting. */

import { useEffect, useRef } from "react";
import { Minus, Plus } from "@phosphor-icons/react";
import styles from "./AgeStepperButton.module.css";

export default function AgeStepperButton({
  direction,
  label,
  disabled,
  onStep,
}: {
  direction: 1 | -1;
  label: string;
  disabled: boolean;
  onStep: (direction: 1 | -1) => void;
}) {
  const hold = useRef<{
    wait: ReturnType<typeof setTimeout> | null;
    repeat: ReturnType<typeof setInterval> | null;
  }>({ wait: null, repeat: null });
  const stop = () => {
    if (hold.current.wait) clearTimeout(hold.current.wait);
    if (hold.current.repeat) clearInterval(hold.current.repeat);
    hold.current = { wait: null, repeat: null };
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);
  return (
    <button
      type="button"
      className={styles.ageStep}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        onStep(direction);
        stop();
        hold.current.wait = setTimeout(() => {
          hold.current.repeat = setInterval(() => onStep(direction), 90);
        }, 420);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // the pointer already stepped; a keyboard press (detail 0) steps here
      onClick={(event) => {
        if (event.detail === 0) onStep(direction);
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {direction === 1 ? (
        <Plus size={20} weight="bold" />
      ) : (
        <Minus size={20} weight="bold" />
      )}
    </button>
  );
}

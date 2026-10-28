"use client";

/*
  The first injection, one step a screen (Arhaan Guides.tsx Injection): big type, one picture,
  back and next at the thumb. These are the generic steps, a read-through that logs nothing: the
  backend does not say yet which pen, if any, is prescribed.
*/

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CaretRight,
  CheckCircle,
} from "@phosphor-icons/react";
import { INJECTION_STEPS } from "../content/guideContent";
import HoldTimer from "./HoldTimer";
import InjectionStepArt from "./InjectionStepArt";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "./InjectionStepper.module.css";

const CARE_TEAM_HINT =
  "If you feel nervous or get stuck on a step, message your care team in Chat and someone can talk you through it.";

export default function InjectionStepper() {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const step = INJECTION_STEPS[index];
  const last = index === INJECTION_STEPS.length - 1;

  const go = (next: number) => {
    setIndex(next);
    // each step starts at its top, never part-scrolled from the one before
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => top.current?.focus({ preventScroll: false }));
  };

  if (done)
    return (
      <div className={styles.stepDone}>
        <CheckCircle size={40} weight="fill" className={styles.stepDoneIcon} />
        <h2 className={styles.stepTitle}>That is every step</h2>
        <p className={styles.stepLead}>
          Your doctor decides whether a weekly injection suits you. If one is
          prescribed, follow the leaflet in your box with these steps.
        </p>
        <div className={styles.stepEnd}>
          <Link
            href="/patient-dashboard/resources"
            className={`btn ${formStyles.go}`}
          >
            <span>Done</span>
            <span className="well" aria-hidden="true">
              <CheckCircle size={18} />
            </span>
          </Link>
          <Link
            href="/patient-dashboard/resources/first-weeks"
            className={formStyles.link}
          >
            What the first weeks feel like <CaretRight size={15} />
          </Link>
        </div>
      </div>
    );

  return (
    <div className={styles.stepper}>
      <div className={styles.stepProgress} aria-hidden="true">
        {INJECTION_STEPS.map((stepItem, stepIndex) => (
          <i key={stepItem.title} data-on={stepIndex <= index} />
        ))}
      </div>
      <div
        ref={top}
        tabIndex={-1}
        className={styles.stepBody}
        aria-live="polite"
      >
        <p className={styles.stepCount}>
          Step <span className="num">{index + 1}</span> of{" "}
          <span className="num">{INJECTION_STEPS.length}</span>
        </p>
        <h2 className={styles.stepTitle}>{step.title}</h2>
        {step.timer ? (
          <HoldTimer key={index} seconds={step.timer} />
        ) : (
          <InjectionStepArt kind={step.art} />
        )}
        <ol className={styles.stepLines}>
          {step.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        {step.note && <p className={styles.stepNote}>{step.note}</p>}
      </div>
      <div className={styles.stepNav}>
        <button
          type="button"
          className={styles.pairBtn}
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous step"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          className={`btn ${styles.stepNext}`}
          onClick={() => (last ? setDone(true) : go(index + 1))}
        >
          <span>{last ? "Finish" : "Next"}</span>
          <span className="well" aria-hidden="true">
            {last ? <CheckCircle size={18} /> : <ArrowRight size={18} />}
          </span>
        </button>
      </div>
      <p className={formStyles.hint}>{CARE_TEAM_HINT}</p>
    </div>
  );
}

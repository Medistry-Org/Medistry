/*
  Home's third card before the first consultation (Arhaan HomeView "Before your plan"): the three
  steps in their order, a counsellor's call, blood tests only if none in the last 90 days, then the
  doctor. The card opens how Medistry works; the blood-test step leads to booking a home test or
  uploading a recent report.
*/

import type { ReactNode } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { clockTime } from "@/lib/format/dateTime";
import type { Appointment } from "@/types/appointment";
import { consultationMinutes, dayLabel } from "./careStage";
import styles from "./Home.module.css";

type StepState = "now" | "next";

export default function FirstStepsCard({ upcoming }: { upcoming: Appointment | null }) {
  const consultation = upcoming ? `${dayLabel(upcoming.startsAt)}, ${clockTime(new Date(upcoming.startsAt))}, ${consultationMinutes(upcoming)} min by video` : "30 min by video with a doctor";
  const steps: { label: string; short: string; state: StepState; detail?: ReactNode; href?: string }[] = [
    { label: "A call from a counsellor", short: "Counsellor call", state: "now" },
    {
      label: "Blood tests, if none in 90 days",
      short: "Blood tests",
      state: "next",
      href: "/dashboard/lab-tests",
      detail: (
        <Link href="/dashboard/reports" className={styles.stepLink}>
          Or upload a recent report
        </Link>
      ),
    },
    { label: "Your first consultation", short: "Doctor", state: "next", detail: consultation },
  ];

  return (
    <section className={`${styles.card} ${styles.dose} ${styles.quiet} ${styles.first}`} aria-labelledby="stage-heading">
      <div className={styles.head}>
        <h2 id="stage-heading" className={styles.label}>
          <Link href="/dashboard/resources/how-medistry-works" className={styles.stretch}>
            Before your plan
          </Link>
        </h2>
        <span className={styles.go} aria-hidden="true">
          How it works
          <CaretRight size={14} />
        </span>
      </div>
      <p className={styles.doseTitle}>After your consultation, your doctor suggests a plan</p>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.short} data-state={step.state}>
            <i aria-hidden="true" />
            <span>
              {step.href ? (
                <Link href={step.href} className={styles.stepLink}>
                  {step.label}
                </Link>
              ) : (
                step.label
              )}
              {step.detail && <span className={styles.stepDetail}>{step.detail}</span>}
              <span className="sr-only">{step.state === "now" ? ", next" : ""}</span>
            </span>
          </li>
        ))}
      </ol>
      {/* a short phone: the same three, as one line */}
      <p className={styles.stepsLine}>
        {steps.map((step, i) => (
          <span key={step.short} data-state={step.state}>
            {i > 0 && <span className={styles.sep}> · </span>}
            {step.short}
          </span>
        ))}
      </p>
      <p className={styles.quietLine}>Medicine only if your doctor judges it right for you.</p>
    </section>
  );
}

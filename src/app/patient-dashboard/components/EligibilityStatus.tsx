/*
  Where a new patient stands before the first consultation: the headline, one calm line, the steps
  of their path (StatusTracker) and the one thing to do next. The page puts it in its own card
  (Home's status card, or the Book page when booking is not open yet). Words: eligibilityStage.ts.
*/

import Link from "next/link";
import { ArrowRight, CaretRight } from "@phosphor-icons/react";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import type { EligibilityStatusView } from "./eligibilityStage";
import StatusTracker from "./StatusTracker";
import styles from "./EligibilityStatus.module.css";

export default function EligibilityStatus({
  status,
}: {
  status: EligibilityStatusView;
}) {
  const { action } = status;
  return (
    <div className={styles.status}>
      <div className={styles.words}>
        <p className={styles.title}>{status.title}</p>
        <p className={styles.text}>{status.text}</p>
      </div>
      <StatusTracker steps={status.steps} currentIndex={status.currentIndex} />
      {action &&
        (action.filled ? (
          <Link href={action.href} className={`btn ${formStyles.go}`}>
            <span>{action.label}</span>
            <span className="well" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </Link>
        ) : (
          <Link
            href={action.href}
            className={`${formStyles.link} ${styles.link}`}
          >
            {action.label} <CaretRight size={15} aria-hidden="true" />
          </Link>
        ))}
    </div>
  );
}

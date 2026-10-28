/** The top bar: the wordmark and Back, the progress ruler by chapter, and Save and exit (or Book later). */

import Link from "next/link";
import { ArrowLeft, X } from "@phosphor-icons/react";
import { Wordmark } from "@/components/ui/Brand";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import { CHAPTERS, TOTAL_STEPS } from "../onboardingOptions";
import type { Phase } from "../useOnboardingProgress";
import styles from "../OnboardingPage.module.css";

type Props = { phase: Phase; step: number; chapterName: string; onBack: () => void; onSaveAndExit: () => void };

export default function OnboardingTopBar({ phase, step, chapterName, onBack, onSaveAndExit }: Props) {
  const profileDone = phase !== "steps";
  return (
    <header className={styles.bar}>
      <div className={styles.barStart}>
        <Link href="/" className={styles.brand} aria-label="Medistry home">
          <Wordmark height={24} />
        </Link>
        {phase === "steps" && (
          <button type="button" className={formStyles.round} onClick={onBack} disabled={step === 1} aria-label="Previous question">
            <ArrowLeft size={18} />
          </button>
        )}
      </div>
      <div
        hidden={phase === "booked"}
        className={styles.progress}
        role="progressbar"
        aria-label="Profile"
        aria-valuemin={0}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={profileDone ? TOTAL_STEPS : step - 1}
        aria-valuetext={profileDone ? "Profile complete" : `Question ${step} of ${TOTAL_STEPS}, ${chapterName}`}
      >
        {CHAPTERS.map((chapter) => (
          <span key={chapter.name} className={styles.chap} style={{ flexGrow: chapter.steps.length }}>
            {chapter.steps.map((n) => (
              <i key={n} data-state={profileDone || n < step ? "done" : n === step ? "now" : undefined} />
            ))}
          </span>
        ))}
      </div>
      <div className={styles.barEnd}>
        {phase === "steps" && (
          <>
            <button type="button" className={`${formStyles.link} ${styles.exitText}`} onClick={onSaveAndExit}>
              Save and exit
            </button>
            <button type="button" className={`${formStyles.round} ${styles.exitIcon}`} onClick={onSaveAndExit} aria-label="Save and exit">
              <X size={18} />
            </button>
          </>
        )}
        {phase === "book" && (
          <Link href="/dashboard" className={`${formStyles.link} ${styles.bookLater}`}>
            Book later
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

/**
 * The onboarding screens in order: eight questions, then booking the first consultation, then the
 * booked confirmation. State and saving live in useOnboardingProgress; this file picks what shows.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DrawnArt from "@/components/ui/DrawnArt";
import type { OnboardingStatus } from "@/types/onboarding";
import { CHAPTERS } from "../onboardingOptions";
import { useOnboardingProgress } from "../useOnboardingProgress";
import AgeStep from "./AgeStep";
import BookConsultationStep from "./BookConsultationStep";
import BookedConfirmation from "./BookedConfirmation";
import ConditionsStep from "./ConditionsStep";
import ConsentStep from "./ConsentStep";
import ExperienceStep from "./ExperienceStep";
import GenderStep from "./GenderStep";
import HeightStep from "./HeightStep";
import NameStep from "./NameStep";
import OnboardingTopBar from "./OnboardingTopBar";
import QuestionForm from "./QuestionForm";
import WeightStep from "./WeightStep";
import styles from "../OnboardingPage.module.css";

/** Typing questions put the cursor in the first box; the others move focus to the question. */
const TYPING_STEPS = [1, 3];

export default function OnboardingScreens({ status }: { status: OnboardingStatus | null }) {
  const router = useRouter();
  const progress = useOnboardingProgress(status);
  const { phase, step, draft, problem, update } = progress;
  const [bookedAt, setBookedAt] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // every question and every phase starts at the top, with its heading in view
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [step, phase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const firstInput = phase === "steps" && TYPING_STEPS.includes(step) ? formRef.current?.querySelector("input") : null;
      (firstInput ?? headingRef.current)?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [step, phase]);

  const chapterName = (CHAPTERS.find((c) => c.steps.includes(step)) ?? CHAPTERS[0]).name;

  const answers = {
    1: <NameStep draft={draft} problem={problem} update={update} />,
    2: <GenderStep draft={draft} update={update} pickThenGo={progress.pickThenGo} />,
    3: <AgeStep draft={draft} problem={problem} update={update} />,
    4: <HeightStep draft={draft} update={update} />,
    5: <WeightStep draft={draft} update={update} />,
    6: <ExperienceStep selected={draft.experience} onToggle={progress.toggleExperience} />,
    7: <ConditionsStep draft={draft} problem={problem} update={update} />,
    8: <ConsentStep draft={draft} update={update} />,
  }[step];

  return (
    <main className={styles.page} data-phase={phase} data-step={phase === "steps" ? step : undefined}>
      <DrawnArt kind="arcs" className={styles.art} />
      <OnboardingTopBar phase={phase} step={step} chapterName={chapterName} onBack={progress.back} onSaveAndExit={progress.saveAndExit} />

      {phase === "steps" && (
        <QuestionForm
          step={step}
          chapterName={chapterName}
          direction={progress.direction}
          busy={progress.busy}
          canContinue={progress.canContinue}
          problem={problem}
          welcomeBack={progress.welcomeBack}
          formRef={formRef}
          headingRef={headingRef}
          onSubmit={() => progress.submit()}
        >
          {answers}
        </QuestionForm>
      )}

      {phase === "book" && (
        <BookConsultationStep
          headingRef={headingRef}
          onBooked={(startsAt) => {
            setBookedAt(startsAt);
            progress.setPhase("booked");
          }}
          onBookedElsewhere={() => router.push("/dashboard")}
        />
      )}

      {phase === "booked" && bookedAt && <BookedConfirmation startsAt={bookedAt} headingRef={headingRef} />}
    </main>
  );
}

"use client";

/**
 * The onboarding state machine: the patient's answers, which question is showing, and moving
 * forward (save the step, then the next one), back and out. After the last question it completes
 * onboarding and hands over to booking the first consultation.
 *
 * Every answer is saved as soon as Continue is pressed, so "Save and exit" only has to leave.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/lib/http/apiClient";
import { updateSessionUser } from "@/lib/session/authSession";
import { completeOnboarding, saveStep } from "@/services/onboardingService";
import type { ConsentType, Gender, OnboardingAnswers, OnboardingStatus, OnboardingStepAnswer } from "@/types/onboarding";
import { AGE_MAX, AGE_MIN, CONSENT_VERSION, conditionsFor, FIRST_TIME, REQUIRED_CONSENTS, TOTAL_STEPS } from "./onboardingOptions";

export type Phase = "steps" | "book" | "booked";

/** A problem to show: under the box named by `field`, or under the answers when there is none. */
export type Problem = { message: string; field?: "firstName" | "email" | "ageYears" | "otherText" };

/** The answers as the screens edit them (age is typed text until it is saved). */
export type OnboardingDraft = {
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender | null;
  age: string;
  heightCm: number | null;
  weightKg: number | null;
  experience: string[];
  conditionCodes: string[];
  noConditions: boolean;
  otherText: string;
  consents: ConsentType[];
};

export type DraftChanges = Partial<OnboardingDraft> | ((current: OnboardingDraft) => Partial<OnboardingDraft>);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function draftFrom(answers: OnboardingAnswers | undefined): OnboardingDraft {
  return {
    firstName: answers?.firstName ?? "",
    lastName: answers?.lastName ?? "",
    email: answers?.email ?? "",
    gender: answers?.gender ?? null,
    age: answers?.ageYears ? String(answers.ageYears) : "",
    // nothing until the patient answers: a guessed number here would become their baseline
    heightCm: answers?.heightCm ?? null,
    weightKg: answers?.weightKg ?? null,
    experience: answers?.weightLossExperience ?? [],
    conditionCodes: answers?.conditions?.map((c) => c.code) ?? [],
    noConditions: answers?.noConditions ?? false,
    otherText: answers?.conditions?.find((c) => c.code === "OTHER")?.otherText ?? "",
    consents: answers?.consents ?? [],
  };
}

/** The ticked conditions that are on screen (PCOS is hidden for men). */
export const visibleConditionCodes = (draft: OnboardingDraft) => draft.conditionCodes.filter((code) => conditionsFor(draft.gender).some((c) => c.code === code));

/** The step's answer, ready to save, or what is wrong with it. */
function answerFor(step: number, draft: OnboardingDraft): OnboardingStepAnswer | Problem {
  switch (step) {
    case 1:
      if (!draft.firstName.trim()) return { message: "Add your first name.", field: "firstName" };
      if (!draft.email.trim()) return { message: "Add your email.", field: "email" };
      if (!EMAIL_PATTERN.test(draft.email.trim())) return { message: "That email does not look right.", field: "email" };
      return { step: 1, firstName: draft.firstName, lastName: draft.lastName, email: draft.email };
    case 2:
      return draft.gender ? { step: 2, gender: draft.gender } : { message: "Choose one." };
    case 3: {
      const age = Number(draft.age);
      if (!draft.age || !Number.isInteger(age)) return { message: "Enter your age in years.", field: "ageYears" };
      if (age < AGE_MIN) return { message: "Medistry is for adults aged 18 and over.", field: "ageYears" };
      if (age > AGE_MAX) return { message: `Enter an age from ${AGE_MIN} to ${AGE_MAX}.`, field: "ageYears" };
      return { step: 3, ageYears: age };
    }
    case 4:
      return draft.heightCm !== null ? { step: 4, heightCm: draft.heightCm } : { message: "Add your height, in feet or centimetres." };
    case 5:
      return draft.weightKg !== null ? { step: 5, weightKg: draft.weightKg } : { message: "Add your weight." };
    case 6:
      return draft.experience.length ? { step: 6, weightLossExperience: draft.experience } : { message: "Choose at least one." };
    case 7: {
      const codes = visibleConditionCodes(draft);
      if (draft.noConditions) return { step: 7, noConditions: true, conditions: [] };
      if (!codes.length) return { message: "Choose at least one, or None of these." };
      if (codes.includes("OTHER") && !draft.otherText.trim()) return { message: "Say what it is.", field: "otherText" };
      return { step: 7, noConditions: false, conditions: codes.map((code) => (code === "OTHER" ? { code, otherText: draft.otherText.trim() } : { code })) };
    }
    default:
      if (!REQUIRED_CONSENTS.every((c) => draft.consents.includes(c))) return { message: "Tick the box to agree, so your doctor can see your details." };
      return { step: 8, consents: draft.consents };
  }
}

function answersFrom(draft: OnboardingDraft): OnboardingAnswers {
  return {
    firstName: draft.firstName,
    lastName: draft.lastName,
    email: draft.email,
    gender: draft.gender,
    ageYears: draft.age ? Number(draft.age) : null,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    weightLossExperience: draft.experience,
    conditions: draft.noConditions ? [] : visibleConditionCodes(draft).map((code) => (code === "OTHER" ? { code, otherText: draft.otherText.trim() } : { code })),
    noConditions: draft.noConditions,
    consents: draft.consents,
  };
}

const isProblem = (value: OnboardingStepAnswer | Problem): value is Problem => "message" in value;

/** `status` is null when the backend cannot resume yet: the patient starts at question 1. */
export function useOnboardingProgress(status: OnboardingStatus | null) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("steps");
  const [step, setStep] = useState(status?.currentStep ?? 1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [welcomeBack, setWelcomeBack] = useState((status?.lastCompletedStep ?? 0) > 0);
  const [draft, setDraft] = useState(() => draftFrom(status?.answers));
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // bumped by Back and Save and exit, so a save still in flight cannot move the patient forward afterwards
  const navigation = useRef(0);

  // on a return visit the status line says so, then settles back
  useEffect(() => {
    if (!welcomeBack) return;
    const timer = setTimeout(() => setWelcomeBack(false), 4200);
    return () => clearTimeout(timer);
  }, [welcomeBack]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  /** Changes some answers. Pass a function when the change depends on the latest answers (a held stepper). */
  const update = (changes: DraftChanges) => {
    setDraft((current) => ({ ...current, ...(typeof changes === "function" ? changes(current) : changes) }));
    setProblem(null);
  };

  const submit = async (override?: OnboardingStepAnswer) => {
    if (busy) return;
    const answer = override ?? answerFor(step, draft);
    if (isProblem(answer)) {
      setProblem(answer);
      return;
    }
    setBusy(true);
    setProblem(null);
    const ticket = navigation.current;
    try {
      await saveStep(answer, CONSENT_VERSION);
      if (ticket !== navigation.current) return;
      if (answer.step === TOTAL_STEPS) {
        await completeOnboarding(answersFrom(draft));
        updateSessionUser({ fullName: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim() });
        setPhase("book");
      } else {
        setStep(answer.step + 1);
      }
      setDirection(1);
    } catch (error) {
      if (ticket === navigation.current) setProblem({ message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  /** Single answers: show the tick, then move on a beat later. */
  const pickThenGo = (answer: OnboardingStepAnswer) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => submit(answer), 260);
  };

  const back = () => {
    navigation.current++;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setProblem(null);
    setDirection(-1);
    setStep((current) => Math.max(1, current - 1));
  };

  const saveAndExit = () => {
    navigation.current++;
    router.push("/dashboard");
  };

  const firstExperienceToggle = (code: string) =>
    // a first attempt and past attempts cannot both be true, so each clears the other
    draft.experience.includes(code) ? draft.experience.filter((x) => x !== code) : code === FIRST_TIME ? [FIRST_TIME] : [...draft.experience.filter((x) => x !== FIRST_TIME), code];

  const answer = answerFor(step, draft);
  return {
    phase,
    setPhase,
    step,
    direction,
    busy,
    problem,
    welcomeBack,
    draft,
    update,
    toggleExperience: (code: string) => update({ experience: firstExperienceToggle(code) }),
    /** Continue looks unavailable until this is true, but a tap still says what is missing. */
    canContinue: !isProblem(answer),
    submit,
    pickThenGo,
    back,
    saveAndExit,
  };
}

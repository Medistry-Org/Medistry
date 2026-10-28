/**
 * Onboarding: the patient's first health profile, asked one question at a time (8 steps), then the
 * first consultation is booked. See docs/backend/onboarding.md for the JSON the backend receives.
 */

/** The backend's gender values (PATCH /api/onboarding/step already accepts these). */
export type Gender = "Male" | "Female" | "Other";

/** A consent the patient can give. All but AI are needed before a doctor sees their details. */
export type ConsentType = "TERMS" | "PRIVACY" | "HEALTH_DATA" | "TELECONSULT" | "AI";

/** A condition the patient ticked; OTHER carries their own words. */
export type ConditionAnswer = { code: string; otherText?: string };

/** Everything the patient has answered so far. null / empty = not answered yet. */
export type OnboardingAnswers = {
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender | null;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  /** codes from EXPERIENCES; FIRST_TIME is never combined with another */
  weightLossExperience: string[];
  /** null = step not answered; [] with noConditions = "None of these" */
  conditions: ConditionAnswer[] | null;
  noConditions: boolean;
  consents: ConsentType[];
};

/** GET /api/onboarding/status: where a returning patient picks up. */
export type OnboardingStatus = {
  /** the question to show, 1 to 8 */
  currentStep: number;
  /** 0 when nothing has been saved yet */
  lastCompletedStep: number;
  completed: boolean;
  answers: OnboardingAnswers;
};

/** One step's answers, as the page hands them to onboardingService.saveStep(). */
export type OnboardingStepAnswer =
  | { step: 1; firstName: string; lastName: string; email: string }
  | { step: 2; gender: Gender }
  | { step: 3; ageYears: number }
  | { step: 4; heightCm: number }
  | { step: 5; weightKg: number }
  | { step: 6; weightLossExperience: string[] }
  | { step: 7; noConditions: boolean; conditions: ConditionAnswer[] }
  | { step: 8; consents: ConsentType[] };

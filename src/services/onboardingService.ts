/**
 * Onboarding: saves each answer as soon as it is given, then completes the profile.
 * Doc: docs/backend/onboarding.md
 *   GET   /api/onboarding/config     PROPOSED. Answer lists and consent wording (bundled copy on 404)
 *   GET   /api/onboarding/status     PROPOSED. Where a returning patient left off
 *   PATCH /api/onboarding/step       one question's answers (exists; fields beyond the original ones are PROPOSED)
 *   POST  /api/onboarding/complete   the whole profile, flat (exists; ageYears in place of dateOfBirth is PROPOSED)
 * The blood test step after complete uses carePackageService, reportService and labTestService.
 */

import { ApiError, apiRequest } from "@/lib/http/apiClient";
import { getSessionUser } from "@/lib/session/authSession";
import type {
  ConditionAnswer,
  ConsentType,
  Gender,
  OnboardingAnswers,
  OnboardingConfig,
  OnboardingStatus,
  OnboardingStepAnswer,
} from "@/types/onboarding";

type RawAnswers = Partial<{
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  gender: string;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  weightLossExperience: string[];
  conditions: ConditionAnswer[] | null;
  noConditions: boolean;
  consents: { type: ConsentType; accepted?: boolean }[];
}>;

type RawStatus = {
  currentStep?: number;
  lastCompletedStep?: number;
  completed?: boolean;
  answers?: RawAnswers;
};

const roundToTenth = (value: number) => Math.round(value * 10) / 10;
const fullNameOf = (first: string, last: string) =>
  `${first.trim()} ${last.trim()}`.trim();
const signedInMobile = () => getSessionUser()?.mobile ?? "";

function toGender(raw?: string): Gender | null {
  const value = String(raw ?? "").toLowerCase();
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  if (value === "other") return "Other";
  return null;
}

function toAnswers(raw: RawAnswers = {}): OnboardingAnswers {
  // an older profile may hold only fullName: its first word is the first name
  const [firstFromFull = "", ...restOfFull] = (raw.fullName ?? "")
    .trim()
    .split(/\s+/);
  return {
    firstName: raw.firstName ?? firstFromFull,
    lastName: raw.lastName ?? restOfFull.join(" "),
    email: raw.email ?? "",
    gender: toGender(raw.gender),
    ageYears: raw.ageYears ?? null,
    heightCm: raw.heightCm ?? null,
    weightKg: raw.weightKg ?? null,
    weightLossExperience: raw.weightLossExperience ?? [],
    conditions: raw.conditions ?? null,
    noConditions: Boolean(raw.noConditions),
    consents: (raw.consents ?? [])
      .filter((consent) => consent.accepted !== false)
      .map((consent) => consent.type),
  };
}

/** The answer lists and consent wording. null when the backend does not serve them yet (404). */
export async function getOnboardingConfig(): Promise<OnboardingConfig | null> {
  try {
    const body = await apiRequest<{ data: OnboardingConfig }>(
      "/api/onboarding/config",
    );
    return body.data;
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

/** Where a returning patient left off. null when the backend cannot say yet (404): start at step 1. */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const body = await apiRequest<{ data?: RawStatus }>(
      "/api/onboarding/status",
    );
    const raw = body.data ?? {};
    return {
      currentStep: Math.min(8, Math.max(1, raw.currentStep ?? 1)),
      lastCompletedStep: raw.lastCompletedStep ?? 0,
      completed: Boolean(raw.completed),
      answers: toAnswers(raw.answers),
    };
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

/** The request body for one step: the step number, the mobile, and that step's fields. */
function stepBody(answer: OnboardingStepAnswer, consentVersion: string) {
  const base = { step: answer.step, mobile: signedInMobile() };
  switch (answer.step) {
    case 1:
      return {
        ...base,
        fullName: fullNameOf(answer.firstName, answer.lastName),
        firstName: answer.firstName.trim(),
        lastName: answer.lastName.trim(),
        email: answer.email.trim().toLowerCase(),
      };
    case 2:
      return { ...base, gender: answer.gender };
    case 3:
      return { ...base, ageYears: answer.ageYears };
    case 4:
      return { ...base, heightCm: roundToTenth(answer.heightCm) };
    case 5:
      return { ...base, weightKg: roundToTenth(answer.weightKg) };
    case 6:
      return { ...base, weightLossExperience: answer.weightLossExperience };
    case 7:
      return {
        ...base,
        noConditions: answer.noConditions,
        conditions: answer.noConditions ? [] : answer.conditions,
      };
    case 8:
      return {
        ...base,
        consents: answer.consents.map((type) => ({
          type,
          version: consentVersion,
          accepted: true,
        })),
      };
  }
}

/** Saves one step. `consentVersion` is the version of the consent wording the patient read (step 8). */
export async function saveOnboardingStep(
  answer: OnboardingStepAnswer,
  consentVersion: string,
): Promise<void> {
  await apiRequest("/api/onboarding/step", {
    method: "PATCH",
    body: stepBody(answer, consentVersion),
  });
}

/**
 * Completes onboarding with the whole profile, flat, as the backend's complete endpoint reads it.
 * Called after question 8 and before the blood test step, so the report review and the lab booking
 * find a finished profile.
 */
export async function completeOnboarding(
  answers: OnboardingAnswers,
): Promise<void> {
  await apiRequest("/api/onboarding/complete", {
    method: "POST",
    body: {
      mobile: signedInMobile(),
      fullName: fullNameOf(answers.firstName, answers.lastName),
      email: answers.email.trim().toLowerCase(),
      gender: answers.gender,
      ageYears: answers.ageYears,
      heightCm:
        answers.heightCm === null ? null : roundToTenth(answers.heightCm),
      weightKg:
        answers.weightKg === null ? null : roundToTenth(answers.weightKg),
    },
  });
}

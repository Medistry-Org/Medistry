/**
 * Onboarding: saves each answer as soon as it is given, then completes the profile.
 *   PATCH /api/onboarding/step                 one step's answers (exists; extra fields are proposed)
 *   POST  /api/onboarding/complete             the whole profile, flat (exists)
 *   GET   /api/onboarding/status               resume where the patient left off (proposed)
 *   POST  /api/onboarding/booked-elsewhere     "I booked by phone with Medistry" (proposed)
 * Field names the backend already accepts (mobile, fullName, email, gender, heightCm, weightKg) are
 * kept; everything else is named in docs/backend/onboarding.md.
 */

import { ApiError, apiRequest } from "@/lib/http/apiClient";
import { getSessionUser } from "@/lib/session/authSession";
import type { ConditionAnswer, ConsentType, Gender, OnboardingAnswers, OnboardingStatus, OnboardingStepAnswer } from "@/types/onboarding";

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

type RawStatus = { currentStep?: number; lastCompletedStep?: number; completed?: boolean; answers?: RawAnswers };

const roundToTenth = (n: number) => Math.round(n * 10) / 10;
const fullNameOf = (first: string, last: string) => `${first.trim()} ${last.trim()}`.trim();
const mobile = () => getSessionUser()?.mobile ?? "";

function toGender(raw?: string): Gender | null {
  const value = String(raw ?? "").toLowerCase();
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  if (value === "other") return "Other";
  return null;
}

function toAnswers(raw: RawAnswers = {}): OnboardingAnswers {
  // an older profile may hold only fullName: its first word is the first name
  const [firstFromFull = "", ...restOfFull] = (raw.fullName ?? "").trim().split(/\s+/);
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
    consents: (raw.consents ?? []).filter((c) => c.accepted !== false).map((c) => c.type),
  };
}

/** Where a returning patient left off. null when the backend cannot say yet (404): start at step 1. */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const body = await apiRequest<{ data?: RawStatus }>("/api/onboarding/status");
    const raw = body.data ?? {};
    return {
      currentStep: Math.min(8, Math.max(1, raw.currentStep ?? 1)),
      lastCompletedStep: raw.lastCompletedStep ?? 0,
      completed: Boolean(raw.completed),
      answers: toAnswers(raw.answers),
    };
  } catch (error) {
    if (error instanceof ApiError && error.isMissingEndpoint) return null;
    throw error;
  }
}

/** The request body for one step: the step number, the mobile, and that step's fields. */
function stepBody(answer: OnboardingStepAnswer, consentVersion: string) {
  const base = { step: answer.step, mobile: mobile() };
  switch (answer.step) {
    case 1:
      return { ...base, fullName: fullNameOf(answer.firstName, answer.lastName), firstName: answer.firstName.trim(), lastName: answer.lastName.trim(), email: answer.email.trim().toLowerCase() };
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
      return { ...base, noConditions: answer.noConditions, conditions: answer.noConditions ? [] : answer.conditions };
    case 8:
      return { ...base, consents: answer.consents.map((type) => ({ type, version: consentVersion, accepted: true })) };
  }
}

/** Saves one step. `consentVersion` is the version of the consent wording the patient read (step 8). */
export async function saveStep(answer: OnboardingStepAnswer, consentVersion: string): Promise<void> {
  await apiRequest("/api/onboarding/step", { method: "PATCH", body: stepBody(answer, consentVersion) });
}

/** Completes onboarding with the whole profile, flat, as the backend's complete endpoint reads it. */
export async function completeOnboarding(answers: OnboardingAnswers): Promise<void> {
  await apiRequest("/api/onboarding/complete", {
    method: "POST",
    body: {
      mobile: mobile(),
      fullName: fullNameOf(answers.firstName, answers.lastName),
      email: answers.email.trim().toLowerCase(),
      gender: answers.gender,
      ageYears: answers.ageYears,
      heightCm: answers.heightCm === null ? null : roundToTenth(answers.heightCm),
      weightKg: answers.weightKg === null ? null : roundToTenth(answers.weightKg),
    },
  });
}

/** The patient booked their first consultation by phone, so the account stops asking them to book. */
export async function markBookedElsewhere(): Promise<void> {
  try {
    await apiRequest("/api/onboarding/booked-elsewhere", { method: "POST" });
  } catch (error) {
    // ponytail: until the backend has this, the patient just goes on to their account
    if (!(error instanceof ApiError && error.isMissingEndpoint)) throw error;
  }
}

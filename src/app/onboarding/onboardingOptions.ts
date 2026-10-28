/**
 * The onboarding questions and their answer lists (from the design repository's account/config.ts).
 * Codes are what the backend stores; labels are what a patient reads. If the backend later serves
 * these lists (see docs/backend/onboarding.md), this file becomes the fallback.
 */

import type { ConsentType, Gender } from "@/types/onboarding";

export const TOTAL_STEPS = 8;

/** Bump when the consent wording below changes, so the backend knows which text was agreed to. */
export const CONSENT_VERSION = "2026-09";

/** The question and its one-line reason, per step. */
export const STEP_QUESTIONS: Record<number, { question: string; why: string }> = {
  1: { question: "What should we call you?", why: "Your doctor uses your name on the call. Reports go to your email." },
  2: { question: "Which describes you?", why: "Waist limits differ for men and women, so your doctor reads your numbers against the right one." },
  3: { question: "How old are you?", why: "Medistry is for adults 18 and over. Age also guides which blood tests your doctor asks for." },
  4: { question: "How tall are you?", why: "In feet or centimetres, whichever you know." },
  5: { question: "What do you weigh?", why: "A recent reading is fine. You can log a fresh one later." },
  6: { question: "Have you tried to lose weight before?", why: "Choose all that apply. It tells your doctor where to start." },
  7: { question: "Do you have any of these?", why: "Choose all that apply. Only your care team can see this." },
  8: { question: "Before your doctor sees your details", why: "One tick covers what your care needs." },
};

/** Onboarding in short chapters, so the progress reads as sections of a form rather than a long count. */
export const CHAPTERS = [
  { name: "About you", steps: [1, 2, 3] },
  { name: "Measurements", steps: [4, 5] },
  { name: "Health", steps: [6, 7] },
  { name: "Consent", steps: [8] },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "Female", label: "Woman" },
  { value: "Male", label: "Man" },
  { value: "Other", label: "Other" },
];

export const AGE_MIN = 18;
export const AGE_MAX = 90;

/** Where the height and weight rulers rest until the first touch; never saved unless the patient moves them. */
export const HEIGHT_FROM_CM = 165;
export const WEIGHT_FROM_KG = 78;

export const FIRST_TIME = "FIRST_TIME";

export const EXPERIENCES = [
  { code: FIRST_TIME, label: "This is my first real attempt" },
  { code: "SELF_DIET", label: "Diet and exercise on my own" },
  { code: "PROGRAMME", label: "A dietitian, gym programme or app" },
  { code: "DOCTOR_MEDS", label: "Medicine prescribed by a doctor" },
  { code: "SURGERY", label: "Weight-loss surgery" },
];

/** In pairs that share one phone row without breaking a label: a long name beside a short one. */
export const CONDITIONS = [
  { code: "T2D", label: "Type 2 diabetes" },
  { code: "PREDIABETES", label: "Prediabetes" },
  { code: "BP", label: "High blood pressure" },
  { code: "PCOS", label: "PCOS" },
  { code: "THYROID", label: "Thyroid condition" },
  { code: "FATTY_LIVER", label: "Fatty liver" },
  { code: "LIPIDS", label: "High cholesterol" },
  { code: "SLEEP_APNOEA", label: "Sleep apnoea" },
  { code: "HEART", label: "Heart disease" },
  { code: "KIDNEY", label: "Kidney disease" },
  { code: "OTHER", label: "Something else" },
];

/** PCOS is asked only of people who did not answer Man. */
export const conditionsFor = (gender: Gender | null) => CONDITIONS.filter((c) => !(gender === "Male" && c.code === "PCOS"));

export const CONSENTS: { type: ConsentType; title: string; line: string; more: string; required: boolean }[] = [
  {
    type: "TERMS",
    title: "Terms of service",
    line: "How Medistry works, what it costs and how to cancel.",
    more: "You are 18 or over and the details you give are yours and true. Plans are paid only after your doctor's review, with an itemised price before you pay.",
    required: true,
  },
  {
    type: "PRIVACY",
    title: "Privacy notice",
    line: "What we collect, why, and how to delete it.",
    more: "The full notice lists what we collect, why and who can see it. You can ask for a copy, a correction or deletion at any time, and complain to the Data Protection Board of India.",
    required: true,
  },
  {
    type: "HEALTH_DATA",
    title: "Use of my health details",
    line: "Your doctor and care team read your answers and readings.",
    more: "Only the people treating you can see your health details. Every time a doctor opens your record, it is logged.",
    required: true,
  },
  {
    type: "TELECONSULT",
    title: "Consultation by video",
    line: "Under India's Telemedicine Practice Guidelines 2020.",
    more: "Your doctor may decide a video consultation is not enough and ask you to see someone in person. Medistry is not for emergencies: call 112.",
    required: true,
  },
  {
    // a separate, optional choice (DPDP Act 2023): recording a call is not the same as having an AI process it
    type: "AI",
    title: "Call transcription",
    line: "An AI scribe drafts your doctor's notes from your video calls.",
    more: "If you agree, your video calls are transcribed so an AI scribe can draft the notes. Your doctor reads, corrects and signs every note, and nothing reaches your record without them. If you say no, nothing about your care changes: your doctor writes the notes themselves.",
    required: false,
  },
];

export const REQUIRED_CONSENTS: ConsentType[] = CONSENTS.filter((c) => c.required).map((c) => c.type);

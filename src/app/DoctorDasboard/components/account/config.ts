/*
  The answers the backend controls (GET /api/v1/onboarding/config). In production these come from
  weight_loss_experience_master and medical_conditions_master, so wording and order can change
  without an app release. Codes are stable; labels are what a patient reads.
*/

export const EXPERIENCES = [
  { code: "FIRST_TIME", label: "This is my first real attempt" },
  { code: "SELF_DIET", label: "Diet and exercise on my own" },
  { code: "PROGRAMME", label: "A dietitian, gym programme or app" },
  { code: "DOCTOR_MEDS", label: "Medicine prescribed by a doctor" },
  { code: "SURGERY", label: "Weight-loss surgery" },
] as const;

export const CONDITIONS = [
  { code: "T2D", label: "Type 2 diabetes" },
  { code: "PREDIABETES", label: "Prediabetes" },
  { code: "BP", label: "High blood pressure" },
  { code: "LIPIDS", label: "High cholesterol" },
  { code: "THYROID", label: "Thyroid condition" },
  { code: "PCOS", label: "PCOS" },
  { code: "FATTY_LIVER", label: "Fatty liver" },
  { code: "SLEEP_APNOEA", label: "Sleep apnoea" },
  { code: "HEART", label: "Heart disease" },
  { code: "KIDNEY", label: "Kidney disease" },
  { code: "OTHER", label: "Something else" },
] as const;

export type ConsentType = "TERMS" | "PRIVACY" | "HEALTH_DATA" | "TELECONSULT" | "AI";

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

/** Onboarding, in three short chapters, so the progress reads as sections of a form rather than a long count. */
export const CHAPTERS = [
  { name: "About you", steps: [1, 2, 3] },
  { name: "Measurements", steps: [4, 5] },
  { name: "Health", steps: [6, 7] },
  { name: "Consent", steps: [8] },
];

/** Shows the account screens on local builds and Vercel previews; production needs the flag. */
export const ACCOUNT_PREVIEW =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ACCOUNT_PREVIEW === "true" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

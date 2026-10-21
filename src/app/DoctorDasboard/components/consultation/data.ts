export type ScenarioKey = "weight" | "diabetes" | "first";
export type ShareKey = "weight" | "lab" | "plan";

export type Reading = { date: string; value: number };

export type Scenario = {
  key: ScenarioKey;
  label: string;
  appointment: string;
  visitType: string;
  patient: string;
  age: number;
  sex: string;
  programme: string;
  focus: string;
  patientConcern: string;
  height: string;
  weight: string | null;
  weightDate: string | null;
  weights: Reading[];
  treatment: { name: string; instructions: string; date: string; source: string } | null;
  outsideMedicine: string;
  otherCare: string[];
  dietPlan: { title: string; date: string; source: string; note: string } | null;
  scribeDraft: string;
  allergy: string;
  allergyConfirmed: boolean;
  lab: { name: string; result: string; date: string; source: string; reportId: string } | null;
  lastReview: string | null;
  discussion: string[];
  plan: string[];
};

export const DOCTOR = {
  name: "Dr. Arvind Menon",
  title: "Endocrinologist",
  qualification: "MBBS, MD (Medicine), DM (Endocrinology)",
  experience: "18 years of clinical practice",
  registration: "Demo profile · registration details withheld",
  image: "/img/consult-doctor-demo.png",
};

export const PATIENT_IMAGE = "/img/consult-patient-demo.png";

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  weight: {
    key: "weight",
    label: "Weight follow-up",
    appointment: "Follow-up · 30 min",
    visitType: "Fortnightly review",
    patient: "Aanya Kapoor",
    age: 34,
    sex: "Female",
    programme: "Weight and metabolic care · week 3",
    focus: "Weight and treatment review",
    patientConcern: "Wants help with late dinners and evening snacking on workdays. Mild acidity after a late dinner last week.",
    height: "165 cm",
    weight: "76.6 kg",
    weightDate: "1 Oct 2026",
    weights: [
      { date: "10 Sep", value: 78.0 },
      { date: "17 Sep", value: 77.4 },
      { date: "24 Sep", value: 77.1 },
      { date: "1 Oct", value: 76.6 },
    ],
    treatment: {
      name: "Semaglutide (Wegovy FlexTouch)",
      instructions: "0.25 mg · once a week · with metformin SR 500 mg after dinner",
      date: "Started 25 Sep 2026",
      source: "Signed Medistry prescription",
    },
    outsideMedicine: "No other medicines reported at the last check-in",
    otherCare: ["Dietitian review · 16 Sep 2026", "Weekly weight check-ins · ongoing"],
    dietPlan: { title: "Current meal plan", date: "16 Sep 2026", source: "Dietitian reviewed", note: "The detailed plan is held in the patient care record. Confirm any changes with the dietitian after this visit." },
    scribeDraft: "Aanya asked about meal timing on workdays and mild acidity after a late dinner, and reviewed her recent weight readings. The current signed treatment and recorded measurements were reviewed. Any change to medication requires a separate clinical decision and signed prescription.",
    allergy: "No known medicine allergies · asked 10 Sep 2026",
    allergyConfirmed: true,
    lab: { name: "HbA1c", result: "6.1%", date: "14 Sep 2026", source: "Partner lab report", reportId: "DEMO-260914-0482" },
    lastReview: "24 Sep 2026",
    discussion: ["First week on semaglutide: mild acidity after a late dinner", "Late dinners and evening snacking", "Review recent weight readings"],
    plan: ["Doctor to decide on 0.5 mg after week 4", "Continue logging weight once a week", "Follow-up review in two weeks"],
  },
  diabetes: {
    key: "diabetes",
    label: "Diabetes review",
    appointment: "Follow-up · 30 min",
    visitType: "Three-month review",
    patient: "Ritu Malhotra",
    age: 46,
    sex: "Female",
    programme: "Weight and diabetes care · week 13",
    focus: "Glucose and lab review",
    patientConcern: "New HbA1c report. Asks whether the evening tablet can move earlier. Dizzy mid-morning twice this week.",
    height: "162 cm",
    weight: "87.2 kg",
    weightDate: "1 Oct 2026",
    weights: [
      { date: "3 Sep", value: 89.0 },
      { date: "17 Sep", value: 88.1 },
      { date: "24 Sep", value: 87.6 },
      { date: "1 Oct", value: 87.2 },
    ],
    treatment: {
      name: "Metformin SR",
      instructions: "1000 mg · twice a day with meals",
      date: "Version 3, signed 3 Sep 2026",
      source: "Signed Medistry prescription",
    },
    outsideMedicine: "Telmisartan 40 mg once a day · from her cardiologist",
    otherCare: ["Morning glucose log · patient reported", "Dietitian review · 12 Sep 2026"],
    dietPlan: { title: "Current nutrition plan", date: "12 Sep 2026", source: "Dietitian reviewed", note: "The detailed plan is held in the patient care record. Review it with the patient before suggesting changes." },
    scribeDraft: "Ritu asked about the latest HbA1c result and reported mid-morning dizziness twice this week. The laboratory result and current signed treatment were reviewed. Allergy history remains unconfirmed and should be checked before any treatment change.",
    allergy: "Sulfa medicines, rash · patient reported",
    allergyConfirmed: true,
    lab: { name: "HbA1c", result: "7.1%", date: "29 Sep 2026", source: "Partner lab report", reportId: "DEMO-260929-0526" },
    lastReview: "17 Sep 2026",
    discussion: ["Review HbA1c result", "Mid-morning dizziness", "Timing of the evening tablet"],
    plan: ["Doctor to review the lab report", "Continue morning glucose log", "Follow-up review in two weeks"],
  },
  first: {
    key: "first",
    label: "First consultation",
    appointment: "First consultation · 30 min",
    visitType: "First consultation · 30 min",
    patient: "Meera Iyer",
    age: 29,
    sex: "Female",
    programme: "Programme under review",
    focus: "Understand health history and goals",
    patientConcern: "From her check: irregular periods and weight gain over two years. Wants to understand her options.",
    height: "161 cm",
    weight: "74.5 kg",
    weightDate: "From her check",
    weights: [{ date: "From check", value: 74.5 }],
    treatment: null,
    outsideMedicine: "No medicines reported in the eligibility check",
    otherCare: [],
    dietPlan: null,
    scribeDraft: "Meera discussed her health history, irregular periods and her goals for this consultation. The doctor will complete the clinical review before recommending a programme, tests, or treatment.",
    allergy: "Allergy status unconfirmed · verify before treatment changes",
    allergyConfirmed: false,
    lab: null,
    lastReview: null,
    discussion: ["Confirm health history", "Understand goals and concerns", "Decide whether further tests are needed"],
    plan: ["Doctor to complete the first review", "Any plan will be shared after clinical review"],
  },
};

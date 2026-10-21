/*
  What a patient's record holds once care has started: the shapes of the handover's care
  aggregators (GET /api/v1/care, /journey, /treatment-plan/current, /prescriptions, /labs/reports,
  /diet-plan/current, /medicine-orders, /coach/my-coach, /payments), and a sample record built
  around the patient's own profile for the prototype.

  Everything here is sample data for design review. Doctors, results and prescriptions are made up.
*/

import { PLANS } from "../plans";
import { clinicTime } from "./clinic-time";

export type Doctor = {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  registration_no: string;
  experience_years: number;
  gender: "Male" | "Female";
  languages: string[];
  bio: string;
  photo_url: string | null;
};

export type Coach = { id: string; name: string; credentials: string; languages: string[]; gender: "Male" | "Female" };

export type PrescriptionItem = {
  /** the name on the pack, as the patient knows it */
  medicine_name: string;
  /** the molecule, which Indian prescriptions also print */
  generic?: string;
  /** for a pen: which device, so the guides can give its exact steps */
  device?: "FLEXTOUCH" | "KWIKPEN";
  /** how it is taken, which decides the guide and the reminder it gets */
  form: "TABLET" | "SACHET" | "PEN";
  strength: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
  /** the doctor's reason, in their words */
  reason: string;
  /** what people commonly notice early on, and what helps */
  effects: string[];
  /** what to do about a missed one, from the doctor */
  missed: string;
};

export type Prescription = {
  id: string;
  version: number;
  status: "DRAFT" | "SIGNED" | "SUPERSEDED";
  signed_at: string | null;
  doctor: string;
  consultation_id: string;
  items: PrescriptionItem[];
  advice: string[];
};

export type LabStatus =
  | "BOOKED"
  | "SLOT_CONFIRMED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "REPORT_READY"
  | "DOCTOR_REVIEW_PENDING"
  | "REVIEWED"
  | "CANCELLED"
  | "COLLECTION_FAILED";

export type LabResult = { test: string; value: number; unit: string; range: string; flag: "LOW" | "NORMAL" | "HIGH"; group: string };

export type LabReport = {
  id: string;
  package: string;
  partner: string;
  slot_at: string;
  status: LabStatus;
  report_date: string | null;
  reviewed_by: string | null;
  doctor_comment: string | null;
  results: LabResult[];
  /** what an upcoming panel will test */
  tests?: string[];
};

export type Consultation = {
  id: string;
  at: string;
  type: "FIRST_CONSULTATION" | "FOLLOW_UP";
  duration_min: number;
  doctor: string;
  summary: string;
  next_steps: string[];
};

export type Goal = { goal_type: "PROTEIN" | "CALORIES" | "WATER" | "STEPS" | "SLEEP"; target_value: number; unit: string; label: string };

export type DietDay = { meal: "Breakfast" | "Lunch" | "Evening snack" | "Dinner"; time: string; items: string; protein_g: number; kcal: number; foods?: { name: string; n: number }[] }[];

export type OrderStatus = "PLACED" | "PACKED" | "DISPATCHED" | "DELIVERED";
export type MedicineOrder = {
  id: string;
  prescription_id: string;
  placed_at: string;
  status: OrderStatus;
  history: { status: OrderStatus; at: string; note: string }[];
  courier: string;
  tracking_no: string;
  items: { name: string; qty: string }[];
};

export type Invoice = { id: string; invoice_no: string; title: string; paid_at: string; status: "PAID" };

export type SymptomLog = { id: string; code: string; label: string; severity: "Mild" | "Moderate" | "Severe"; note: string; logged_at: string; requires_review: boolean };
/** Where an injection went, so next week's can go somewhere else. */
export type Site = "ABD_L" | "ABD_R" | "THIGH_L" | "THIGH_R" | "ARM_L" | "ARM_R";
export const SITES: { id: Site; label: string; short: string }[] = [
  { id: "ABD_L", label: "Tummy, left side", short: "left tummy" },
  { id: "ABD_R", label: "Tummy, right side", short: "right tummy" },
  { id: "THIGH_L", label: "Left thigh", short: "left thigh" },
  { id: "THIGH_R", label: "Right thigh", short: "right thigh" },
  { id: "ARM_L", label: "Left upper arm", short: "left upper arm" },
  { id: "ARM_R", label: "Right upper arm", short: "right upper arm" },
];
/** The next spot in a simple weekly round (tummy and thighs; arms only with help). */
export const nextSite = (last?: Site): Site => {
  const round: Site[] = ["ABD_L", "ABD_R", "THIGH_L", "THIGH_R"];
  const i = last ? round.indexOf(last) : -1;
  return round[(i + 1) % round.length];
};
export type MedicationLog = { id: string; item: string; scheduled_for: string; status: "TAKEN" | "SKIPPED"; at: string; site?: Site; dose?: string };

export type CheckIn = { date: string; feeling: "GOOD" | "OKAY" | "NOT_GREAT" };

/** Bumped when the sample record changes shape, so an older saved record is rebuilt. */
export const CARE_SCHEMA = 8;

/** How far into care the prototype record is: after the first, second or third consultation. */
export type Stage = 1 | 2 | 3;

export type CareRecord = {
  schema: number;
  stage: Stage;
  started_at: string;
  doctor: Doctor;
  coach: Coach;
  /** SUGGESTED: the doctor has proposed it after the first consultation; ACTIVE once started and paid */
  programme: { name: string; status: "SUGGESTED" | "ACTIVE"; start_at: string; end_at: string; months: number };
  /** a pause or cancellation the patient asked for; the care team confirms it on WhatsApp before anything changes */
  plan_change?: { kind: "PAUSE" | "CANCEL"; requested_at: string } | null;
  plan: { start_date: string; review_date: string; goals: Goal[]; notes: string };
  prescriptions: Prescription[];
  labs: LabReport[];
  consultations: Consultation[];
  next: { id: string; at: string; type: "FOLLOW_UP"; duration_min: number } | null;
  diet: { reviewed_by: string; reviewed_at: string; day: DietDay; notes: string[] };
  exercise: { title: string; detail: string }[];
  orders: MedicineOrder[];
  invoices: Invoice[];
  symptoms: SymptomLog[];
  medication: MedicationLog[];
  checkins: CheckIn[];
};

export const DOCTOR: Doctor = {
  id: "doc_menon",
  name: "Dr. Arvind Menon",
  qualification: "MBBS, MD (Medicine), DM (Endocrinology)",
  specialty: "Endocrinology and metabolic care",
  registration_no: "Sample profile, registration shown here once verified",
  experience_years: 18,
  gender: "Male",
  languages: ["English", "Hindi", "Malayalam"],
  bio: "Looks after people living with excess weight, prediabetes and type 2 diabetes, with a focus on steady habits that fit Indian meals and working days.",
  photo_url: "/img/consult-doctor-demo.png",
};

export const COACH: Coach = { id: "coach_ritika", name: "Ritika Sharma", credentials: "Registered dietitian", languages: ["English", "Hindi", "Punjabi"], gender: "Female" };

export const SYMPTOMS = [
  { code: "NAUSEA", label: "Nausea" },
  { code: "ACIDITY", label: "Acidity or heartburn" },
  { code: "CONSTIPATION", label: "Constipation" },
  { code: "LOOSE_MOTIONS", label: "Loose motions" },
  { code: "FATIGUE", label: "Tiredness" },
  { code: "DIZZINESS", label: "Dizziness" },
  { code: "VOMITING", label: "Vomiting" },
  { code: "BELLY_PAIN", label: "Pain in the tummy" },
  { code: "SITE", label: "Redness where I injected" },
  { code: "OTHER", label: "Something else" },
] as const;

export const LAB_STEPS: { status: LabStatus; label: string }[] = [
  { status: "BOOKED", label: "Booked" },
  { status: "SLOT_CONFIRMED", label: "Slot confirmed" },
  { status: "SAMPLE_COLLECTED", label: "Sample collected" },
  { status: "PROCESSING", label: "At the lab" },
  { status: "REPORT_READY", label: "Report ready" },
  { status: "REVIEWED", label: "Reviewed by your doctor" },
];

/** Home blood test packets the care team offers (sample names and contents; CONFIRM with the lab partner). */
export type LabPacket = { id: "P1" | "P2" | "P3"; name: string; title: string; tests: string[]; fasting: boolean };
export const LAB_PACKETS: LabPacket[] = [
  { id: "P1", name: "Packet 1", title: "Sugar and lipids", tests: ["HbA1c", "Fasting glucose", "Lipid profile"], fasting: true },
  { id: "P2", name: "Packet 2", title: "Metabolic", tests: ["HbA1c", "Fasting glucose", "Lipid profile", "Liver function", "Kidney function", "Thyroid (TSH)"], fasting: true },
  { id: "P3", name: "Packet 3", title: "Complete", tests: ["HbA1c", "Fasting glucose", "Lipid profile", "Liver function", "Kidney function", "Thyroid (TSH)", "Vitamin D", "Vitamin B12", "Complete blood count", "Urine routine"], fasting: true },
];

export const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PLACED", label: "Order placed" },
  { status: "PACKED", label: "Packed by the pharmacy" },
  { status: "DISPATCHED", label: "On the way" },
  { status: "DELIVERED", label: "Delivered" },
];

const day = 24 * 3600e3;
/** The sample patient's plan: six months, from the shared price table the website also reads. */
const PLAN = PLANS.find((p) => p.months === 6)!;
const at = (base: number, days: number, h: number, m = 0) => {
  const d = new Date(base + days * day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
/** A clinic day: Sundays are closed, so a visit that lands on one moves to Monday. */
const open = (iso: string) => {
  const d = new Date(iso);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString();
};

/**
 * A believable first three weeks of care, built around the patient's own answers: the first
 * consultation, home blood tests, a signed prescription, a delivered order and a few weeks of logs.
 */
export function sampleCare(p: { first_name: string; baseline_weight_kg: number | null; height_cm: number | null }, stage: Stage = 2): CareRecord {
  const now = Date.now();
  // days since sign-up: three days after the first consultation, three weeks, or eight weeks
  const start = now - (stage === 1 ? 3 : stage === 3 ? 56 : 21) * day;
  const firstId = "con_1";
  const rx1 = "rx_1";
  const rx2 = "rx_2";

  // after two consultations the first injection is today; after three, the next one is tomorrow
  const injectionDay = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(new Date(now + (stage === 3 ? day : 0)));

  const c: CareRecord = {
    schema: CARE_SCHEMA,
    stage,
    started_at: at(start, 0, 18, 30),
    doctor: DOCTOR,
    coach: COACH,
    programme: { name: "Weight and metabolic care", status: "ACTIVE", start_at: at(start, 1, 10), end_at: at(start, 1 + PLAN.weeks * 7, 10), months: PLAN.months },
    plan: {
      start_date: at(start, 1, 10),
      review_date: open(at(now, 7, 18, 30)),
      goals: [
        { goal_type: "PROTEIN", target_value: 80, unit: "g", label: "protein a day" },
        { goal_type: "CALORIES", target_value: 1600, unit: "kcal", label: "a day, roughly" },
        { goal_type: "WATER", target_value: 2500, unit: "ml", label: "water a day" },
        { goal_type: "STEPS", target_value: 7000, unit: "steps", label: "steps a day" },
        { goal_type: "SLEEP", target_value: 420, unit: "min", label: "sleep a night" },
      ],
      notes: "Protein at every meal, a 30-minute walk after dinner, and an earlier, lighter dinner on weekdays.",
    },
    prescriptions: [
      {
        id: rx2,
        version: 2,
        status: "SIGNED",
        signed_at: at(start, 14, 19, 5),
        doctor: DOCTOR.name,
        consultation_id: "con_2",
        items: [
          // inside the signed-in app the prescribed medicine is named; the public site never names one
          {
            medicine_name: "Wegovy",
            generic: "Semaglutide",
            device: "FLEXTOUCH",
            form: "PEN",
            strength: "0.25 mg",
            dose: "1 injection",
            frequency: `Once a week, on ${injectionDay}s`,
            route: "Under the skin, FlexTouch pen",
            duration: "4 weeks at 0.25 mg, then 0.5 mg if it suits you",
            instructions: "The same day each week, at any time, with or without food. Use a new needle each time and change the spot you inject.",
            reason: "Your BMI and waist are in the obesity range for Indian adults, and your sugar is in the prediabetes range. This starts at a low dose so your body can get used to it.",
            effects: ["Feeling full sooner, and less interest in food", "Mild nausea, burping or acidity, mostly in the first weeks and after a dose increase", "Constipation or loose motions for a few days"],
            missed: "Five days or less since your usual day: take it now. More than five: skip it and take the next one on your usual day. Never two within three days.",
          },
          {
            medicine_name: "Metformin SR",
            form: "TABLET",
            strength: "500 mg",
            dose: "1 tablet",
            frequency: "Once a day, after dinner",
            route: "By mouth",
            duration: "90 days",
            instructions: "Take with food. Tell your care team about stomach upset that lasts more than a few days.",
            reason: "Helps your body use its own insulin better while your sugar is in the prediabetes range.",
            effects: ["An unsettled stomach or loose motions in the first week or two, which usually settles", "A metallic taste for a few days"],
            missed: "Skip the missed tablet and take the next one at the usual time. Never take two together.",
          },
          {
            medicine_name: "Vitamin D3",
            form: "SACHET",
            strength: "60,000 IU",
            dose: "1 sachet",
            frequency: "Once a week, on Sundays",
            route: "By mouth",
            duration: "8 weeks",
            instructions: "Mix in a glass of milk or water.",
            reason: "Your vitamin D was low on your first blood test.",
            effects: ["Most people notice nothing"],
            missed: "Take it the next day, then go back to Sundays.",
          },
        ],
        advice: ["Repeat HbA1c, fasting sugar and lipids in three months", "Walk 30 minutes on at least five days a week"],
      },
      {
        id: rx1,
        version: 1,
        status: "SUPERSEDED",
        signed_at: at(start, 1, 10, 20),
        doctor: DOCTOR.name,
        consultation_id: firstId,
        items: [
          {
            medicine_name: "Vitamin D3",
            form: "SACHET",
            strength: "60,000 IU",
            dose: "1 sachet",
            frequency: "Once a week, on Sundays",
            route: "By mouth",
            duration: "8 weeks",
            instructions: "Mix in a glass of milk or water.",
            reason: "Your vitamin D was low on your first blood test.",
            effects: ["Most people notice nothing"],
            missed: "Take it the next day, then go back to Sundays.",
          },
        ],
        advice: ["Home blood tests before the follow-up"],
      },
    ],
    labs: [
      {
        id: "lab_2",
        package: "Three-month follow-up panel",
        partner: "Partner lab, home collection",
        slot_at: open(at(now, 69, 7, 30)), // labs collect Monday to Saturday
        status: "BOOKED",
        report_date: null,
        reviewed_by: null,
        doctor_comment: null,
        results: [],
        tests: ["HbA1c", "Fasting glucose", "Lipid profile", "Liver function", "Kidney function", "Vitamin D", "Vitamin B12"],
      },
      {
        id: "lab_1",
        package: "Metabolic baseline panel",
        partner: "Partner lab, home collection",
        slot_at: at(start, 3, 7, 30),
        status: "REVIEWED",
        report_date: at(start, 4, 16),
        reviewed_by: DOCTOR.name,
        doctor_comment: "Sugar is in the prediabetes range and vitamin D is low. Both are common and we have a plan for each. Liver enzymes are slightly raised, which fits with fatty liver; we will recheck in three months.",
        results: [
          { group: "Blood sugar", test: "HbA1c", value: 6.1, unit: "%", range: "4.0 to 5.6", flag: "HIGH" },
          { group: "Blood sugar", test: "Fasting glucose", value: 108, unit: "mg/dL", range: "70 to 99", flag: "HIGH" },
          { group: "Lipids", test: "LDL cholesterol", value: 132, unit: "mg/dL", range: "Below 100", flag: "HIGH" },
          { group: "Lipids", test: "HDL cholesterol", value: 46, unit: "mg/dL", range: "Above 40", flag: "NORMAL" },
          { group: "Lipids", test: "Triglycerides", value: 168, unit: "mg/dL", range: "Below 150", flag: "HIGH" },
          { group: "Liver", test: "ALT (SGPT)", value: 41, unit: "U/L", range: "7 to 35", flag: "HIGH" },
          { group: "Kidney", test: "Creatinine", value: 0.8, unit: "mg/dL", range: "0.6 to 1.1", flag: "NORMAL" },
          { group: "Thyroid", test: "TSH", value: 2.4, unit: "mIU/L", range: "0.4 to 4.0", flag: "NORMAL" },
          { group: "Vitamins", test: "Vitamin D", value: 17, unit: "ng/mL", range: "30 to 100", flag: "LOW" },
          { group: "Vitamins", test: "Vitamin B12", value: 310, unit: "pg/mL", range: "200 to 900", flag: "NORMAL" },
        ],
      },
    ],
    consultations: [
      {
        id: "con_2",
        at: at(start, 14, 18, 30),
        type: "FOLLOW_UP",
        duration_min: 30,
        doctor: DOCTOR.name,
        summary: "We went through your blood test results together. Your sugar is in the prediabetes range and your weight is in the obesity range, so you are starting semaglutide (Wegovy) 0.25 mg once a week, and metformin for blood sugar, alongside your meal plan. Vitamin D continues.",
        next_steps: [`First injection on ${injectionDay}, with the step-by-step guide in the app`, "Log weight twice a week", "Follow-up in two weeks"],
      },
      {
        id: firstId,
        at: at(start, 1, 10, 0),
        type: "FIRST_CONSULTATION",
        duration_min: 30,
        doctor: DOCTOR.name,
        summary: "We talked through your health profile, your daily routine and what you have tried before. Home blood tests are booked to check your sugar, lipids, liver and vitamins before we decide on a plan.",
        next_steps: ["Home blood tests in the next few days", "Meet Ritika, your dietitian", "Follow-up once results are in"],
      },
    ],
    next: { id: "apt_next", at: open(at(now, 7, 18, 30)), type: "FOLLOW_UP", duration_min: 30 },
    diet: {
      reviewed_by: `${COACH.name}, ${COACH.credentials.toLowerCase()}`,
      reviewed_at: at(start, 5, 12),
      day: [
        { meal: "Breakfast", time: "8:30 am", items: "2 moong dal chillas with mint chutney and a katori of curd", protein_g: 20, kcal: 330, foods: [{ name: "Besan or moong chilla", n: 2 }, { name: "Curd", n: 1 }] },
        { meal: "Lunch", time: "1:30 pm", items: "2 phulkas, dal, a katori of sabzi and salad", protein_g: 18, kcal: 450, foods: [{ name: "Roti or phulka", n: 2 }, { name: "Dal", n: 1 }, { name: "Sabzi", n: 1 }, { name: "Salad", n: 1 }] },
        { meal: "Evening snack", time: "5:00 pm", items: "Roasted chana and a glass of buttermilk", protein_g: 9, kcal: 160, foods: [{ name: "Roasted chana", n: 1 }, { name: "Buttermilk", n: 1 }] },
        { meal: "Dinner", time: "7:30 pm", items: "Paneer bhurji with sautéed vegetables and 1 phulka", protein_g: 24, kcal: 480, foods: [{ name: "Paneer", n: 2 }, { name: "Sabzi", n: 1 }, { name: "Roti or phulka", n: 1 }] },
      ],
      notes: ["Tea with less sugar, two cups a day", "Eat fruit whole and skip the juice", "Eat dinner at least two hours before bed"],
    },
    exercise: [
      { title: "Walk after dinner", detail: "30 minutes at a pace where talking takes a little effort, five days a week" },
      { title: "Strength at home", detail: "Squats to a chair, wall push-ups and stair climbs, two days a week, 15 minutes" },
    ],
    orders: [
      {
        id: "ord_1",
        prescription_id: rx2,
        placed_at: at(start, 14, 19, 20),
        status: "DELIVERED",
        history: [
          { status: "PLACED", at: at(start, 14, 19, 20), note: "From your signed prescription" },
          { status: "PACKED", at: at(start, 15, 10, 5), note: "Checked by the pharmacist" },
          { status: "DISPATCHED", at: at(start, 15, 14, 40), note: "Handed to the courier" },
          { status: "DELIVERED", at: at(start, 16, 11, 15), note: "Scan the QR seal on each pack to check it is genuine" },
        ],
        courier: "Courier partner",
        tracking_no: "MD-26-004182",
        items: [
          { name: "Wegovy FlexTouch 0.25 mg", qty: "1 pen (4 doses), with needles" },
          { name: "Metformin SR 500 mg", qty: "90 tablets" },
          { name: "Vitamin D3 60,000 IU", qty: "8 sachets" },
        ],
      },
    ],
    invoices: [
      { id: "inv_2", invoice_no: "MDS/26-27/00418", title: "Six-month plan, itemised", paid_at: at(start, 14, 19, 12), status: "PAID" },
      { id: "inv_1", invoice_no: "MDS/26-27/00377", title: "Home blood tests", paid_at: at(start, 2, 11, 0), status: "PAID" },
    ],
    symptoms: [{ id: "s1", code: "ACIDITY", label: "Acidity or heartburn", severity: "Mild", note: "After a late dinner", logged_at: at(start, 17, 22, 10), requires_review: false }],
    medication: Array.from({ length: 6 }, (_, i) => ({ id: `ml${i}`, item: "Metformin SR 500 mg", scheduled_for: at(now, -(i + 1), 21), status: (i === 3 ? "SKIPPED" : "TAKEN") as "TAKEN" | "SKIPPED", at: at(now, -(i + 1), 21, 10) })),
    checkins: [],
  };

  if (stage === 1) return firstOnly(c, now);
  if (stage === 3) return afterThird(c, start, now, injectionDay);
  return c;
}

const dayOf = (t: number) => new Date(t).toDateString();
const iso = (t: number) => new Date(t).toISOString();

/**
 * After the first consultation: blood tests were done before joining and read on the call, the
 * doctor has suggested a programme, and nothing is prescribed until the patient starts it.
 */
function firstOnly(c: CareRecord, now: number): CareRecord {
  const base = c.labs.find((l) => l.id === "lab_1")!;
  c.consultations = c.consultations.filter((v) => v.type === "FIRST_CONSULTATION");
  c.consultations[0] = {
    ...c.consultations[0],
    at: at(now, -2, 18, 30),
    summary: "We talked through your health profile, your daily routine and what you have tried before, and read the blood test report you shared before the call. Your sugar is in the prediabetes range and your vitamin D is low. I have suggested the six-month weight and metabolic programme.",
    next_steps: ["Start the suggested programme when ready", "Meet Ritika, your dietitian, once it starts", "Your doctor reviews you every 14 days"],
  };
  c.programme = { ...c.programme, status: "SUGGESTED", start_at: at(now, -2, 19), end_at: at(now, PLAN.weeks * 7 - 2, 19) };
  c.prescriptions = [];
  c.labs = [{ ...base, slot_at: at(now, -9, 7, 30), report_date: at(now, -8, 16), reviewed_by: DOCTOR.name }];
  c.orders = [];
  c.invoices = [];
  c.next = null;
  c.plan.review_date = at(now, 12, 18, 30);
  c.diet.reviewed_at = at(now, -1, 12);
  c.symptoms = [];
  c.medication = [];
  c.checkins = [];
  return c;
}

/**
 * Eight weeks in: three consultations. Four weekly injections at 0.25 mg went well, so the third
 * consultation stepped up to 0.5 mg; two of those are done and the next is tomorrow.
 */
function afterThird(c: CareRecord, start: number, now: number, injectionDay: string): CareRecord {
  const rx2 = c.prescriptions.find((r) => r.id === "rx_2")!;
  rx2.status = "SUPERSEDED";
  const [pen, met] = rx2.items;
  const rx3: Prescription = {
    id: "rx_3",
    version: 3,
    status: "SIGNED",
    signed_at: at(start, 42, 19, 5),
    doctor: DOCTOR.name,
    consultation_id: "con_3",
    items: [
      { ...pen, strength: "0.5 mg", frequency: `Once a week, on ${injectionDay}s`, duration: "4 weeks at 0.5 mg, then reviewed", reason: "Four weeks at 0.25 mg suited you, with only mild nausea that settled. The next step is 0.5 mg, held for four weeks." },
      met,
      { ...rx2.items[2], frequency: "Once a month, on the first Sunday", duration: "3 months", reason: "Your eight-week course is done. A monthly sachet keeps your level up.", instructions: "Mix in a glass of milk or water." },
    ],
    advice: ["Three-month blood tests before the next review", "Protein at every meal, and strength work twice a week"],
  };
  c.prescriptions = [rx3, ...c.prescriptions];

  const shots = [15, 22, 29, 36, 43, 50];
  const sites: Site[] = ["ABD_L", "ABD_R", "THIGH_L", "THIGH_R", "ABD_L", "ABD_R"];
  const penLogs: MedicationLog[] = shots.map((d, i) => ({ id: `pen${i}`, item: pen.medicine_name, scheduled_for: at(start, d, 21), status: "TAKEN", at: at(start, d, 9, 20 + i), site: sites[i], dose: i < 4 ? "0.25 mg" : "0.5 mg" }));
  const days = Math.floor((now - start) / day);
  const tablets: MedicationLog[] = Array.from({ length: days - 15 }, (_, i) => days - 1 - i)
    .map((d, i) => ({ id: `met${i}`, item: `${met.medicine_name} ${met.strength}`, scheduled_for: at(start, d, 21), status: (d % 9 === 0 ? "SKIPPED" : "TAKEN") as MedicationLog["status"], at: at(start, d, 21, 15) }));
  c.medication = [...penLogs.reverse(), ...tablets];

  c.consultations = [
    {
      id: "con_3",
      at: at(start, 42, 18, 30),
      type: "FOLLOW_UP",
      duration_min: 30,
      doctor: DOCTOR.name,
      summary: "You have taken four weekly injections of Wegovy 0.25 mg, all on time. The mild nausea of the first fortnight has settled, and the constipation in week two eased with more water and fibre. Your protein is close to target. We are stepping up to 0.5 mg as planned. Metformin continues; your vitamin D course is complete and moves to monthly.",
      next_steps: [`First 0.5 mg injection on ${injectionDay}`, "Three-month blood tests at home before the next review", "Dietitian check-in on protein next week", "Follow-up in four weeks"],
    },
    ...c.consultations,
  ];

  c.symptoms = [
    { id: "s4", code: "NAUSEA", label: "Nausea", severity: "Mild", note: "The day after the first 0.5 mg", logged_at: at(start, 44, 13, 5), requires_review: false },
    { id: "s3", code: "CONSTIPATION", label: "Constipation", severity: "Moderate", note: "Better after more water and fibre", logged_at: at(start, 24, 9, 40), requires_review: false },
    ...c.symptoms,
    { id: "s2", code: "NAUSEA", label: "Nausea", severity: "Mild", note: "The day after the first injection", logged_at: at(start, 16, 12, 30), requires_review: false },
  ];

  // the three-month panel: collected on the last working morning before today (labs collect Monday to Saturday), now at the lab
  const collected = new Date(now);
  do collected.setDate(collected.getDate() - 1);
  while (collected.getDay() === 0);
  collected.setHours(7, 30, 0, 0);
  c.labs = c.labs.map((l) => (l.id === "lab_2" ? { ...l, slot_at: iso(collected.getTime()), status: "PROCESSING" } : l));
  c.orders = [
    // the next pen, already on its way: one dose is left in the current one
    {
      id: "ord_3",
      prescription_id: "rx_3",
      placed_at: iso(clinicTime(now, 2, 18, 10)),
      status: "DISPATCHED",
      // the pharmacy's working days, never a time still to come
      history: [
        { status: "PLACED", at: iso(clinicTime(now, 2, 18, 10)), note: "Refill, from your signed prescription" },
        { status: "PACKED", at: iso(clinicTime(now, 1, 10, 20)), note: "Checked by the pharmacist" },
        { status: "DISPATCHED", at: iso(clinicTime(now, 0, 9, 40)), note: "Handed to the courier, arrives in 2 days" },
      ],
      courier: "Courier partner",
      tracking_no: "MD-26-005884",
      items: [{ name: "Wegovy FlexTouch 0.5 mg", qty: "1 pen (4 doses), with needles" }],
    },
    {
      id: "ord_2",
      prescription_id: "rx_3",
      placed_at: at(start, 42, 19, 20),
      status: "DELIVERED",
      history: [
        { status: "PLACED", at: at(start, 42, 19, 20), note: "From your signed prescription" },
        { status: "PACKED", at: at(start, 43, 9, 50), note: "Checked by the pharmacist" },
        { status: "DISPATCHED", at: at(start, 43, 13, 30), note: "Handed to the courier" },
        { status: "DELIVERED", at: at(start, 44, 10, 40), note: "Scan the QR seal on each pack to check it is genuine" },
      ],
      courier: "Courier partner",
      tracking_no: "MD-26-005217",
      items: [
        { name: "Wegovy FlexTouch 0.5 mg", qty: "1 pen (4 doses), with needles" },
        { name: "Metformin SR 500 mg", qty: "30 tablets" },
        { name: "Vitamin D3 60,000 IU", qty: "3 sachets" },
      ],
    },
    ...c.orders,
  ];
  c.invoices = [{ id: "inv_3", invoice_no: "MDS/26-27/00512", title: "Second pen and refills, itemised", paid_at: at(start, 42, 19, 14), status: "PAID" }, ...c.invoices];
  c.next = { id: "apt_next", at: open(at(start, 70, 18, 30)), type: "FOLLOW_UP", duration_min: 30 };
  c.plan.review_date = c.next.at;
  c.diet.reviewed_at = at(start, 45, 12);
  c.checkins = Array.from({ length: 10 }, (_, i) => ({ date: dayOf(now - (i + 1) * day), feeling: ([1, 6].includes(i) ? "OKAY" : "GOOD") as CheckIn["feeling"] }));
  return c;
}

/** Weight readings for the sample: they move a little in both directions, never a smooth line. */
export const sampleWeights = (w0: number, stage: Stage = 2) => {
  const span = stage === 1 ? 3 : stage === 3 ? 56 : 21;
  const start = Date.now() - span * day;
  const drift =
    stage === 1
      ? [0, -0.2]
      : stage === 3
        ? [0, -0.3, -0.2, -0.6, -0.5, -0.9, -1.1, -1.0, -1.4, -1.7, -1.6, -2.1, -2.4, -2.3, -2.8, -3.1, -3.0, -3.4]
        : [0, -0.3, -0.2, -0.6, -0.5, -0.9, -1.1, -1.0, -1.4];
  const gap = (span - 0.5) / (drift.length - 1);
  return drift.map((dlt, i) => ({ id: `w${i}`, weight_kg: Math.round((w0 + dlt) * 10) / 10, logged_at: at(start, i * gap, 7, 40), source: (i === 0 ? "ONBOARDING" : "MANUAL") as "ONBOARDING" | "MANUAL" }));
};

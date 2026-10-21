"use client";

import { useSyncExternalStore } from "react";
import { CONDITIONS } from "../account/config";
import { short } from "../account/bits";
import { CLOSE_HOUR, OPEN_HOUR, clinicTime, inClinicHours } from "../account/clinic-time";
import type { CallNote } from "./notes-store";

/*
  The clinician portal's data, in the shapes of the handover's doctor endpoints:
  GET /api/v1/doctor/patients/:id/clinical-profile, appointments, lab reports pending review,
  draft prescriptions, flagged symptoms; and the actions only an authorised doctor can take
  (POST /doctor/assessments, /doctor/prescriptions/:id/finalise, lab review). Every action is
  recorded with who and when, as the audit rule asks.

  All patients and results are made up, for design review. The doctor's changes are kept in this
  browser only.
*/

export type Sex = "Female" | "Male";
export type VisitType = "FIRST_CONSULTATION" | "FOLLOW_UP";
export type ApptStatus = "BOOKED" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW";

export type Result = { test: string; value: number; unit: string; range: string; flag: "LOW" | "NORMAL" | "HIGH" };
export type Lab = { id: string; package: string; collected: string; reported: string | null; status: "PROCESSING" | "DOCTOR_REVIEW_PENDING" | "REVIEWED"; results: Result[]; comment: string | null; reviewed_at: string | null };
export type RxItem = { name: string; strength: string; dose: string; frequency: string; duration: string };
export type Rx = { id: string; version: number; status: "DRAFT" | "SIGNED" | "SUPERSEDED"; date: string; items: RxItem[]; advice: string };
/** note_id: the signed call note this visit came from; assessment: its clinical reading, never shown to the patient */
export type Visit = { id: string; at: string; type: VisitType; summary: string; assessment?: string; note_id?: string; plan: string[] };
export type Symptom = { id: string; label: string; severity: "Mild" | "Moderate" | "Severe"; note: string; at: string; requires_review: boolean; acknowledged: boolean };
export type Note = { id: string; at: string; text: string; by: string };
export type Audit = { at: string; action: string };

export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  city: string;
  mobile: string;
  programme: string;
  since: string | null;
  identity_verified: boolean;
  height_cm: number;
  weights: { at: string; kg: number; source: "Patient logged" | "Profile" | "Smart scale" }[];
  waist_cm: { at: string; cm: number } | null;
  hba1c: { at: string; value: number }[];
  conditions: string[];
  allergies: string | null;
  /** null: never asked yet ("Not recorded"); []: asked, none */
  outside_meds: string[] | null;
  consents: string[];
  plan: { goals: { label: string; value: string }[]; review: string; notes: string } | null;
  next_at?: string | null;
  concern: string;
  /** first consultation only: the counsellor's screening call */
  screening?: Screening | null;
  labs: Lab[];
  rx: Rx[];
  visits: Visit[];
  symptoms: Symptom[];
  adherence: { taken: number; due: number } | null;
  /** a weekly pen: where the patient is on it, from their own logs */
  injections?: { name: string; strength: string; taken: number; per_step: number; last_at: string | null; last_site: string | null; due_today: boolean } | null;
  protein_avg_g: number | null;
  steps_avg: number | null;
  notes: Note[];
  audit: Audit[];
};

export type Appt = { id: string; patient_id: string | null; name: string; at: string; duration: number; type: VisitType; status: ApptStatus; reason: string };

/* "Call transcription" is its own consent, apart from the video call itself (DPDP Act 2023) */
const ALL_CONSENTS = ["Terms", "Privacy", "Health data", "Video consultation", "Call transcription"];
const PLAN = (protein: number, kcal: string, steps: string, review: string, notes: string) => ({
  goals: [
    { label: "Protein a day", value: `${protein} g` },
    { label: "Calories a day, roughly", value: `${kcal} kcal` },
    { label: "Water a day", value: "2.5 L" },
    { label: "Steps a day", value: steps },
    { label: "Sleep a night", value: "7 h" },
  ],
  review,
  notes,
});

/** The sample patients the consultation prototype can open, in the doctor's view. */
export const CALLS = new Set(["p_aanya", "p_ritu", "p_meera"]);

export const ME = { name: "Dr. Arvind Menon", short: "Dr. Menon", qualification: "MBBS, MD (Medicine), DM (Endocrinology)" };

const DAY = 864e5;
const now0 = () => new Date();
/** `days` from today at h:m. The clinic is closed on Sundays, so a Sunday moves to the Saturday before (or the Monday after, ahead). */
function at(days: number, h: number, m = 0) {
  const d = now0();
  d.setDate(d.getDate() + days);
  if (d.getDay() === 0) d.setDate(d.getDate() + (days > 0 ? 1 : -1));
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
/** A call or message `workdaysAgo` working days back, inside clinic hours; notes-store uses the same for its calls. */
export const callAt = (workdaysAgo: number, h: number, m = 0) => new Date(clinicTime(Date.now(), workdaysAgo, h, m)).toISOString();

/** One working day of clinic hours, 9 am to 8 pm: sample "a day ago" counts open hours only. */
export const CLINIC_DAY = (CLOSE_HOUR - OPEN_HOUR) * 36e5;
/**
 * `ms` of clinic time before `now`, counting only open hours: 3 hours before 10 am on a Tuesday is
 * 6 pm on Monday. Out of hours it counts back from the last open minute, so sample messages and
 * calls never land at night or on a Sunday, and keep their order.
 */
export function clinicAgo(now: number, ms: number) {
  let t = inClinicHours(now) ? now : clinicTime(now, 0, CLOSE_HOUR - 1, 59);
  let left = ms;
  for (;;) {
    const open = new Date(t).setHours(OPEN_HOUR, 0, 0, 0);
    if (t - open >= left) return t - left;
    left -= t - open;
    t = clinicTime(open - 1, 0, CLOSE_HOUR - 1, 59);
  }
}
const series = (start: number, deltas: number[], every = 7, h = 7) =>
  deltas.map((d, i) => ({ at: at(-(deltas.length - 1 - i) * every, h, 30), kg: Math.round((start + d) * 10) / 10, source: (i === 0 ? "Profile" : "Patient logged") as "Profile" | "Patient logged" }));

const BASE_PANEL = (o: Partial<Record<string, number>>): Result[] => [
  { test: "HbA1c", value: o.hba1c ?? 5.4, unit: "%", range: "4.0 to 5.6", flag: (o.hba1c ?? 5.4) >= 5.7 ? "HIGH" : "NORMAL" },
  { test: "Fasting glucose", value: o.fbs ?? 92, unit: "mg/dL", range: "70 to 99", flag: (o.fbs ?? 92) >= 100 ? "HIGH" : "NORMAL" },
  { test: "LDL cholesterol", value: o.ldl ?? 96, unit: "mg/dL", range: "Below 100", flag: (o.ldl ?? 96) >= 100 ? "HIGH" : "NORMAL" },
  { test: "Triglycerides", value: o.tg ?? 130, unit: "mg/dL", range: "Below 150", flag: (o.tg ?? 130) >= 150 ? "HIGH" : "NORMAL" },
  { test: "ALT (SGPT)", value: o.alt ?? 28, unit: "U/L", range: "7 to 35", flag: (o.alt ?? 28) > 35 ? "HIGH" : "NORMAL" },
  { test: "Creatinine", value: o.cr ?? 0.9, unit: "mg/dL", range: "0.6 to 1.2", flag: "NORMAL" },
  { test: "TSH", value: o.tsh ?? 2.2, unit: "mIU/L", range: "0.4 to 4.0", flag: (o.tsh ?? 2.2) > 4 ? "HIGH" : "NORMAL" },
  { test: "Vitamin D", value: o.vitd ?? 32, unit: "ng/mL", range: "30 to 100", flag: (o.vitd ?? 32) < 30 ? "LOW" : "NORMAL" },
];

function seed(): Patient[] {
  return [
    {
      id: "p_aanya",
      name: "Aanya Kapoor",
      age: 34,
      sex: "Female",
      city: "Gurugram",
      mobile: "+91 98•••• 43210",
      programme: "Weight and metabolic care",
      since: at(-20, 10),
      identity_verified: true,
      height_cm: 165,
      weights: series(78, [0, -0.3, -0.6, -0.9, -1.4], 5),
      waist_cm: { at: at(-21, 10), cm: 86 },
      hba1c: [{ at: at(-18, 16), value: 6.1 }],
      conditions: ["PCOS", "Prediabetes"],
      allergies: `No known medicine allergies (asked ${short(at(-20, 10))})`,
      outside_meds: [],
      concern: "Wants help with late dinners and evening snacking on workdays.",
      labs: [{ id: "l1", package: "Metabolic baseline panel", collected: at(-18, 7, 30), reported: at(-17, 16), status: "REVIEWED", results: BASE_PANEL({ hba1c: 6.1, fbs: 108, ldl: 132, tg: 168, alt: 41, vitd: 17 }), comment: "Prediabetes range, low vitamin D, mildly raised ALT. Recheck in three months.", reviewed_at: at(-17, 18) }],
      rx: [
        { id: "r2", version: 2, status: "SIGNED", date: at(-7, 19), items: [{ name: "Semaglutide (Wegovy FlexTouch)", strength: "0.25 mg", dose: "1 injection under the skin", frequency: "Once a week", duration: "4 weeks, then 0.5 mg if tolerated" }, { name: "Metformin SR", strength: "500 mg", dose: "1 tablet", frequency: "Once a day, after dinner", duration: "90 days" }, { name: "Vitamin D3", strength: "60,000 IU", dose: "1 sachet", frequency: "Once a week, on Sundays", duration: "8 weeks" }], advice: "Repeat HbA1c, fasting sugar and lipids in three months." },
        { id: "r1", version: 1, status: "SUPERSEDED", date: at(-20, 10, 20), items: [{ name: "Vitamin D3", strength: "60,000 IU", dose: "1 sachet", frequency: "Once a week, on Sundays", duration: "8 weeks" }], advice: "Home blood tests before follow-up." },
      ],
      visits: [
        { id: "v2", at: at(-7, 18, 30), type: "FOLLOW_UP", summary: "Results reviewed. Prediabetes range, BMI in the obesity range; started semaglutide 0.25 mg weekly and metformin SR with the meal plan. Vitamin D continues.", plan: ["First injection with the in-app guide", "Metformin SR 500 mg after dinner", "Weight twice a week", "Follow-up in two weeks"] },
        { id: "v1", at: at(-20, 10), type: "FIRST_CONSULTATION", summary: "History and routine taken. Desk job, late dinners, two previous attempts with diet apps. Baseline labs ordered.", plan: ["Metabolic baseline panel at home", "Dietitian introduction"] },
      ],
      symptoms: [{ id: "s1", label: "Acidity or heartburn", severity: "Mild", note: "After a late dinner", at: at(-4, 22, 10), requires_review: false, acknowledged: true }],
      adherence: { taken: 6, due: 7 },
      injections: { name: "Wegovy", strength: "0.25 mg", taken: 0, per_step: 4, last_at: null, last_site: null, due_today: false },
      protein_avg_g: 61,
      steps_avg: 7200,
      notes: [{ id: "n1", at: at(-7, 18, 50), text: "Motivated. Prefers Hindi for detailed explanations. Check GI tolerance at the next visit.", by: ME.name }],
      consents: ALL_CONSENTS,
      plan: PLAN(80, "1,600", "7,000", at(7, 18, 30), "Protein at every meal, a walk after dinner, earlier weekday dinners."),
      audit: [],
    },
    {
      id: "p_ritu",
      name: "Ritu Malhotra",
      age: 46,
      sex: "Female",
      city: "New Delhi",
      mobile: "+91 99•••• 18802",
      programme: "Weight and diabetes care",
      since: at(-84, 11),
      identity_verified: true,
      height_cm: 162,
      weights: series(92.2, [0, -0.8, -1.5, -1.9, -2.6, -2.4, -3.3, -3.9, -4.2, -4.6, -5.1, -5.0], 7),
      waist_cm: { at: at(-14, 9), cm: 104 },
      hba1c: [
        { at: at(-90, 16), value: 7.9 },
        { at: at(-2, 16), value: 7.1 },
      ],
      conditions: ["Type 2 diabetes", "High blood pressure", "Fatty liver"],
      allergies: "Sulfa medicines, rash (patient reported)",
      outside_meds: ["Telmisartan 40 mg once a day, from her cardiologist"],
      concern: "New HbA1c report. Asks whether the evening tablet can move earlier.",
      labs: [
        { id: "l2", package: "Three-month review panel", collected: at(-3, 7, 15), reported: at(-2, 16), status: "DOCTOR_REVIEW_PENDING", results: BASE_PANEL({ hba1c: 7.1, fbs: 136, ldl: 118, tg: 182, alt: 46, cr: 1.0, vitd: 34 }), comment: null, reviewed_at: null },
        { id: "l1", package: "Metabolic baseline panel", collected: at(-90, 7, 15), reported: at(-89, 16), status: "REVIEWED", results: BASE_PANEL({ hba1c: 7.9, fbs: 158, ldl: 141, tg: 236, alt: 58, cr: 1.0, vitd: 22 }), comment: "Diabetes above target, raised triglycerides and ALT consistent with fatty liver.", reviewed_at: at(-89, 18) },
      ],
      rx: [
        { id: "r3", version: 3, status: "SIGNED", date: at(-28, 19), items: [{ name: "Metformin SR", strength: "1000 mg", dose: "1 tablet", frequency: "Twice a day, with meals", duration: "90 days" }, { name: "Atorvastatin", strength: "10 mg", dose: "1 tablet", frequency: "Once a day, at night", duration: "90 days" }], advice: "Continue the walking plan; no sugar in tea." },
      ],
      visits: [
        { id: "v3", at: at(-14, 19), type: "FOLLOW_UP", summary: "Weight readings steady. Tolerating metformin. Wants an earlier dinner schedule.", plan: ["Labs at three months", "Review dinner timing with dietitian"] },
        { id: "v2", at: at(-28, 19), type: "FOLLOW_UP", summary: "Metformin increased; atorvastatin started for LDL and triglycerides.", plan: ["Prescription version 3"] },
        { id: "v1", at: at(-84, 11), type: "FIRST_CONSULTATION", summary: "Long-standing diabetes managed by a GP. BP controlled by her cardiologist.", plan: ["Baseline labs", "Diet plan"] },
      ],
      symptoms: [{ id: "s1", label: "Dizziness", severity: "Moderate", note: "Mid-morning, twice this week", at: at(-1, 11, 40), requires_review: true, acknowledged: false }],
      adherence: { taken: 13, due: 14 },
      protein_avg_g: 74,
      steps_avg: 8400,
      notes: [{ id: "n1", at: at(-14, 19, 20), text: "Travels for work twice a month; plan for doses on travel days.", by: ME.name }],
      consents: ALL_CONSENTS,
      plan: PLAN(90, "1,700", "8,000", at(14, 19), "Earlier dinner on weekdays; plan doses on travel days; no sugar in tea."),
      audit: [],
    },
    {
      id: "p_priya",
      name: "Priya Raghavan",
      age: 39,
      sex: "Female",
      city: "Bengaluru",
      mobile: "+91 97•••• 66120",
      programme: "Weight care",
      since: at(-49, 10),
      identity_verified: true,
      height_cm: 158,
      weights: series(72.4, [0, -0.4, -0.7, -1.2, -1.0, -1.6, -2.1, -2.3], 7),
      waist_cm: { at: at(-49, 10), cm: 88 },
      hba1c: [{ at: at(-46, 16), value: 5.5 }],
      conditions: ["Thyroid condition"],
      allergies: "No known medicine allergies (doctor verified)",
      outside_meds: ["Levothyroxine 50 mcg, from her endocrinologist"],
      concern: "Asks about a weekend travel plan for meals.",
      labs: [{ id: "l1", package: "Metabolic baseline panel", collected: at(-46, 7), reported: at(-45, 15), status: "REVIEWED", results: BASE_PANEL({ hba1c: 5.5, tsh: 3.1, vitd: 28 }), comment: "Thyroid controlled on current dose. Vitamin D slightly low.", reviewed_at: at(-45, 17) }],
      rx: [
        { id: "r2", version: 2, status: "DRAFT", date: at(0, 9), items: [{ name: "Vitamin D3", strength: "60,000 IU", dose: "1 sachet", frequency: "Once a month", duration: "3 months" }], advice: "Maintenance dose after the loading course." },
        { id: "r1", version: 1, status: "SIGNED", date: at(-45, 18), items: [{ name: "Vitamin D3", strength: "60,000 IU", dose: "1 sachet", frequency: "Once a week, on Sundays", duration: "6 weeks" }], advice: "Loading course." },
      ],
      visits: [{ id: "v1", at: at(-49, 10), type: "FIRST_CONSULTATION", summary: "Hypothyroid, well controlled. Desk job, irregular lunch.", plan: ["Baseline labs", "Protein at breakfast"] }],
      symptoms: [],
      adherence: { taken: 6, due: 6 },
      protein_avg_g: 68,
      steps_avg: 6100,
      notes: [],
      consents: ["Terms", "Privacy", "Health data", "Video consultation"],
      plan: PLAN(70, "1,450", "7,000", at(10, 10), "Protein at breakfast, a fixed lunch time on office days."),
      audit: [],
    },
    {
      id: "p_vikram",
      name: "Vikram Sethi",
      age: 52,
      sex: "Male",
      city: "Noida",
      mobile: "+91 98•••• 70451",
      programme: "Weight and diabetes care",
      since: at(-35, 18),
      identity_verified: true,
      height_cm: 172,
      weights: series(94.8, [0, -0.5, -0.4, -1.1, -1.4, -1.9], 7),
      waist_cm: { at: at(-35, 18), cm: 102 },
      hba1c: [{ at: at(-33, 16), value: 8.4 }],
      conditions: ["Type 2 diabetes", "High cholesterol", "Sleep apnoea"],
      allergies: null,
      outside_meds: ["Glimepiride 1 mg, from his previous doctor (not verified)"],
      concern: "Wants to stop the medicine from his previous doctor.",
      labs: [
        { id: "l2", package: "Kidney and liver check", collected: at(-1, 7), reported: new Date(Math.max(Date.parse(at(-1, 7)) + 6 * 36e5, clinicAgo(Date.now(), 40 * 6e4))).toISOString(), status: "DOCTOR_REVIEW_PENDING", results: [{ test: "Creatinine", value: 1.3, unit: "mg/dL", range: "0.6 to 1.2", flag: "HIGH" }, { test: "eGFR", value: 62, unit: "mL/min", range: "Above 90", flag: "LOW" }, { test: "ALT (SGPT)", value: 39, unit: "U/L", range: "7 to 35", flag: "HIGH" }], comment: null, reviewed_at: null },
      ],
      rx: [{ id: "r1", version: 1, status: "SIGNED", date: at(-33, 18), items: [{ name: "Metformin SR", strength: "500 mg", dose: "1 tablet", frequency: "Twice a day, with meals", duration: "60 days" }], advice: "Kidney and liver check before any dose change." }],
      visits: [{ id: "v1", at: at(-35, 18), type: "FIRST_CONSULTATION", summary: "Diabetes above target; uncertain outside medicine history.", plan: ["Verify outside medicine", "Kidney and liver check"] }],
      symptoms: [],
      adherence: { taken: 11, due: 14 },
      protein_avg_g: 52,
      steps_avg: 4300,
      notes: [],
      consents: ALL_CONSENTS,
      plan: PLAN(85, "1,800", "6,000", at(8, 18), "Verify the outside medicine before any change; walk after lunch and dinner."),
      audit: [],
    },
    {
      id: "p_meera",
      name: "Meera Iyer",
      age: 29,
      sex: "Female",
      city: "Mumbai",
      mobile: "+91 90•••• 21987",
      programme: "First consultation",
      since: null,
      identity_verified: false,
      height_cm: 161,
      weights: series(74.5, [0], 7),
      waist_cm: null,
      hba1c: [],
      conditions: ["PCOS"],
      allergies: null,
      outside_meds: null,
      concern: "From her check: irregular periods, weight gain over two years, wants to understand options.",
      screening: screened(1, { goal: "Understand her options for PCOS and her weight", tried: "Two diet plans she found online, a few months each", mentioned: "PCOS, diagnosed at 24. No regular medicines.", check: ["Hopes to start a family in about two years: talk through timing"] }),
      labs: [],
      rx: [],
      visits: [],
      symptoms: [],
      adherence: null,
      protein_avg_g: null,
      steps_avg: null,
      notes: [],
      consents: ["Terms", "Privacy", "Health data", "Video consultation", "Call transcription"],
      plan: null,
      audit: [],
    },
    {
      id: "p_arjun",
      name: "Arjun Bhatia",
      age: 41,
      sex: "Male",
      city: "Chandigarh",
      mobile: "+91 98•••• 50214",
      programme: "Weight care",
      since: at(-63, 10),
      identity_verified: true,
      height_cm: 180,
      weights: series(98, [0, -1.1, -1.6, -2.4, -2.9, -3.1, -3.8, -4.4, -4.1, -4.9], 7),
      waist_cm: { at: at(-7, 9), cm: 99 },
      hba1c: [{ at: at(-60, 16), value: 5.8 }],
      conditions: ["Prediabetes", "Fatty liver"],
      allergies: "No known medicine allergies (patient reported)",
      outside_meds: [],
      concern: "Refill due. Mild constipation last week.",
      labs: [{ id: "l1", package: "Metabolic baseline panel", collected: at(-60, 7), reported: at(-59, 15), status: "REVIEWED", results: BASE_PANEL({ hba1c: 5.8, alt: 52, tg: 190 }), comment: "Prediabetes and fatty liver pattern.", reviewed_at: at(-59, 17) }],
      rx: [{ id: "r1", version: 1, status: "SIGNED", date: at(-59, 18), items: [{ name: "Metformin SR", strength: "500 mg", dose: "1 tablet", frequency: "Once a day, after dinner", duration: "60 days" }], advice: "Walk after dinner." }],
      visits: [
        {
          id: "cn_arjun",
          note_id: "cn_arjun",
          at: callAt(3, 10),
          type: "FOLLOW_UP",
          summary: "Follow-up by video; metformin refill due. Mild constipation last week, eased with more water and fibre. Walking about 9,800 steps a day; protein close to target. Weight 93.1 kg, from 98 kg at the start.",
          assessment: "Prediabetes and fatty liver; tolerating metformin and following the plan.",
          plan: ["Metformin SR 500 mg after dinner continues, refilled on the current prescription", "Strength training twice a week: squats and a resistance band, 20 minutes", "Three-month blood tests before the next review"],
        },
        { id: "v1", at: at(-63, 10), type: "FIRST_CONSULTATION", summary: "Prediabetes on screening at work.", plan: ["Baseline labs"] },
      ],
      symptoms: [{ id: "s1", label: "Constipation", severity: "Mild", note: "", at: at(-6, 9), requires_review: false, acknowledged: true }],
      adherence: { taken: 7, due: 7 },
      protein_avg_g: 82,
      steps_avg: 9800,
      notes: [],
      consents: ALL_CONSENTS,
      plan: PLAN(95, "1,900", "9,000", at(2, 10), "Keep the walking routine; add strength twice a week."),
      audit: [],
    },
  ];
}

/* today's order: the richest records come up next. Aanya is never on today's list: her next
   visit comes from her own app, so both sides always agree. */
// Meera is not in today's upcoming list: her first consultation has just happened and its note is being written
const TODAY = ["p_arjun", "p_priya", null, "p_vikram", "p_ritu", null, null, null];

/** The counsellor who screens each new patient by phone before the first consultation. Sample name. */
export const COUNSELLOR = { name: "Anjali Mehta", role: "Counsellor" };

/**
 * The counsellor's screening call: a short phone call that checks the programme suits the patient
 * (whether a GLP-1 medicine could be right for them) and passes the basics to the doctor before
 * the first consultation. `check`: anything the doctor should ask about before prescribing.
 */
export type Screening = { by: string; at: string; minutes: number; goal: string; tried: string; mentioned: string; check: string[] };

type Screen = Pick<Screening, "goal" | "tried" | "mentioned" | "check">;
type NewPerson = { name: string; sex: Sex; age: number; city: string; h: number; w: number; cond: string[]; concern: string; screen: Screen };

/* people booked for a first consultation, with what the counsellor heard on the screening call */
const NEW: NewPerson[] = [
  { name: "Kavya Nair", sex: "Female", age: 36, city: "Kochi", h: 158, w: 76, cond: ["PCOS"], concern: "Weight gain since her second child; wants a plan that fits night shifts.", screen: { goal: "Lose 8 to 10 kg and have more energy on night shifts", tried: "A calorie-counting app twice, a few weeks each time", mentioned: "PCOS. No regular medicines.", check: ["Second child is 14 months old: ask whether she is still breastfeeding"] } },
  { name: "Siddharth Rao", sex: "Male", age: 44, city: "Hyderabad", h: 174, w: 96, cond: ["Prediabetes", "High blood pressure"], concern: "Sugar flagged at an office health check.", screen: { goal: "Bring his sugar back to normal and lose about 10 kg", tried: "A gym membership last year, for two months", mentioned: "Amlodipine 5 mg for blood pressure, from his GP", check: [] } },
  { name: "Ishita Chawla", sex: "Female", age: 31, city: "New Delhi", h: 163, w: 81, cond: [], concern: "Several diets that did not last; wants a doctor's view.", screen: { goal: "Something that lasts longer than a few months", tried: "Keto, intermittent fasting and a meal-replacement plan", mentioned: "No conditions, no regular medicines", check: ["Planning a pregnancy next year: talk through timing"] } },
  { name: "Farhan Qureshi", sex: "Male", age: 49, city: "Lucknow", h: 170, w: 92, cond: ["Type 2 diabetes"], concern: "Diabetes for six years; HbA1c rising despite medicine.", screen: { goal: "HbA1c under 7 and fewer tablets", tried: "Diet advice from his diabetologist", mentioned: "Metformin 1000 mg twice a day and glimepiride 2 mg", check: ["On glimepiride: low sugars are more likely if a GLP-1 medicine is added"] } },
  { name: "Neha Agarwal", sex: "Female", age: 42, city: "Jaipur", h: 156, w: 74, cond: ["Thyroid condition"], concern: "Tired most days; weight up 8 kg in two years.", screen: { goal: "Feel less tired and lose the 8 kg", tried: "A walking group, and a dietitian two years ago", mentioned: "Thyroxine 75 mcg. Last thyroid test more than a year ago.", check: ["Thyroid test is overdue"] } },
  { name: "Karan Gill", sex: "Male", age: 38, city: "Mohali", h: 181, w: 104, cond: ["Sleep apnoea"], concern: "Snoring and daytime sleepiness; his wife booked the check.", screen: { goal: "Stop snoring and lose about 15 kg", tried: "Nothing structured", mentioned: "Loud snoring and daytime sleepiness. No sleep study yet. No medicines.", check: ["No sleep study yet"] } },
  { name: "Tanvi Deshpande", sex: "Female", age: 27, city: "Pune", h: 160, w: 70, cond: ["PCOS"], concern: "Irregular periods; her gynaecologist suggested weight care.", screen: { goal: "Regular periods and steady weight loss", tried: "Inositol from her gynaecologist, and a low-carb diet", mentioned: "PCOS, on inositol", check: ["Not trying for a baby now: confirm contraception before any GLP-1 medicine"] } },
  { name: "Rahul Verma", sex: "Male", age: 55, city: "Gurugram", h: 168, w: 88, cond: ["Type 2 diabetes", "High cholesterol"], concern: "Wants to bring his sugar under control before knee surgery.", screen: { goal: "Sugar under control before knee surgery in about three months", tried: "His metformin was increased last year", mentioned: "Metformin 500 mg twice a day and atorvastatin 20 mg", check: ["Knee surgery planned: a GLP-1 medicine may need a pause before the anaesthetic"] } },
  { name: "Pooja Menon", sex: "Female", age: 33, city: "Bengaluru", h: 165, w: 79, cond: ["Fatty liver"], concern: "Fatty liver on an ultrasound; asked what to change.", screen: { goal: "Reverse the fatty liver", tried: "No sugar for a month", mentioned: "Fatty liver on an ultrasound. No medicines. Drinks socially, about twice a month.", check: [] } },
  { name: "Aditya Joshi", sex: "Male", age: 29, city: "Mumbai", h: 177, w: 99, cond: [], concern: "Gained weight working from home; wants structure.", screen: { goal: "Lose the 12 kg he gained working from home", tried: "Home workouts, on and off", mentioned: "No conditions, no medicines", check: [] } },
  { name: "Sana Sheikh", sex: "Female", age: 40, city: "Bhopal", h: 157, w: 77, cond: ["Prediabetes"], concern: "Mother has diabetes; wants to avoid it.", screen: { goal: "Stay clear of diabetes; her mother has it", tried: "A walk after dinner, on and off", mentioned: "Prediabetes on a test six months ago. No medicines.", check: ["Gallbladder pain last year, not operated on"] } },
  { name: "Varun Khanna", sex: "Male", age: 47, city: "Noida", h: 172, w: 94, cond: ["High blood pressure", "Fatty liver"], concern: "Blood pressure medicine for two years; wants to lose the weight behind it.", screen: { goal: "Lose weight and come off blood pressure medicine", tried: "Two diet apps", mentioned: "Telmisartan 40 mg once a day", check: ["Says he had pancreatitis in 2019: get the details"] } },
];

/* more people for the rest of the month: the same kinds of story, different people */
const FIRSTS = { Female: ["Aditi", "Shreya", "Nandini", "Divya", "Kritika", "Megha", "Swati", "Anusha", "Prerna", "Lavanya", "Radhika", "Simran"], Male: ["Rohan", "Amit", "Nikhil", "Harsh", "Kunal", "Manish", "Pranav", "Suresh", "Gaurav", "Vivek", "Imran", "Deepak"] };
const LASTS = ["Bose", "Kulkarni", "Reddy", "Saxena", "Pillai", "Bhatt", "Das", "Chopra", "Nambiar", "Thakur", "Banerjee", "Hegde", "Sinha"];
const CITIES = ["Pune", "Chennai", "Kolkata", "Indore", "Ahmedabad", "Surat", "Nagpur", "Dehradun", "Mysuru", "Vadodara", "Kanpur", "Thane"];
function person(k: number): NewPerson {
  if (k < NEW.length) return NEW[k];
  const t = NEW[k % NEW.length];
  const r = (x: number) => rand(k * 17 + x);
  return { ...t, name: `${FIRSTS[t.sex][Math.floor(r(1) * 12)]} ${LASTS[Math.floor(r(2) * LASTS.length)]}`, age: t.age + Math.floor(r(3) * 9) - 4, city: CITIES[Math.floor(r(4) * CITIES.length)], h: t.h + Math.floor(r(5) * 7) - 3, w: t.w + Math.floor(r(6) * 9) - 4 };
}
/** The screening call, a few working days before the consultation. */
const screened = (k: number, s: Screen): Screening => ({ by: COUNSELLOR.name, at: callAt(2 + (k % 3), 10 + (k % 8), (k * 7) % 4 * 15), minutes: 12 + (k % 4) * 2, ...s });

/** A first-consultation patient's record: what their free check and the counsellor's call told us, nothing assumed. */
export function intake(id: string): Patient | null {
  const m = /^n_(\d+)$/.exec(id);
  const n = m ? person(Number(m[1])) : undefined;
  if (!n) return null;
  return {
    id,
    name: n.name,
    age: n.age,
    sex: n.sex,
    city: n.city,
    mobile: "+91 9•••• •••••",
    programme: "First consultation",
    since: null,
    identity_verified: false,
    height_cm: n.h,
    weights: [{ at: at(-3, 20), kg: n.w, source: "Profile" }],
    waist_cm: null,
    hba1c: [],
    conditions: n.cond,
    allergies: null,
    outside_meds: null,
    concern: n.concern,
    screening: screened(Number(m![1]), n.screen),
    labs: [],
    rx: [],
    visits: [],
    symptoms: [],
    adherence: null,
    protein_avg_g: null,
    steps_avg: null,
    notes: [],
    consents: ["Terms", "Privacy", "Health data", "Video consultation"],
    plan: null,
    audit: [],
  };
}

/** What changed since the last consultation: the doctor's first question. */
export function sinceLast(p: Patient) {
  const last = [...p.visits].sort((a, b) => b.at.localeCompare(a.at))[0];
  if (!last) return null;
  const before = [...p.weights].filter((w) => w.at <= last.at).at(-1) ?? p.weights[0];
  const now = p.weights.at(-1);
  const newLab = p.labs.find((l) => (l.reported ?? "") > last.at);
  const newSym = p.symptoms.find((s) => s.at > last.at && s.requires_review);
  const hb = newLab?.results.find((r) => r.test === "HbA1c");
  const hbBefore = p.labs.find((l) => l !== newLab && l.results.some((r) => r.test === "HbA1c"))?.results.find((r) => r.test === "HbA1c");
  return {
    at: last.at,
    weight: before && now && now !== before ? Math.round((now.kg - before.kg) * 10) / 10 : null,
    adherence: p.adherence,
    news: newSym ? `${newSym.label}, ${newSym.severity.toLowerCase()}` : hb ? `HbA1c ${hb.value}%${hbBefore ? `, was ${hbBefore.value}%` : ""}` : newLab ? `${newLab.package} ready` : null,
  };
}

const sameDate = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
/** One way to say when, across the portal: "12 min ago", "3 h ago", "Yesterday", then "27 Sep". Relative only within two days. */
export function ago(t: number | string, now: number) {
  const ms = typeof t === "string" ? Date.parse(t) : t;
  const mins = Math.max(1, Math.round((now - ms) / 6e4));
  if (mins < 60) return `${mins} min ago`;
  if (sameDate(ms, now)) return `${Math.round(mins / 60)} h ago`;
  if (sameDate(ms, now - DAY)) return "Yesterday";
  return short(new Date(ms).toISOString());
}

export const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function rand(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const SLOTS = [[9, 30], [10, 0], [10, 30], [11, 15], [12, 0], [14, 30], [15, 0], [16, 0], [17, 30], [18, 0], [18, 30], [19, 0]] as const;

/** Whether the patient's record has a visit or a doctor's note from today. */
const seenToday = (p: Patient, t: Date) => [...p.visits.map((v) => v.at), ...p.notes.map((n) => n.at)].some((x) => new Date(x).toDateString() === t.toDateString());

/**
 * Today's eight slots, indexed like TODAY. Before the clinic opens they are the ordinary day. In
 * clinic hours the day sits around now: only the new patient at index 2 is already past (and did not
 * join), everyone else is still to come, spaced so each call starts by 7:30 pm and ends by 8 pm,
 * clear of the lunch hour;
 * late in the day the ones that no longer fit are left off. After the last start nothing is left
 * today, and the next working day leads. A slot is never "done" by the clock alone.
 */
function todaySlots(t: Date): (Date | null)[] {
  const day = (h: number, m: number) => new Date(t.getFullYear(), t.getMonth(), t.getDate(), h, m);
  const mins = t.getHours() * 60 + t.getMinutes();
  if (mins < OPEN_HOUR * 60) return [0, 1, 3, 4, 5, 7, 9, 10].map((i) => day(SLOTS[i][0], SLOTS[i][1]));
  const last = day(CLOSE_HOUR - 1, 30).getTime();
  const base = new Date(t);
  base.setMinutes(base.getMinutes() < 30 ? 0 : 30, 0, 0);
  const first = base.getTime() + 20 * 6e4;
  if (first > last) return [];
  // the one call already behind the doctor, ended at least ten minutes ago, never before opening
  const missed = base.getTime() - 40 * 6e4;
  const past = missed >= day(OPEN_HOUR, 0).getTime();
  const ahead = past ? 7 : 8;
  // 45 minutes apart where the afternoon allows, 30 at the closest
  const gap = Math.max(30, Math.min(45, Math.floor((last - first) / 6e4 / Math.max(1, ahead - 1) / 5) * 5)) * 6e4;
  // no call runs into the doctors' lunch hour, 1 to 2 pm
  const lunch = [day(13, 0).getTime(), day(14, 0).getTime()];
  const future: (Date | null)[] = [];
  for (let i = 0, x = first; i < ahead; i++, x += gap) {
    if (x + 30 * 6e4 > lunch[0] && x < lunch[1]) x = lunch[1];
    future.push(x <= last ? new Date(x) : null);
  }
  return past ? [future[0], future[1], new Date(missed), ...future.slice(2)] : future;
}

/**
 * The doctor's diary for a month: today in full, other days from a stable pattern. Each patient
 * under care has a follow-up about once a fortnight; every other slot is a first consultation
 * with someone new, so no one has a first consultation twice.
 */
export function diary(patients: Patient[], monthOffset = 0): Appt[] {
  const t = now0();
  const first = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const out: Appt[] = [];
  const others = patients.filter((p) => p.id !== "p_aanya");
  const underCare = others.filter((p) => p.since);
  const aanya = patients.find((p) => p.id === "p_aanya");
  const status = (start: number, noShow: boolean): ApptStatus =>
    start + 30 * 6e4 < t.getTime() ? (noShow ? "NO_SHOW" : "COMPLETED") : start <= t.getTime() ? "IN_PROGRESS" : "BOOKED";
  // new people for this month, numbered after the named ones (which today's list uses)
  let k = NEW.length + ((first.getFullYear() * 12 + first.getMonth()) % 12) * 80;
  for (let dnum = 1; dnum <= days; dnum++) {
    const date = new Date(first.getFullYear(), first.getMonth(), dnum);
    if (date.getDay() === 0) continue; // Sundays closed
    const isToday = date.toDateString() === t.toDateString();
    const count = date.getDay() === 6 ? 2 + Math.floor(rand(dnum) * 2) : 3 + Math.floor(rand(dnum + 40) * 3);
    const times: (Date | null)[] = isToday ? todaySlots(t) : SLOTS.filter((_, i) => rand(dnum * 13 + i) < (count + 1) / SLOTS.length).slice(0, count).map(([h, m]) => new Date(date.getFullYear(), date.getMonth(), dnum, h, m));
    // who is due a fortnightly follow-up on this day
    const due = isToday ? [] : underCare.filter((_, pi) => (dnum + pi * 3) % 14 === 0);
    times.forEach((when, i) => {
      if (!when) return;
      const known = isToday ? (others.find((p) => p.id === TODAY[i]) ?? null) : (due[i] ?? null);
      const n = known ? null : isToday ? (dnum * 3 + i) % NEW.length : k++;
      const who = n === null ? null : person(n);
      out.push({
        id: `a_${dnum}_${i}`,
        patient_id: known?.id ?? `n_${n}`,
        name: known?.name ?? who!.name,
        at: when.toISOString(),
        duration: 30,
        type: known?.since ? "FOLLOW_UP" : "FIRST_CONSULTATION",
        // today, a call that has ended counts as done only when the patient's record shows it
        status: isToday && when.getTime() + 30 * 6e4 < t.getTime() ? (known && seenToday(known, t) ? "COMPLETED" : "NO_SHOW") : status(when.getTime(), isToday ? i === 2 : rand(dnum * 3 + i) < 0.06),
        reason: known ? known.concern : who!.concern,
      });
    });
  }
  // Aanya's follow-up, at the time her own app shows
  if (aanya?.next_at) {
    const a = new Date(aanya.next_at);
    if (a.getFullYear() === first.getFullYear() && a.getMonth() === first.getMonth()) {
      out.push({ id: "a_aanya", patient_id: aanya.id, name: aanya.name, at: a.toISOString(), duration: 30, type: aanya.since ? "FOLLOW_UP" : "FIRST_CONSULTATION", status: status(a.getTime(), false), reason: aanya.concern });
    }
  }
  return out.sort((x, y) => x.at.localeCompare(y.at));
}

/* ---------- store: the doctor's changes, kept in this browser ---------- */

const KEY = "medistry-clinic-demo-v6";
const APP_KEY = "medistry-account-demo";
let state: Patient[] | null = null;
let version = 0;
let cache: { v: number; data: Patient[] } | null = null;
const listeners = new Set<() => void>();
const bump = () => {
  version++;
  listeners.forEach((f) => f());
};

function load(): Patient[] {
  if (state) return state;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as { day: string; patients: Patient[] } | null;
    // sample dates are relative to the day they were made; start fresh on a new day
    state = raw && raw.day === new Date().toDateString() ? raw.patients : seed();
  } catch {
    state = seed();
  }
  return state;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: new Date().toDateString(), patients: state }));
  } catch {
    // not kept; still works for this visit
  }
  bump();
}

type AppRecord = {
  session?: { user_id: string } | null;
  profiles?: Record<string, { first_name: string; last_name: string; age_years: number | null; gender: string | null; height_cm: number | null }>;
  weights?: Record<string, { weight_kg: number; logged_at: string; source: string }[]>;
  conditions?: Record<string, { code: string; other_text?: string }[] | null>;
  appointments?: Record<string, { scheduled_at: string; status: string }[]>;
  care?: Record<
    string,
    {
      medication?: { item: string; status: string; scheduled_for: string; at: string; site?: string; dose?: string }[];
      prescriptions?: { id: string; version: number; status: Rx["status"]; signed_at: string | null; advice: string[]; items: { medicine_name: string; generic?: string; strength: string; dose: string; form: string; frequency: string; duration: string }[] }[];
      consultations?: { id: string; at: string; type: VisitType; summary: string; next_steps: string[] }[];
      labs?: { id: string; package: string; slot_at: string; status: string; report_date: string | null; doctor_comment: string | null; results: Result[] }[];
      programme?: { start_at: string };
      stage?: number;
      next: { at: string } | null;
      symptoms: { id: string; label: string; severity: Symptom["severity"]; note: string; logged_at: string; requires_review: boolean }[];
    }
  >;
};

/**
 * The patient on this device and Aanya's record are the same person in the prototype: her next
 * visit, readings and flagged symptoms come from her app, so the two sides never disagree.
 */
function linkApp(list: Patient[]): Patient[] {
  let app: AppRecord | null = null;
  try {
    app = JSON.parse(localStorage.getItem(APP_KEY) ?? "null");
  } catch {
    app = null;
  }
  const uid = app?.session?.user_id;
  const care = uid ? app?.care?.[uid] : undefined;
  return list.map((p) => {
    if (p.id !== "p_aanya") return p;
    const fallback = at(7, 18, 30);
    if (!uid) return { ...p, next_at: p.next_at ?? fallback };
    // signed up but not yet seen: a first-consultation record, from the onboarding answers only
    if (!care) {
      const prof0 = app!.profiles?.[uid];
      const appt = (app!.appointments?.[uid] ?? []).find((x) => x.status === "BOOKED");
      const ans = app!.conditions?.[uid];
      const w0 = (app!.weights?.[uid] ?? []).map((w) => ({ at: w.logged_at, kg: w.weight_kg, source: "Profile" as const }));
      return {
        ...p,
        name: prof0 ? [prof0.first_name, prof0.last_name].filter(Boolean).join(" ") || p.name : p.name,
        programme: "First consultation",
        since: null,
        concern: "First consultation. Everything below is from the patient's onboarding answers.",
        screening: screened(0, { goal: "Lose weight, and stop the evening snacking after late dinners on workdays", tried: "Two diet apps, about a year each", mentioned: "PCOS. Prediabetes on a work health check. No regular medicines.", check: [] }),
        conditions: ans ? ans.map((c) => (c.code === "OTHER" ? (c.other_text ?? "Other") : (CONDITIONS.find((m) => m.code === c.code)?.label ?? c.code))) : [],
        weights: w0.length ? w0 : p.weights.slice(0, 1),
        rx: [],
        visits: [],
        labs: [],
        hba1c: [],
        symptoms: [],
        plan: null,
        adherence: null,
        injections: null,
        protein_avg_g: null,
        steps_avg: null,
        next_at: appt?.scheduled_at ?? null,
      };
    }
    const prof = app!.profiles?.[uid];
    const ws = (app!.weights?.[uid] ?? []).map((w) => ({ at: w.logged_at, kg: w.weight_kg, source: (w.source === "ONBOARDING" ? "Profile" : "Patient logged") as "Profile" | "Patient logged" }));
    const known = new Set(p.symptoms.map((s) => s.id));
    const fromApp: Symptom[] = care.symptoms.filter((s) => !known.has(s.id)).map((s) => ({ id: s.id, label: s.label, severity: s.severity, note: s.note, at: s.logged_at, requires_review: s.requires_review, acknowledged: false }));
    const pen = care.prescriptions?.find((r) => r.status === "SIGNED")?.items.find((i) => i.form === "PEN");
    const shots = pen ? (care.medication ?? []).filter((m) => m.item === pen.medicine_name && m.status === "TAKEN" && (!m.dose || m.dose === pen.strength)) : [];
    const SITE_NAMES: Record<string, string> = { ABD_L: "left tummy", ABD_R: "right tummy", THIGH_L: "left thigh", THIGH_R: "right thigh", ARM_L: "left upper arm", ARM_R: "right upper arm" };
    const today = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(new Date());
    const injections = pen
      ? { name: pen.medicine_name, strength: pen.strength, taken: shots.length, per_step: 4, last_at: shots[0]?.at ?? null, last_site: shots[0]?.site ? SITE_NAMES[shots[0].site] : null, due_today: pen.frequency.includes(today) && !shots.some((m) => new Date(m.scheduled_for).toDateString() === new Date().toDateString()) }
      : null;
    // the daily tablet's record; the weekly pen has its own line
    const meds = [...(care.medication ?? [])].filter((m) => !pen || m.item !== pen.medicine_name).sort((x, y) => y.scheduled_for.localeCompare(x.scheduled_for)).slice(0, 7);
    const answered = app!.conditions?.[uid];
    const firstSeen = care.consultations?.filter((v) => v.type === "FIRST_CONSULTATION").sort((x, y) => x.at.localeCompare(y.at))[0]?.at ?? null;
    return {
      ...p,
      conditions: answered ? answered.map((c) => (c.code === "OTHER" ? (c.other_text ?? "Other") : (CONDITIONS.find((m) => m.code === c.code)?.label ?? c.code))) : p.conditions,
      adherence: meds.length ? { taken: meds.filter((m) => m.status === "TAKEN").length, due: meds.length } : p.adherence,
      injections,
      // the record follows the patient's own: visits, prescriptions and reports as far as care has got
      since: care.programme?.start_at ?? p.since,
      // the plan is set at the second consultation, once results are in, and is next reviewed at her next visit
      plan: care.stage === 1 || !p.plan ? null : { ...p.plan, review: care.next?.at ?? p.plan.review },
      // allergies were asked at her first consultation, whenever the app's record puts it
      allergies: firstSeen && p.allergies?.startsWith("No known medicine allergies (asked") ? `No known medicine allergies (asked ${short(firstSeen)})` : p.allergies,
      // a visit from a signed call note keeps the clinic's wording; the app holds the patient's
      visits: care.consultations ? care.consultations.map((v) => p.visits.find((x) => x.note_id === v.id) ?? { id: v.id, at: v.at, type: v.type, summary: v.summary, plan: v.next_steps }) : p.visits,
      rx: care.prescriptions
        ? care.prescriptions.map((r) => ({
            id: r.id,
            version: r.version,
            status: r.status,
            date: r.signed_at ?? new Date().toISOString(),
            items: r.items.map((i) => ({ name: i.generic ? `${i.generic} (${i.medicine_name})` : i.medicine_name, strength: i.strength, dose: i.dose, frequency: i.frequency, duration: i.duration })),
            advice: r.advice.join(". "),
          }))
        : p.rx,
      labs: care.labs
        ? care.labs
            .filter((l) => ["SAMPLE_COLLECTED", "PROCESSING", "REPORT_READY", "DOCTOR_REVIEW_PENDING", "REVIEWED"].includes(l.status))
            .map((l) => ({ id: l.id, package: l.package, collected: l.slot_at, reported: l.report_date, status: (l.status === "REVIEWED" ? "REVIEWED" : l.report_date ? "DOCTOR_REVIEW_PENDING" : "PROCESSING") as Lab["status"], results: l.results, comment: l.doctor_comment, reviewed_at: l.status === "REVIEWED" ? l.report_date : null }))
        : p.labs,
      hba1c: care.labs ? care.labs.flatMap((l) => l.results.filter((r) => r.test === "HbA1c").map((r) => ({ at: l.report_date ?? l.slot_at, value: r.value }))) : p.hba1c,
      name: prof ? [prof.first_name, prof.last_name].filter(Boolean).join(" ") || p.name : p.name,
      age: prof?.age_years ?? p.age,
      sex: prof?.gender === "male" ? "Male" : "Female",
      height_cm: prof?.height_cm ?? p.height_cm,
      weights: ws.length > 1 ? ws : p.weights,
      symptoms: [...fromApp, ...p.symptoms].sort((x, y) => y.at.localeCompare(x.at)),
      next_at: care.next?.at ?? null,
    };
  });
}

/** Any record by id: someone under care, or a first-consultation patient from the diary. */
export const findPatient = (list: Patient[], id: string | null) => (id ? (list.find((p) => p.id === id) ?? intake(id) ?? undefined) : undefined);

/** The patient list and every record, re-read after each change. Null on the server. */
function subscribe(f: () => void) {
  listeners.add(f);
  const onStorage = (e: StorageEvent) => {
    if (e.key === APP_KEY || e.key === KEY) bump();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(f);
    window.removeEventListener("storage", onStorage);
  };
}
export function useClinic(): Patient[] | null {
  const v = useSyncExternalStore(
    subscribe,
    () => version,
    () => -1,
  );
  return v === -1 ? null : current(v);
}
function current(v: number) {
  if (!cache || cache.v !== v) cache = { v, data: linkApp(load()) };
  return cache.data;
}

/** Re-read the patient app's side when the portal opens, in case it changed in this tab. */
export const refreshClinic = bump;

export function resetClinic() {
  state = seed();
  save();
}

function edit(id: string, fn: (p: Patient) => void, action: string, create = true) {
  let p = load().find((x) => x.id === id);
  // a first-consultation patient joins the list once the doctor writes something in their record
  if (!p && create) {
    const n = intake(id);
    if (n) {
      state!.push(n);
      p = n;
    }
  }
  if (!p) return;
  fn(p);
  p.audit = [{ at: new Date().toISOString(), action: `${action}, ${ME.name}` }, ...p.audit];
  save();
}

/** Lab review: only the treating doctor marks a report reviewed, with a note the patient sees. */
export const reviewLab = (pid: string, lid: string, comment: string) =>
  edit(
    pid,
    (p) => {
      const l = p.labs.find((x) => x.id === lid);
      if (l) Object.assign(l, { status: "REVIEWED", comment: comment.trim() || null, reviewed_at: new Date().toISOString() });
    },
    "Reviewed a lab report",
  );

/** POST /api/v1/doctor/prescriptions/:id/finalise: the draft becomes the signed version. */
export const signRx = (pid: string, rid: string) =>
  edit(
    pid,
    (p) => {
      p.rx = p.rx.map((r) => (r.id === rid ? { ...r, status: "SIGNED", date: new Date().toISOString() } : r.status === "SIGNED" ? { ...r, status: "SUPERSEDED" } : r));
    },
    "Signed a prescription",
  );

/** Acknowledging a flagged symptom records what the doctor did about it. */
/** Undo a mistaken acknowledgement; the audit trail keeps both entries. */
export const unacknowledgeSymptom = (pid: string, sid: string) =>
  edit(
    pid,
    (p) => {
      const s = p.symptoms.find((x) => x.id === sid);
      if (s) s.acknowledged = false;
    },
    "Undid an acknowledgement",
  );

export const acknowledgeSymptom = (pid: string, sid: string, outcome: string) => {
  const merged = cache?.data.find((x) => x.id === pid)?.symptoms.find((x) => x.id === sid);
  edit(
    pid,
    (p) => {
      const s = p.symptoms.find((x) => x.id === sid);
      if (s) s.acknowledged = true;
      else if (merged) p.symptoms = [{ ...merged, acknowledged: true }, ...p.symptoms];
    },
    `Acknowledged ${merged?.label.toLowerCase() ?? "a flagged symptom"}: ${outcome.toLowerCase()}`,
  );
};

/** Opening a record is itself logged, as the handover's audit rule asks. */
export const logView = (pid: string) => edit(pid, () => {}, "Opened the record", false);
/** Progress photos are shown one deliberate click at a time, and each viewing is on the record. */
export const logPhotoView = (pid: string) => edit(pid, () => {}, "Viewed the progress photos", false);

export const addNote = (pid: string, text: string) =>
  edit(
    pid,
    (p) => {
      p.notes = [{ id: `n${Date.now()}`, at: new Date().toISOString(), text: text.trim(), by: ME.name }, ...p.notes];
    },
    "Added a private note",
  );

export type QueueItem = { kind: "lab" | "rx" | "symptom" | "note" | "message"; patient: Patient; id: string; title: string; detail: string; at: string; severity?: Symptom["severity"]; urgent?: boolean };
/** A patient's messages waiting on the doctor, from inbox.ts's openForYou(). */
export type OpenMessages = { pid: string; first: { at: number; text: string }; count: number; urgent: boolean };

/** A deep copy of the stored record, to put back if the doctor undoes signing a call note. */
export const snapshotPatient = (pid: string): Patient | null => {
  const p = load().find((x) => x.id === pid);
  return p ? structuredClone(p) : null;
};
/** Puts a record back as it was; the audit keeps every entry since, and says so. */
export function restorePatient(pid: string, snap: Patient, action: string) {
  const list = load();
  const i = list.findIndex((x) => x.id === pid);
  if (i < 0) return;
  const audit = list[i].audit;
  list[i] = structuredClone(snap);
  list[i].audit = [{ at: new Date().toISOString(), action: `${action}, ${ME.name}` }, ...audit];
  save();
}

export type CallNotePayload = {
  visit: Visit;
  rx: { action: "START" | "CHANGE" | "STOP"; name: string; strength: string; detail: string }[];
  advice: string;
  updates: { field: "allergies" | "identity_verified" | "outside_meds"; to: string }[];
};
const drug = (name: string) => name.replace(/ \(.*\)/, "").split(" ")[0].toLowerCase();

/**
 * A signed call note, in the record: the visit, any record updates, open flagged symptoms marked
 * discussed, and medicine changes as a new DRAFT prescription for the doctor to sign separately.
 * The note itself never signs a prescription.
 */
export function recordCallNote(pid: string, x: CallNotePayload): { rx_id: string | null; rx_version: number | null } {
  let out: { rx_id: string | null; rx_version: number | null } = { rx_id: null, rx_version: null };
  const merged = cache?.data.find((p) => p.id === pid);
  edit(
    pid,
    (p) => {
      p.visits = [x.visit, ...p.visits.filter((v) => v.id !== x.visit.id)];
      if (x.rx.length) {
        const rxs = merged?.rx ?? p.rx;
        const signed = rxs.find((r) => r.status === "SIGNED");
        let items: RxItem[] = structuredClone(signed?.items ?? []);
        for (const c of x.rx) {
          const i = items.findIndex((it) => drug(it.name) === drug(c.name));
          // "1 tablet twice a day: ..." keeps the dose in its own field
          const frequency = c.detail.replace(/^1 tablet,?\s*/i, "").replace(/^./, (ch) => ch.toUpperCase());
          if (c.action === "STOP") items = items.filter((_, j) => j !== i);
          else if (c.action === "CHANGE" && i >= 0) items[i] = { ...items[i], strength: c.strength, frequency };
          else items.push({ name: c.name, strength: c.strength, dose: "1 tablet", frequency, duration: "Until the next review" });
        }
        const version = Math.max(0, ...rxs.map((r) => r.version)) + 1;
        const id = `r${Date.now()}`;
        p.rx = [{ id, version, status: "DRAFT", date: new Date().toISOString(), items, advice: x.advice }, ...p.rx];
        out = { rx_id: id, rx_version: version };
      }
      for (const u of x.updates) {
        if (u.field === "allergies") p.allergies = u.to;
        if (u.field === "identity_verified") p.identity_verified = true;
        if (u.field === "outside_meds") {
          const list = p.outside_meds ?? [];
          const i = list.findIndex((m) => drug(m) === drug(u.to));
          p.outside_meds = i >= 0 ? list.map((m, j) => (j === i ? u.to : m)) : [...list, u.to];
        }
      }
      // flagged symptoms were talked through on the call; the same merge as acknowledgeSymptom
      for (const s of merged?.symptoms ?? p.symptoms) {
        if (!s.requires_review || s.acknowledged) continue;
        const own = p.symptoms.find((y) => y.id === s.id);
        if (own) own.acknowledged = true;
        else p.symptoms = [{ ...s, acknowledged: true }, ...p.symptoms];
        p.audit = [{ at: new Date().toISOString(), action: `Acknowledged ${s.label.toLowerCase()}: discussed on the call, ${ME.name}` }, ...p.audit];
      }
    },
    "Signed a call note",
  );
  return out;
}

/**
 * Everything waiting on the doctor, one list: flagged symptoms (severe first), urgent messages,
 * reports, other messages, call notes once the scribe has written them, then drafts to sign.
 * Oldest first within each.
 */
export function queue(patients: Patient[], notes: CallNote[] = [], now = Date.now(), messages: OpenMessages[] = []) {
  const q: QueueItem[] = [];
  for (const n of notes) {
    const p = patients.find((x) => x.id === n.pid);
    if (!p || n.status !== "DRAFT" || now < Date.parse(n.ready_at)) continue;
    const flags = n.sections.flatMap((s) => s.cur).filter((x) => x.flag && !x.flag.resolved).length;
    const empty = n.sections.some((s) => (s.key === "summary" || s.key === "plan") && !s.cur.length);
    q.push({ kind: "note", patient: p, id: n.id, title: "Call note to sign", detail: `${n.type === "FIRST_CONSULTATION" ? "First consultation" : "Follow-up"}, ${short(n.call_at)} · ${flags ? `${flags} to check` : empty ? "to write" : "ready"}`, at: n.call_at });
  }
  for (const m of messages) {
    const p = patients.find((x) => x.id === m.pid);
    if (!p) continue;
    q.push({ kind: "message", patient: p, id: `msg-${m.pid}`, title: m.urgent ? "Urgent message" : m.count > 1 ? `${m.count} messages for you` : "Message for you", detail: m.first.text || "Photo", at: new Date(m.first.at).toISOString(), urgent: m.urgent });
  }
  for (const p of patients) {
    for (const l of p.labs) if (l.status === "DOCTOR_REVIEW_PENDING") q.push({ kind: "lab", patient: p, id: l.id, title: `${l.package} ready`, detail: `${l.results.filter((r) => r.flag !== "NORMAL").length} results outside range`, at: l.reported ?? l.collected });
    for (const r of p.rx) if (r.status === "DRAFT") q.push({ kind: "rx", patient: p, id: r.id, title: `Prescription version ${r.version} to sign`, detail: r.items.map((i) => `${i.name} ${i.strength}`).join(", "), at: r.date });
    for (const s of p.symptoms) if (s.requires_review && !s.acknowledged) q.push({ kind: "symptom", patient: p, id: s.id, title: `${s.label}, ${s.severity.toLowerCase()}`, detail: s.note || "Logged by the patient", at: s.at, severity: s.severity });
  }
  return q.sort((a, b) => rankOf(a) - rankOf(b) || a.at.localeCompare(b.at));
}
/* safety first: a severe symptom outranks everything, an urgent message sits with the symptoms */
const SEVERITY = { Severe: 0, Moderate: 1, Mild: 2 } as const;
export const rankOf = (i: QueueItem) =>
  i.kind === "symptom" ? SEVERITY[i.severity ?? "Mild"] : i.kind === "message" && i.urgent ? 2.5 : ({ lab: 3, message: 4, note: 5, rx: 6 } as const)[i.kind as "lab" | "message" | "note" | "rx"];

export type QueueGroup = { patient: Patient; items: QueueItem[]; top: QueueItem };
/** The queue as one row per patient, in the order of each patient's most pressing item. */
export function byPatient(q: QueueItem[]): QueueGroup[] {
  const m = new Map<string, QueueItem[]>();
  for (const i of q) m.set(i.patient.id, [...(m.get(i.patient.id) ?? []), i]);
  return [...m.values()].map((items) => ({ patient: items[0].patient, items, top: items[0] }));
}

/** Where a queue item opens, with `from` so the record's back link returns to the queue. */
export const itemHref = (i: QueueItem, from = "today") =>
  i.kind === "note" ? `/clinician/notes/${i.id}` : i.kind === "message" ? `/clinician/messages?p=${i.patient.id}` : `/clinician/patients/${i.patient.id}?from=${from}${i.kind === "lab" ? "#labs" : i.kind === "rx" ? "#prescriptions" : i.kind === "symptom" ? "#flagged" : ""}`;

export const bmi = (p: Patient) => {
  const w = p.weights.at(-1)?.kg;
  return w ? Math.round((w / (p.height_cm / 100) ** 2) * 10) / 10 : null;
};

export const careWeek = (p: Patient) => (p.since ? Math.max(1, Math.ceil((Date.now() - new Date(p.since).getTime()) / (7 * DAY))) : null);

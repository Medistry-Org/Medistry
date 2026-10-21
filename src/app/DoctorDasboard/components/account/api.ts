"use client";

import { useSyncExternalStore } from "react";
import { CONDITIONS, EXPERIENCES, REQUIRED_CONSENTS, type ConsentType } from "./config";
import { seedPhotos } from "./photo-store";
import { CARE_SCHEMA, LAB_PACKETS, sampleCare, sampleWeights, SYMPTOMS, type CareRecord, type CheckIn, type LabPacket, type LabReport, type Stage, type MedicationLog, type SymptomLog } from "./care";
import { CLOSE_HOUR, OPEN_HOUR } from "./clinic-time";

/*
  The account prototype's backend, running in the browser.

  Every function here stands for one endpoint in the backend handover (v1.0, Sep 2026) and returns
  the same envelope: { success, data, message, error }, with stable error codes the screens branch
  on. Replacing this file with fetch calls to /api/v1/... is the whole integration; no screen reads
  storage directly. Data lives in this browser only and never leaves the device.

  Rules kept from the handover:
  - the user id is permanent; the mobile number is only a lookup
  - OTP: 4 digits, resend after 30 s, expires after 5 minutes, limited attempts
  - each onboarding step is saved the moment it is answered, so an unfinished profile resumes
  - height in cm and weight in kg only; BMI is worked out here, never by a screen
  - "None of the above" is an answer on screen, never stored as a condition
*/

/* ---------- types: one per handover table ---------- */

export type Gender = "female" | "male" | "other";
export type NextScreen = "ONBOARDING" | "PROGRAM" | "DASHBOARD";

export type ErrorCode =
  | "INVALID_MOBILE"
  | "INVALID_OTP"
  | "OTP_EXPIRED"
  | "TOO_MANY_ATTEMPTS"
  | "RESEND_TOO_SOON"
  | "NOT_AUTHENTICATED"
  | "VALIDATION_FAILED"
  | "ONBOARDING_INCOMPLETE"
  | "SLOT_TAKEN";

export type Envelope<T> =
  | { success: true; data: T; message: string; error: null }
  | { success: false; data: null; message: string; error: { code: ErrorCode; field?: string; attempts_left?: number } };

export type User = {
  id: string;
  country_code: string;
  mobile: string;
  mobile_verified: boolean;
  status: "ACTIVE";
  onboarding_completed: boolean;
  created_at: string;
  last_login_at: string;
};

export type Profile = {
  first_name: string;
  last_name: string;
  email: string;
  gender: Gender | null;
  age_years: number | null;
  age_recorded_at: string | null;
  height_cm: number | null;
  baseline_weight_kg: number | null;
};

export type Progress = { current_step: number; last_completed_step: number; started_at: string; completed_at: string | null };
export type Consent = { consent_type: ConsentType; version: string; accepted_at: string; revoked_at: string | null };
export type WeightLog = { id: string; weight_kg: number; logged_at: string; source: "ONBOARDING" | "MANUAL" };
export type Appointment = {
  id: string;
  scheduled_at: string;
  duration_min: number;
  type: "FIRST_CONSULTATION" | "FOLLOW_UP";
  status: "BOOKED" | "CANCELLED";
  join_provider: "VIDEO";
};
export type ConditionAnswer = { code: string; other_text?: string };

type OtpSession = { code: string; expires_at: number; attempts: number; resend_count: number; last_sent_at: number };

type Db = {
  users: Record<string, User>;
  byMobile: Record<string, string>;
  profiles: Record<string, Profile>;
  progress: Record<string, Progress>;
  experience: Record<string, string>;
  conditions: Record<string, ConditionAnswer[] | null>;
  consents: Record<string, Consent[]>;
  weights: Record<string, WeightLog[]>;
  appointments: Record<string, Appointment[]>;
  otp: Record<string, OtpSession>;
  care: Record<string, CareRecord>;
  /** the patient says the first consultation was booked another way (phone, WhatsApp) */
  booked_elsewhere: Record<string, boolean>;
  session: { user_id: string; expires_at: number } | null;
};

/* ---------- storage ---------- */

const KEY = "medistry-account-demo";
const OTP_TTL = 5 * 60_000;
const RESEND_AFTER = 30_000;
const MAX_ATTEMPTS = 5;
const SESSION_TTL = 30 * 24 * 3600_000;
export const TOTAL_STEPS = 8; // the seven handover steps, then consent

const empty = (): Db => ({
  users: {},
  byMobile: {},
  profiles: {},
  progress: {},
  experience: {},
  conditions: {},
  consents: {},
  weights: {},
  appointments: {},
  otp: {},
  care: {},
  booked_elsewhere: {},
  session: null,
});

let db: Db | null = null;
let version = 0;
const listeners = new Set<() => void>();

function read(): Db {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    db = raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    db = empty();
  }
  return db!;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // private mode or full storage: the visit still works, it just is not kept
  }
  version++;
  listeners.forEach((fn) => fn());
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
const now = () => new Date().toISOString();
// a real network round trip, so every screen shows its waiting state honestly
const wait = (ms = 420 + Math.random() * 380) => new Promise((r) => setTimeout(r, ms));

const ok = <T,>(data: T, message = "OK"): Envelope<T> => ({ success: true, data, message, error: null });
const fail = <T,>(code: ErrorCode, message: string, extra: { field?: string; attempts_left?: number } = {}): Envelope<T> => ({
  success: false,
  data: null,
  message,
  error: { code, ...extra },
});

function me(): string | null {
  const d = read();
  if (!d.session || d.session.expires_at < Date.now()) return null;
  return d.users[d.session.user_id] ? d.session.user_id : null;
}

/* ---------- session hook: screens re-render when the account changes ---------- */

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    db = null;
    version++;
    fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** Changes whenever stored account data changes, in this tab or another. */
export function useAccountVersion() {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => -1,
  );
}

/** Whether someone is signed in on this device; null on the server, before the browser can tell. */
export function useSignedIn(): boolean | null {
  const v = useAccountVersion();
  if (v === -1) return null;
  return me() !== null;
}

/* ---------- helpers ---------- */

export const mobileKey = (cc: string, mobile: string) => `${cc}${mobile}`;

export function validMobile(cc: string, digits: string) {
  if (cc === "+91") return /^[6-9]\d{9}$/.test(digits);
  return /^\d{7,12}$/.test(digits);
}

export function bmiOf(heightCm: number, weightKg: number) {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

function nextStepFor(p: Profile, uid: string): number {
  const d = read();
  if (!p.first_name || !p.email) return 1;
  if (!p.gender) return 2;
  if (!p.age_years) return 3;
  if (!p.height_cm) return 4;
  if (!p.baseline_weight_kg) return 5;
  if (!d.experience[uid]) return 6;
  if (!d.conditions[uid]) return 7;
  return 8;
}

function nextScreen(uid: string): NextScreen {
  const d = read();
  if (!d.users[uid].onboarding_completed) return "ONBOARDING";
  return "DASHBOARD";
}

/* ---------- auth: /api/v1/auth/* ---------- */

/** POST /api/v1/auth/send-otp */
export async function sendOtp(cc: string, mobile: string): Promise<Envelope<{ resend_after_s: number; expires_in_s: number; demo_code: string }>> {
  await wait();
  if (!validMobile(cc, mobile)) return fail("INVALID_MOBILE", "Enter a valid mobile number.", { field: "mobile" });
  const d = read();
  const k = mobileKey(cc, mobile);
  const prev = d.otp[k];
  const t = Date.now();
  if (prev && t - prev.last_sent_at < RESEND_AFTER) {
    return fail("RESEND_TOO_SOON", "Please wait before asking for another code.");
  }
  // in production only a hash of the code is kept and the code is never logged
  const code = String(Math.floor(1000 + Math.random() * 9000));
  d.otp[k] = { code, expires_at: t + OTP_TTL, attempts: 0, resend_count: (prev?.resend_count ?? -1) + 1, last_sent_at: t };
  write();
  return ok({ resend_after_s: RESEND_AFTER / 1000, expires_in_s: OTP_TTL / 1000, demo_code: code }, "Code sent");
}

/** POST /api/v1/auth/verify-otp: creates the account on first sign-in. */
export async function verifyOtp(
  cc: string,
  mobile: string,
  code: string,
): Promise<Envelope<{ user: User; is_new_user: boolean; next_screen: NextScreen; current_step: number }>> {
  await wait(520);
  const d = read();
  const k = mobileKey(cc, mobile);
  const s = d.otp[k];
  if (!s) return fail("OTP_EXPIRED", "That code has expired. Send a new one.");
  if (s.attempts >= MAX_ATTEMPTS) return fail("TOO_MANY_ATTEMPTS", "Too many tries. Send a new code.");
  if (Date.now() > s.expires_at) return fail("OTP_EXPIRED", "That code has expired. Send a new one.");
  if (code !== s.code) {
    s.attempts++;
    write();
    const left = MAX_ATTEMPTS - s.attempts;
    if (left <= 0) return fail("TOO_MANY_ATTEMPTS", "Too many tries. Send a new code.");
    return fail("INVALID_OTP", "That code does not match.", { attempts_left: left });
  }
  delete d.otp[k];

  let id = d.byMobile[k];
  const isNew = !id;
  if (!id) {
    id = uid("usr");
    d.byMobile[k] = id;
    d.users[id] = {
      id,
      country_code: cc,
      mobile,
      mobile_verified: true,
      status: "ACTIVE",
      onboarding_completed: false,
      created_at: now(),
      last_login_at: now(),
    };
    d.profiles[id] = { first_name: "", last_name: "", email: "", gender: null, age_years: null, age_recorded_at: null, height_cm: null, baseline_weight_kg: null };
    d.progress[id] = { current_step: 1, last_completed_step: 0, started_at: now(), completed_at: null };
  } else {
    d.users[id].last_login_at = now();
  }
  d.session = { user_id: id, expires_at: Date.now() + SESSION_TTL };
  write();
  return ok(
    { user: d.users[id], is_new_user: isNew, next_screen: nextScreen(id), current_step: d.progress[id].current_step },
    isNew ? "Account created" : "Signed in",
  );
}

/** POST /api/v1/auth/logout */
export async function logout(): Promise<Envelope<null>> {
  await wait(200);
  const d = read();
  d.session = null;
  write();
  return ok(null, "Signed out");
}

/** GET /api/v1/auth/me */
export function getMe(): Envelope<{ user: User; profile: Profile; progress: Progress; next_screen: NextScreen }> {
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  return ok({ user: d.users[id], profile: d.profiles[id], progress: d.progress[id], next_screen: nextScreen(id) });
}

/* ---------- onboarding: /api/v1/onboarding/* ---------- */

export type OnboardingState = {
  profile: Profile;
  progress: Progress;
  experience: string | null;
  conditions: ConditionAnswer[] | null;
  consents: ConsentType[];
};

/** GET /api/v1/onboarding/status */
export function getOnboarding(): Envelope<OnboardingState> {
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  return ok({
    profile: d.profiles[id],
    progress: d.progress[id],
    experience: d.experience[id] ?? null,
    conditions: d.conditions[id] ?? null,
    consents: (d.consents[id] ?? []).filter((c) => !c.revoked_at).map((c) => c.consent_type),
  });
}

export type StepPayload =
  | { step: 1; first_name: string; last_name: string; email: string }
  | { step: 2; gender: Gender }
  | { step: 3; age_years: number }
  | { step: 4; height_cm: number }
  | { step: 5; weight_kg: number }
  | { step: 6; experience: string }
  | { step: 7; none: boolean; conditions: ConditionAnswer[] }
  | { step: 8; consents: ConsentType[] };

/** PATCH /api/v1/onboarding/step: one endpoint for every step, saved as soon as it is answered. */
export async function saveStep(p: StepPayload): Promise<Envelope<{ current_step: number }>> {
  await wait(260 + Math.random() * 240);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  const prof = d.profiles[id];
  switch (p.step) {
    case 1: {
      const email = p.email.trim().toLowerCase();
      if (!p.first_name.trim()) return fail("VALIDATION_FAILED", "Add your first name.", { field: "first_name" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("VALIDATION_FAILED", "That email does not look right.", { field: "email" });
      Object.assign(prof, { first_name: p.first_name.trim(), last_name: p.last_name.trim(), email });
      break;
    }
    case 2:
      prof.gender = p.gender;
      break;
    case 3:
      if (!Number.isInteger(p.age_years) || p.age_years < 18) return fail("VALIDATION_FAILED", "Medistry is for adults aged 18 and over.", { field: "age_years" });
      if (p.age_years > 100) return fail("VALIDATION_FAILED", "Enter your age in years.", { field: "age_years" });
      prof.age_years = p.age_years;
      prof.age_recorded_at = now();
      break;
    case 4:
      if (p.height_cm < 120 || p.height_cm > 220) return fail("VALIDATION_FAILED", "Enter a height between 120 and 220 cm.", { field: "height_cm" });
      prof.height_cm = Math.round(p.height_cm * 10) / 10;
      break;
    case 5:
      if (p.weight_kg < 30 || p.weight_kg > 250) return fail("VALIDATION_FAILED", "Enter a weight between 30 and 250 kg.", { field: "weight_kg" });
      prof.baseline_weight_kg = Math.round(p.weight_kg * 10) / 10;
      break;
    case 6:
      // several answers allowed, stored as comma-joined codes (backend: an array)
      if (!p.experience || !p.experience.split(",").every((code) => EXPERIENCES.some((e) => e.code === code))) return fail("VALIDATION_FAILED", "Choose at least one.");
      d.experience[id] = p.experience;
      break;
    case 7: {
      // "None of the above" clears everything else and is never stored as a condition
      if (p.none) {
        d.conditions[id] = [];
        break;
      }
      const valid = p.conditions.filter((c) => CONDITIONS.some((m) => m.code === c.code));
      if (!valid.length) return fail("VALIDATION_FAILED", "Choose at least one, or None of the above.");
      const other = valid.find((c) => c.code === "OTHER");
      if (other && !other.other_text?.trim()) return fail("VALIDATION_FAILED", "Tell us the other condition.", { field: "other_text" });
      d.conditions[id] = valid.map((c) => (c.code === "OTHER" ? { code: c.code, other_text: c.other_text!.trim() } : { code: c.code }));
      break;
    }
    case 8: {
      const missing = REQUIRED_CONSENTS.filter((c) => !p.consents.includes(c));
      if (missing.length) return fail("VALIDATION_FAILED", "These are needed before a doctor can see your details.");
      const t = now();
      const prev = d.consents[id] ?? [];
      // a revoked or unchecked consent is closed, never deleted
      const next: Consent[] = prev.map((c) => (!c.revoked_at && !p.consents.includes(c.consent_type) ? { ...c, revoked_at: t } : c));
      for (const type of p.consents) {
        if (!next.some((c) => c.consent_type === type && !c.revoked_at)) next.push({ consent_type: type, version: "2026-09", accepted_at: t, revoked_at: null });
      }
      d.consents[id] = next;
      break;
    }
  }
  const prog = d.progress[id];
  prog.last_completed_step = Math.max(prog.last_completed_step, p.step);
  prog.current_step = Math.min(TOTAL_STEPS, nextStepFor(prof, id));
  write();
  return ok({ current_step: prog.current_step }, "Saved");
}

/** Where the person was, so "Back" and "Save and exit" never lose an answer. */
export function setCurrentStep(step: number) {
  const id = me();
  if (!id) return;
  const d = read();
  d.progress[id].current_step = step;
  write();
}

/** POST /api/v1/onboarding/complete: checks everything, works out BMI, records the first weight. */
export async function completeOnboarding(): Promise<Envelope<{ bmi: number; next_screen: NextScreen }>> {
  await wait(700);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  const p = d.profiles[id];
  const active = (d.consents[id] ?? []).filter((c) => !c.revoked_at).map((c) => c.consent_type);
  if (nextStepFor(p, id) < 8 || REQUIRED_CONSENTS.some((c) => !active.includes(c))) {
    return fail("ONBOARDING_INCOMPLETE", "A few answers are still missing.");
  }
  const bmi = bmiOf(p.height_cm!, p.baseline_weight_kg!);
  if (!(d.weights[id] ?? []).some((w) => w.source === "ONBOARDING")) {
    d.weights[id] = [{ id: uid("wt"), weight_kg: p.baseline_weight_kg!, logged_at: now(), source: "ONBOARDING" }, ...(d.weights[id] ?? [])];
  }
  d.users[id].onboarding_completed = true;
  d.progress[id].completed_at = now();
  write();
  return ok({ bmi, next_screen: "PROGRAM" as NextScreen }, "Profile complete");
}

/* ---------- consultation: /api/v1/doctors/:id/slots, /api/v1/appointments ---------- */

export type Slot = { at: string; open: boolean };
export type SlotDay = { date: string; slots: Slot[] };

// the same open and taken pattern for a given day on every visit, like a real diary
function taken(t: number) {
  const x = Math.sin(t / 1.7e6) * 10000;
  return x - Math.floor(x) < 0.34;
}

/**
 * GET /api/v1/doctors/:id/slots: 30-minute slots over twelve open days. Around a booked follow-up it
 * offers the days either side of it, so moving it can be a little earlier or later. Sundays are closed.
 */
export async function getSlots(around?: string): Promise<Envelope<SlotDay[]>> {
  await wait(380);
  const days: SlotDay[] = [];
  const today = new Date();
  const start = around ? new Date(Math.max(today.getTime(), new Date(around).getTime() - 3 * 864e5)) : today;
  // two weeks of open days, so "next week" is always on offer
  for (let i = 0, open = 0; open < 12 && i < 21; i++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (day.getDay() === 0) continue;
    open++;
    const slots: Slot[] = [];
    // the last 30-minute slot starts at 7:30 pm, so every consultation ends by 8 pm, when the clinic closes
    for (let m = OPEN_HOUR * 60; m + 30 <= CLOSE_HOUR * 60; m += 30) {
      if (m >= 13 * 60 && m < 14 * 60) continue; // the doctors' lunch hour
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60);
      // same-day slots need an hour's notice
      const soon = at.getTime() < Date.now() + 60 * 60_000;
      if (soon) continue;
      slots.push({ at: at.toISOString(), open: !taken(at.getTime()) });
    }
    days.push({ date: day.toISOString(), slots });
  }
  return ok(days.filter((d) => d.slots.length));
}

/** POST /api/v1/appointments, or PATCH .../:id/reschedule when one is already booked. */
export async function bookConsultation(at: string): Promise<Envelope<Appointment>> {
  await wait(640);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const t = new Date(at).getTime();
  if (taken(t) || t < Date.now()) return fail("SLOT_TAKEN", "Someone has just taken that time. Choose another.");
  const d = read();
  const list = (d.appointments[id] ?? []).map((a) => (a.status === "BOOKED" ? { ...a, status: "CANCELLED" as const } : a));
  const appt: Appointment = { id: uid("apt"), scheduled_at: at, duration_min: 30, type: "FIRST_CONSULTATION", status: "BOOKED", join_provider: "VIDEO" };
  d.appointments[id] = [...list, appt];
  write();
  return ok(appt, "Consultation booked");
}

/** POST /api/v1/appointments/:id/cancel */
export async function cancelConsultation(apptId: string): Promise<Envelope<null>> {
  await wait(420);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  d.appointments[id] = (d.appointments[id] ?? []).map((a) => (a.id === apptId ? { ...a, status: "CANCELLED" as const } : a));
  write();
  return ok(null, "Cancelled");
}

/* ---------- trackers: /api/v1/trackers/* ---------- */

/** POST /api/v1/trackers/weight */
export async function logWeight(kg: number): Promise<Envelope<WeightLog>> {
  await wait(360);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  if (kg < 30 || kg > 250) return fail("VALIDATION_FAILED", "Enter a weight between 30 and 250 kg.");
  const d = read();
  const log: WeightLog = { id: uid("wt"), weight_kg: Math.round(kg * 10) / 10, logged_at: now(), source: "MANUAL" };
  d.weights[id] = [...(d.weights[id] ?? []), log];
  write();
  return ok(log, "Weight saved");
}

/** PATCH /api/v1/trackers/weight/:id: corrects a reading typed wrongly. The health profile's own reading stays as answered. */
export async function updateWeight(logId: string, kg: number): Promise<Envelope<WeightLog>> {
  await wait(300);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  if (kg < 30 || kg > 250) return fail("VALIDATION_FAILED", "Enter a weight between 30 and 250 kg.");
  const d = read();
  const was = (d.weights[id] ?? []).find((w) => w.id === logId && w.source === "MANUAL");
  if (!was) return fail("VALIDATION_FAILED", "That reading is no longer there.");
  const log: WeightLog = { ...was, weight_kg: Math.round(kg * 10) / 10 };
  d.weights[id] = d.weights[id].map((w) => (w.id === logId ? log : w));
  write();
  return ok(log, "Reading updated");
}

/** DELETE /api/v1/trackers/weight/:id */
export async function deleteWeight(logId: string): Promise<Envelope<null>> {
  await wait(300);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  d.weights[id] = (d.weights[id] ?? []).filter((w) => !(w.id === logId && w.source === "MANUAL"));
  write();
  return ok(null, "Reading deleted");
}

/* ---------- aggregator: GET /api/v1/dashboard (plus /care and /journey) ---------- */

export type Dashboard = {
  user: User;
  profile: Profile;
  progress: Progress;
  bmi: number | null;
  weights: WeightLog[];
  appointment: Appointment | null;
  conditions: ConditionAnswer[];
  experience: string | null;
  consents: ConsentType[];
  booked_elsewhere: boolean;
};

export function getDashboard(): Envelope<Dashboard> {
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  const p = d.profiles[id];
  const weights = [...(d.weights[id] ?? [])].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  const latest = weights.at(-1)?.weight_kg ?? p.baseline_weight_kg;
  const appt = (d.appointments[id] ?? []).filter((a) => a.status === "BOOKED").at(-1) ?? null;
  return ok({
    user: d.users[id],
    profile: p,
    progress: d.progress[id],
    bmi: p.height_cm && latest ? bmiOf(p.height_cm, latest) : null,
    weights,
    appointment: appt,
    conditions: d.conditions[id] ?? [],
    experience: d.experience[id] ?? null,
    consents: (d.consents[id] ?? []).filter((c) => !c.revoked_at).map((c) => c.consent_type),
    booked_elsewhere: !!d.booked_elsewhere?.[id],
  });
}

/** The first consultation was booked another way; the app stops asking and says so. */
export async function markBookedElsewhere(): Promise<Envelope<null>> {
  await wait(260);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  d.booked_elsewhere = { ...(d.booked_elsewhere ?? {}), [id]: true };
  write();
  return ok(null);
}

/* ---------- care, once it has started: GET /api/v1/care, /journey and the trackers ---------- */

export type CareView = { user: User; profile: Profile; care: CareRecord | null; weights: WeightLog[] };

/** GET /api/v1/care: the record, the trackers and the lock state in one call. */
export function getCare(): Envelope<CareView> {
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  const weights = [...(d.weights[id] ?? [])].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  // a record saved before the sample changed shape is rebuilt, so every screen can rely on the new fields
  if (d.care[id] && d.care[id].schema !== CARE_SCHEMA) {
    d.care[id] = sampleCare(d.profiles[id], d.care[id].stage ?? 2);
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch {}
  }
  return ok({ user: d.users[id], profile: d.profiles[id], care: d.care[id] ?? null, weights });
}

/**
 * Prototype only: moves this account three weeks ahead, to after the first consultation, so the
 * full record (doctor, prescription, reports, orders, plan, logs) can be reviewed. Undo with resetCareDemo.
 */
export async function startCareDemo(stage: Stage = 2): Promise<Envelope<null>> {
  await wait(500);
  const id = me();
  if (!id) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const d = read();
  const p = d.profiles[id];
  d.care[id] = sampleCare(p, stage);
  d.weights[id] = sampleWeights(p.baseline_weight_kg ?? 78, stage);
  d.appointments[id] = (d.appointments[id] ?? []).map((a) => (a.status === "BOOKED" ? { ...a, status: "CANCELLED" as const } : a));
  write();
  seedPhotos(stage);
  // a record weeks old has already been looked at: its two oldest updates arrive read, so Unread means something
  const { seedRead } = await import("./Inbox");
  seedRead(d.care[id]);
  return ok(null, "Moved to after the first consultation");
}

export function resetCareDemo() {
  const id = me();
  if (!id) return;
  const d = read();
  delete d.care[id];
  d.weights[id] = (d.weights[id] ?? []).filter((w) => w.source === "ONBOARDING");
  write();
  seedPhotos(0);
}

function careOf(): { d: Db; c: CareRecord } | null {
  const id = me();
  if (!id) return null;
  const d = read();
  return d.care[id] ? { d, c: d.care[id] } : null;
}

/**
 * POST /api/v1/symptoms. A configured rule decides what the care team must see: here, anything
 * severe, and dizziness at any level. The app never diagnoses; it tells the person who will look.
 */
export async function logSymptom(code: string, severity: SymptomLog["severity"], note: string): Promise<Envelope<SymptomLog>> {
  await wait(360);
  const x = careOf();
  if (!x) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const label = SYMPTOMS.find((s) => s.code === code)?.label ?? "Something else";
  const log: SymptomLog = { id: uid("sym"), code, label, severity, note: note.trim(), logged_at: now(), requires_review: severity === "Severe" || ["DIZZINESS", "BELLY_PAIN"].includes(code) || (code === "VOMITING" && severity !== "Mild") };
  x.c.symptoms = [log, ...x.c.symptoms];
  write();
  return ok(log, log.requires_review ? "Sent to your care team" : "Saved");
}

/** Undo today's taken or skipped mark, for a mistaken tap. */
export function undoMedication(item: string) {
  const x = careOf();
  if (!x) return;
  const today = new Date().toDateString();
  x.c.medication = x.c.medication.filter((m) => !(m.item === item && new Date(m.scheduled_for).toDateString() === today));
  write();
}

/** POST /api/v1/medications/:regimenId/log */
export function logMedication(item: string, status: MedicationLog["status"], site?: MedicationLog["site"], dose?: string): Envelope<MedicationLog> {
  const x = careOf();
  if (!x) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const today = new Date();
  today.setHours(21, 0, 0, 0);
  const log: MedicationLog = { id: uid("medlog"), item, scheduled_for: today.toISOString(), status, at: now(), ...(site ? { site } : {}), ...(dose ? { dose } : {}) };
  x.c.medication = [log, ...x.c.medication.filter((m) => !(m.item === item && new Date(m.scheduled_for).toDateString() === today.toDateString()))];
  write();
  return ok(log);
}

/** POST /api/v1/labs/bookings: a home blood test, by packet, at a morning slot. */
export async function bookLab(packet: LabPacket["id"], atIso: string): Promise<Envelope<LabReport>> {
  await wait(520);
  const x = careOf();
  if (!x) return fail("NOT_AUTHENTICATED", "Please sign in.");
  const pk = LAB_PACKETS.find((p) => p.id === packet)!;
  const lab: LabReport = { id: uid("lab"), package: `${pk.name}, ${pk.title.toLowerCase()}`, partner: "Partner lab, home collection", slot_at: atIso, status: "SLOT_CONFIRMED", report_date: null, reviewed_by: null, doctor_comment: null, results: [], tests: pk.tests };
  // added alongside anything the doctor has already ordered, never in place of it
  x.c.labs = [lab, ...x.c.labs];
  write();
  return ok(lab);
}

/** Home collection mornings, 7 to 10 am, over the next week (Sundays included: labs collect daily). */
export function labSlots(): { date: string; times: string[] }[] {
  const out: { date: string; times: string[] }[] = [];
  const t = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
    out.push({ date: d.toISOString(), times: [7, 7.5, 8, 8.5, 9, 9.5].map((h) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(h), (h % 1) * 60).toISOString()) });
  }
  return out;
}

/** Prototype: accepting the doctor's suggested plan starts the programme (payment is simulated). */
export async function startProgramme(): Promise<Envelope<null>> {
  return startCareDemo(2);
}

/**
 * POST /api/v1/programme/change-requests: a pause or a cancellation, asked for in the app. Nothing
 * changes until the care team confirms it with the patient on WhatsApp; until then it can be withdrawn.
 */
export async function requestPlanChange(kind: "PAUSE" | "CANCEL"): Promise<Envelope<null>> {
  await wait(420);
  const x = careOf();
  if (!x) return fail("NOT_AUTHENTICATED", "Please sign in.");
  x.c.plan_change = { kind, requested_at: now() };
  write();
  return ok(null, "Requested");
}

/** DELETE /api/v1/programme/change-requests/current: the patient changed their mind before it was confirmed. */
export async function withdrawPlanChange(): Promise<Envelope<null>> {
  await wait(320);
  const x = careOf();
  if (!x) return fail("NOT_AUTHENTICATED", "Please sign in.");
  x.c.plan_change = null;
  write();
  return ok(null, "Withdrawn");
}

/** POST /api/v1/check-ins: one tap a day on how the patient feels; the doctor sees the run of them. */
export function logCheckIn(feeling: CheckIn["feeling"]) {
  const x = careOf();
  if (!x) return;
  const date = new Date().toDateString();
  x.c.checkins = [{ date, feeling }, ...(x.c.checkins ?? []).filter((c) => c.date !== date)];
  write();
}

/** PATCH /api/v1/appointments/:id/reschedule, for the follow-up once care has started. */
export async function rescheduleFollowUp(atIso: string): Promise<Envelope<null>> {
  await wait(520);
  const x = careOf();
  if (!x) return fail("NOT_AUTHENTICATED", "Please sign in.");
  if (taken(new Date(atIso).getTime())) return fail("SLOT_TAKEN", "Someone has just taken that time. Choose another.");
  x.c.next = { id: x.c.next?.id ?? uid("apt"), at: atIso, type: "FOLLOW_UP", duration_min: 30 };
  // the plan is reviewed at the follow-up, so its review date moves with it
  x.c.plan.review_date = atIso;
  write();
  return ok(null, "Moved");
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useAccountVersion } from "../account/api";
import { DOCTOR } from "../account/care";
import { inClinicHours } from "../account/clinic-time";
import { callAt, clinicAgo, ME, recordCallNote, refreshClinic, restorePatient, snapshotPatient, type VisitType } from "./data";
import { SIDE } from "./inbox";

/*
  Call notes: GET /api/v1/doctor/notes and POST /doctor/notes/:id/sign in the product. The scribe
  drafts a note from each transcribed video call; the doctor checks, edits and signs it. Nothing
  reaches the record, the patient's app or a prescription before he signs, and medicine changes
  only ever become a draft prescription he signs separately (Telemedicine Practice Guidelines
  2020, s.5.4). Transcription is its own consent, apart from the video call (DPDP Act 2023).

  All calls, transcripts and drafts are made up, for design review, and kept in this browser.
*/

export type Who = "doctor" | "patient";
/** One turn of the call. `en`: English rendering of a mostly-Hindi line. `unsure`: the words the
    transcriber was not sure of (a substring of text). `missed`: a clinical moment no sentence uses,
    with the sentence to add if the doctor wants it. */
export type Seg = { id: string; t: number; who: Who; text: string; en?: string; unsure?: string; missed?: { to: "summary" | "plan"; text: string } };
/** Evidence: a segment, and optionally the exact words in it (a substring, rendered as <mark>). */
export type Ev = { seg: string; quote?: string };
export type FlagKind = "unclear" | "conflict" | "unsaid";
/** options[].text null means "remove this sentence". `resolved` holds the chosen label. */
export type Flag = { kind: FlagKind; why: string; options: { label: string; text: string | null }[]; resolved?: string };
export type Sentence = { id: string; text: string; ev: Ev[]; by: "scribe" | "doctor"; flag?: Flag };
export type SectionKey = "summary" | "assessment" | "plan" | "patient";
/** The lists below the prose, which the doctor can mark checked but not rewrite. */
export type ListKey = "meds" | "followups" | "updates";
/** draft: the scribe's original, kept for "Restore". cur: what the doctor sees and edits. */
export type NoteSection = { key: SectionKey; draft: Sentence[]; cur: Sentence[]; checked: boolean };
export type MedChange = { id: string; action: "START" | "CHANGE" | "STOP" | "CONTINUE"; name: string; strength: string; detail: string; was?: string; ev: Ev[]; include: boolean };
export type FollowUp = { id: string; text: string; owner: "You" | "Care team" | "Dietitian"; ev: Ev[]; include: boolean; done: boolean };
export type RecordUpdate = { id: string; field: "allergies" | "identity_verified" | "outside_meds"; label: string; from: string; to: string; include: boolean };

export type CallNote = {
  id: string;
  pid: string;
  name: string;
  type: VisitType;
  reason: string;
  call_at: string;
  minutes: number;
  /** false: the patient declined call transcription */
  transcribed: boolean;
  /** the scribe is still writing while now < ready_at */
  ready_at: string;
  status: "DRAFT" | "SIGNED";
  /** always the four keys, in order */
  sections: NoteSection[];
  meds: MedChange[];
  followups: FollowUp[];
  updates: RecordUpdate[];
  checks: Partial<Record<ListKey, boolean>>;
  transcript: Seg[];
  signed: { at: string; by: string; rx_id: string | null; app: boolean } | null;
  addenda: { at: string; by: string; text: string }[];
  log: { at: string; what: string }[];
};

export const TITLES: Record<SectionKey | ListKey, string> = {
  summary: "Visit summary",
  assessment: "Assessment",
  plan: "Plan",
  patient: "For the patient",
  meds: "Medicines",
  followups: "Follow-ups",
  updates: "Record updates",
};

/* ---------- derived state: never stored, so it can never go stale ---------- */

export const writing = (n: CallNote, now: number) => n.status === "DRAFT" && now < Date.parse(n.ready_at);
export const sectionOf = (n: CallNote, key: SectionKey) => n.sections.find((s) => s.key === key)!;
export const openFlags = (n: CallNote) => n.sections.flatMap((s) => s.cur.filter((x) => x.flag && !x.flag.resolved));

export type Blocker = { label: string; target: string };
/** What stops signing, each with the element to scroll to. */
export function blockers(n: CallNote): Blocker[] {
  const out: Blocker[] = [];
  const flags = openFlags(n);
  if (flags.length) out.push({ label: `${flags.length} to check`, target: `sent-${flags[0].id}` });
  if (!sectionOf(n, "summary").cur.length) out.push({ label: "Visit summary is empty", target: "sec-summary" });
  if (!sectionOf(n, "plan").cur.length) out.push({ label: "Plan is empty", target: "sec-plan" });
  return out;
}
/** The brief's REVIEWED state, worked out rather than stored. The screens call it "Ready to sign". */
export const ready = (n: CallNote, now: number) => !writing(n, now) && n.status === "DRAFT" && blockers(n).length === 0;
/** Drafts that are written, oldest call first: the longest-waiting note is the liability. */
export const toSign = (notes: CallNote[], now: number) => notes.filter((n) => n.status === "DRAFT" && !writing(n, now)).sort((a, b) => a.call_at.localeCompare(b.call_at));
/** Clinical moments in the call that no sentence in the note uses. */
export const missedOpen = (n: CallNote) => {
  const cited = new Set(n.sections.flatMap((s) => s.cur.flatMap((x) => x.ev.map((e) => e.seg))));
  return n.transcript.filter((g) => g.missed && !cited.has(g.id));
};
/** Edited: the doctor's text differs from the scribe's in any way. */
export const edited = (s: NoteSection) => s.cur.length !== s.draft.length || s.cur.some((x, i) => x.id !== s.draft[i].id || x.text !== s.draft[i].text);
export const firstName = (n: CallNote) => n.name.split(" ")[0];

/* ---------- sample content ---------- */

const M = 6e4;
const iso = (t: number) => new Date(t).toISOString();
/** "1:20" in the call, as seconds */
const ts = (s: string) => {
  const [m, x] = s.split(":").map(Number);
  return m * 60 + x;
};
const seg = (id: string, t: string, who: Who, text: string, extra: Partial<Seg> = {}): Seg => ({ id, t: ts(t), who, text, ...extra });
/** evidence: "a1", or ["a1", "the exact words"] */
const ev = (...xs: (string | [string, string])[]): Ev[] => xs.map((x) => (typeof x === "string" ? { seg: x } : { seg: x[0], quote: x[1] }));
type Draft = [string, Ev[], Flag?];
function sec(nid: string, key: SectionKey, rows: Draft[]): NoteSection {
  const s = rows.map(([text, e, flag], i): Sentence => ({ id: `${nid}-${key}-${i + 1}`, text, ev: e, by: "scribe", ...(flag ? { flag } : {}) }));
  return { key, draft: s, cur: structuredClone(s), checked: false };
}
const four = (nid: string, d: Record<SectionKey, Draft[]>) => (["summary", "assessment", "plan", "patient"] as const).map((k) => sec(nid, k, d[k]));

function seed(): CallNote[] {
  const t0 = Date.now();
  // every call happened in clinic hours, Monday to Saturday, 9 am to 8 pm; never "three hours ago" at midnight
  const ago = (ms: number) => iso(clinicAgo(t0, ms));
  const open = inClinicHours(t0) && inClinicHours(t0 - 16 * M);
  const written = (call: string, mins: number) => iso(Date.parse(call) + (mins + 2) * M);
  const base = (o: Pick<CallNote, "id" | "pid" | "name" | "type" | "reason" | "call_at" | "minutes">): Omit<CallNote, "sections" | "transcript"> => ({
    ...o,
    transcribed: true,
    ready_at: written(o.call_at, o.minutes),
    status: "DRAFT",
    meds: [],
    followups: [],
    updates: [],
    checks: {},
    signed: null,
    addenda: [],
    log: [{ at: written(o.call_at, o.minutes), what: "Draft written by the scribe" }],
  });

  /* N1. Aanya: the live note, linked to the patient app demo */
  const aanyaAt = ago(90 * M);
  const aanya: CallNote = {
    ...base({ id: "cn_aanya", pid: "p_aanya", name: "Aanya Kapoor", type: "FOLLOW_UP", reason: "Short call she asked for, before her first injection.", call_at: aanyaAt, minutes: 6 }),
    transcript: [
      seg("a1", "0:08", "doctor", "Hi Aanya. You wanted to talk before the first injection?"),
      seg("a2", "0:12", "patient", "Haan. Honestly I'm a bit scared of the needle. And I've had acidity after dinner a few nights."),
      seg("a3", "0:31", "doctor", "Let's take them one by one. Have you watched the pen guide in the app?"),
      seg("a4", "0:36", "patient", "Watched it twice. Dial, click, hold for six seconds?"),
      seg("a5", "0:44", "doctor", "That's right. Count to six with the button pressed. The needle is very short."),
      seg("a6", "1:20", "doctor", "Tummy, two fingers' width from the belly button, or the front of the thigh. Today, before dinner, is fine."),
      seg("a7", "2:05", "doctor", "Tell me about the acidity. When does it happen?"),
      seg("a8", "2:09", "patient", "Raat ko. Dinner late ho jaata hai, around ten thirty, and then I lie down soon after.", { en: "At night. Dinner gets late, around ten thirty, and then I lie down soon after." }),
      seg("a9", "2:30", "doctor", "Any vomiting, pain in the upper tummy, black stools?"),
      seg("a10", "2:36", "patient", "No, nothing like that. Just burning, two or three nights."),
      seg("a11", "3:02", "doctor", "Let's bring dinner earlier, by eight thirty on workdays, a smaller plate, and stay upright for two hours after."),
      seg("a12", "3:40", "patient", "Eight thirty works most days. Fridays are hard, we eat out.", { missed: { to: "summary", text: "Eats out on Fridays, so an earlier dinner is harder that day." } }),
      seg("a13", "4:05", "doctor", "Keep the metformin after dinner as it is. If the burning carries on past two weeks, or you vomit, message the team."),
      seg("a14", "4:40", "patient", "And if I miss the day?"),
      seg("a15", "4:44", "doctor", "If you remember within five days, take it then. After that, skip it and take the next one on your usual day."),
      seg("a16", "5:20", "doctor", "I'll see you at your follow-up next week. Log the injection and where you gave it in the app."),
      seg("a17", "5:35", "patient", "Okay. Thank you, doctor."),
    ],
    sections: four("cn_aanya", {
      summary: [
        ["Short video call at Aanya's request, before her first semaglutide injection.", ev("a1", "a2")],
        ["Anxious about injecting; has watched the pen guide twice and described the steps correctly.", ev(["a2", "a bit scared of the needle"], ["a4", "Watched it twice"])],
        ["Burning acidity on two or three nights after late dinners, around 10:30 pm, often lying down soon after.", ev(["a8", "around ten thirty"], ["a10", "two or three nights"])],
        ["No vomiting, upper abdominal pain or black stools.", ev("a9", ["a10", "No, nothing like that"])],
      ],
      assessment: [
        ["Understands the injection technique and is ready to start semaglutide 0.25 mg weekly.", ev("a4", "a5")],
        ["Reflux symptoms most likely from late, large dinners and lying down after eating; no red-flag features.", ev("a8", "a9", "a10", "a11")],
      ],
      plan: [
        ["First Wegovy 0.25 mg injection today, before dinner, in the tummy or the front of the thigh", ev(["a6", "Today, before dinner, is fine"])],
        ["Dinner by 8:30 pm on workdays, a smaller plate, upright for two hours after", ev(["a11", "by eight thirty on workdays"])],
        ["Metformin SR 500 mg after dinner continues", ev(["a13", "Keep the metformin after dinner as it is"])],
        ["Missed dose: take it within five days, otherwise skip to the usual day", ev(["a15", "within five days"])],
        ["Message the care team if the burning lasts beyond two weeks, or with any vomiting", ev(["a13", "past two weeks"])],
        ["Log each injection and the site in the app", ev("a16")],
      ],
      patient: [
        ["You are ready for your first Wegovy 0.25 mg injection today, before dinner, in your tummy or the front of your thigh.", ev("a6")],
        ["Hold the button down for a count of six.", ev(["a5", "Count to six"])],
        ["The burning after dinner is most likely from eating late and lying down soon after.", ev("a8")],
        ["On workdays, try to finish dinner by 8:30 pm, keep the plate a little smaller, and stay upright for two hours.", ev("a11")],
        ["Keep taking metformin after dinner as before.", ev("a13")],
        ["If you miss an injection, take it within five days; after that, skip it and go back to your usual day.", ev("a15")],
        ["If the burning lasts more than two weeks, or you are sick, message the care team in the app.", ev("a13")],
      ],
    }),
    meds: [
      { id: "m1", action: "CONTINUE", name: "Semaglutide (Wegovy FlexTouch)", strength: "0.25 mg", detail: "Once a week", ev: ev("a5", "a6"), include: true },
      { id: "m2", action: "CONTINUE", name: "Metformin SR", strength: "500 mg", detail: "After dinner", ev: ev("a13"), include: true },
    ],
    followups: [
      { id: "f1", text: "Ask about the acidity at next week's follow-up", owner: "You", ev: ev("a13", "a16"), include: true, done: false },
      { id: "f2", text: "Ideas for an earlier, lighter weekday dinner", owner: "Dietitian", ev: ev("a11"), include: true, done: false },
    ],
  };

  /* N2. Ritu: three things to check, one moment the scribe left out */
  const ritu: CallNote = {
    ...base({ id: "cn_ritu", pid: "p_ritu", name: "Ritu Malhotra", type: "FOLLOW_UP", reason: "Three-month review.", call_at: callAt(1, 19), minutes: 26 }),
    transcript: [
      seg("r1", "0:15", "doctor", "Ritu, your three-month report came in. HbA1c is 7.1, down from 7.9."),
      seg("r2", "0:24", "patient", "Achha! That's better than I thought."),
      seg("r3", "0:40", "doctor", "Fasting sugar 136, triglycerides 182, and the liver enzyme ALT is 46."),
      seg("r4", "1:30", "patient", "But this week I felt dizzy twice, around eleven in the morning."),
      seg("r5", "1:41", "doctor", "What did you eat before that, and when?"),
      seg("r6", "1:45", "patient", "Breakfast at seven, just a small bowl of poha. Then nothing till lunch at two."),
      seg("r7", "2:02", "doctor", "Did you check your sugar when it happened?"),
      seg("r8", "2:06", "patient", "Once. It was sixty-eight, I think.", { unsure: "sixty-eight" }),
      seg("r9", "2:30", "doctor", "Are you still taking the atorvastatin at night?"),
      seg("r10", "2:34", "patient", "Actually I stopped it two weeks back. My legs were aching, so I thought it's the tablet."),
      seg("r11", "3:10", "doctor", "Okay. Leave it paused for now and we'll look at another option at the next review. Don't restart it on your own."),
      seg("r12", "3:45", "patient", "And the evening metformin, I take it at ten, after dinner. Can it be earlier?"),
      seg("r13", "3:52", "doctor", "Yes. Take the evening one with dinner, and let's aim for dinner by seven thirty."),
      seg("r14", "4:30", "doctor", "Add a small snack around ten thirty: a fruit with a few almonds, or a glass of chaas."),
      seg("r15", "5:05", "doctor", "If you feel dizzy, check your sugar. If it's below 70, take three teaspoons of sugar in water, check again in fifteen minutes, and message us."),
      seg("r16", "5:50", "patient", "Ek aur cheez, pairon mein raat ko thodi jhunjhuni hoti hai.", { en: "One more thing, I get some tingling in my feet at night.", missed: { to: "summary", text: "Reports tingling in her feet at night; feet not examined on video." } }),
      seg("r17", "6:05", "doctor", "We'll check your B12 and do a foot check at the next visit.", { missed: { to: "plan", text: "Vitamin B12 with the next blood tests, and a foot check at the next visit" } }),
      seg("r18", "6:40", "doctor", "Telmisartan from your cardiologist continues as it is."),
    ],
    sections: four("cn_ritu", {
      summary: [
        ["Three-month review by video.", ev("r1")],
        ["HbA1c 7.1%, down from 7.9%; fasting glucose 136 mg/dL; triglycerides 182 mg/dL; ALT 46 U/L.", ev(["r1", "HbA1c is 7.1, down from 7.9"], ["r3", "Fasting sugar 136"], ["r3", "triglycerides 182"], ["r3", "ALT is 46"])],
        ["Dizzy on two mornings this week, around 11 am, after a small breakfast at 7 am and nothing until lunch at 2 pm.", ev(["r4", "dizzy twice, around eleven in the morning"], ["r6", "Breakfast at seven"], ["r6", "nothing till lunch at two"])],
        [
          "During one episode, home glucose was 68 mg/dL.",
          ev(["r8", "sixty-eight"]),
          {
            kind: "unclear",
            why: "The transcriber was not sure of this number.",
            options: [
              { label: "68 mg/dL", text: "During one episode, home glucose was 68 mg/dL." },
              { label: "86 mg/dL", text: "During one episode, home glucose was 86 mg/dL." },
              { label: "Not sure", text: "Home glucose was checked during one episode; the value was unclear on the call." },
            ],
          },
        ],
        [
          "Stopped atorvastatin about two weeks ago on her own, because of aching legs.",
          ev(["r10", "I stopped it two weeks back"]),
          {
            kind: "conflict",
            why: "Her record shows atorvastatin 10 mg at night as current, on prescription version 3.",
            options: [
              { label: "She has stopped it", text: "Stopped atorvastatin about two weeks ago on her own, because of aching legs." },
              { label: "Remove this sentence", text: null },
            ],
          },
        ],
        ["Takes the evening metformin at about 10 pm, after dinner, and asked to move it earlier.", ev(["r12", "I take it at ten, after dinner"])],
        ["Telmisartan 40 mg from her cardiologist continues.", ev("r18")],
      ],
      assessment: [
        ["Type 2 diabetes improving on metformin, still above target.", ev(["r1", "HbA1c is 7.1, down from 7.9"])],
        ["Mid-morning dizziness, possibly low glucose after a long gap between meals.", ev("r6", "r8")],
        [
          "Metformin is causing her low sugar and the dose should be reduced.",
          [],
          {
            kind: "unsaid",
            why: "Nothing in the call supports this, and the plan keeps the same dose.",
            options: [
              { label: "Remove it", text: null },
              { label: "Keep it", text: "Metformin is causing her low sugar and the dose should be reduced." },
            ],
          },
        ],
        ["Aching legs on atorvastatin; statin paused.", ev("r10", "r11")],
      ],
      plan: [
        ["Evening metformin SR 1000 mg with dinner, and dinner by 7:30 pm", ev(["r13", "Take the evening one with dinner"])],
        ["A small snack at about 10:30 am: fruit with a few almonds, or a glass of chaas", ev(["r14", "a small snack around ten thirty"])],
        ["If dizzy, check sugar; below 70, three teaspoons of sugar in water, recheck in 15 minutes, and message the team", ev(["r15", "If it's below 70"])],
        ["Atorvastatin stays paused; another option at the next review. Not to restart it alone", ev(["r11", "Don't restart it on your own"])],
      ],
      patient: [
        ["Ritu, your HbA1c has come down from 7.9% to 7.1%.", ev(["r1", "HbA1c is 7.1, down from 7.9"])],
        ["The dizziness late in the morning may be from the long gap after breakfast, so have a small snack at about 10:30: a fruit with a few almonds, or a glass of chaas.", ev("r6", "r14")],
        ["Take your evening metformin with dinner, and aim to finish dinner by 7:30 pm.", ev("r13")],
        ["If you feel dizzy, check your sugar.", ev("r15")],
        ["If it is below 70, take three teaspoons of sugar in water, check again after 15 minutes, and message us.", ev(["r15", "three teaspoons of sugar in water"])],
        ["Please keep atorvastatin paused for now. We will talk about another option at your next review.", ev("r11")],
      ],
    }),
    meds: [
      { id: "m1", action: "CHANGE", name: "Metformin SR", strength: "1000 mg", detail: "1 tablet twice a day: with breakfast, and with dinner by 7:30 pm", was: "Twice a day, with meals", ev: ev(["r13", "Take the evening one with dinner"]), include: true },
      { id: "m2", action: "STOP", name: "Atorvastatin", strength: "10 mg", detail: "Paused for aching legs; review at the next visit", ev: ev(["r11", "Leave it paused for now"]), include: true },
    ],
    followups: [
      { id: "f1", text: "Book a follow-up in four weeks", owner: "Care team", ev: ev("r11"), include: true, done: false },
      { id: "f2", text: "Look over her glucose log in one week", owner: "Care team", ev: ev("r15"), include: true, done: false },
    ],
  };

  /* N3. Vikram: his dose differs from the record */
  const vikram: CallNote = {
    ...base({ id: "cn_vikram", pid: "p_vikram", name: "Vikram Sethi", type: "FOLLOW_UP", reason: "Kidney and liver check results.", call_at: callAt(2, 18), minutes: 22 }),
    transcript: [
      seg("v1", "0:10", "doctor", "Your kidney and liver check is back. Creatinine is 1.3 and eGFR is 62, a little lower than we'd like."),
      seg("v2", "0:35", "patient", "Is that serious?"),
      seg("v3", "0:40", "doctor", "It's something to watch. We'll repeat it in four weeks and keep metformin as it is for now."),
      seg("v4", "1:20", "doctor", "The glimepiride from your earlier doctor, what strength is on the strip?"),
      seg("v5", "1:26", "patient", "Two mg, one in the morning."),
      seg("v6", "1:40", "doctor", "Send me a photo of the strip on chat today, please. Any shaky, sweaty spells?"),
      seg("v7", "1:48", "patient", "Once last week, before lunch. I had a biscuit, it passed."),
      seg("v8", "2:30", "doctor", "How are the walks going?"),
      seg("v9", "2:34", "patient", "Four, four and a half thousand steps. Office is far."),
      seg("v10", "2:50", "doctor", "Ten minutes after lunch and ten after dinner. That's the target for now."),
      seg("v11", "3:30", "patient", "And the machine for the snoring, I use it maybe two nights a week. It's uncomfortable.", { missed: { to: "summary", text: "Uses CPAP on about two nights a week; finds the mask uncomfortable." } }),
      seg("v12", "4:10", "doctor", "I'll decide on the glimepiride once I've seen the strip. Until then, carry on as you are and keep a biscuit handy."),
    ],
    sections: four("cn_vikram", {
      summary: [
        ["Follow-up by video to go through the kidney and liver check.", ev("v1")],
        ["Creatinine 1.3 mg/dL and eGFR 62.", ev(["v1", "Creatinine is 1.3 and eGFR is 62"])],
        [
          "Takes glimepiride 2 mg every morning, from his previous doctor.",
          ev(["v5", "Two mg, one in the morning"]),
          {
            kind: "conflict",
            why: "His record says glimepiride 1 mg, not verified.",
            options: [
              { label: "2 mg, as he said", text: "Takes glimepiride 2 mg every morning, from his previous doctor." },
              { label: "Remove this sentence", text: null },
            ],
          },
        ],
        ["One shaky spell before lunch last week, settled with a biscuit.", ev(["v7", "Once last week, before lunch"])],
        ["Walking 4,000 to 4,500 steps a day.", ev(["v9", "Four, four and a half thousand steps"])],
      ],
      assessment: [
        ["Mildly reduced kidney function; metformin continues at the current dose, with a repeat test.", ev("v1", "v3")],
        ["Possible low glucose on glimepiride.", ev("v6", "v7")],
      ],
      plan: [
        ["Metformin SR 500 mg twice a day continues", ev(["v3", "keep metformin as it is for now"])],
        ["Repeat creatinine and eGFR in four weeks", ev(["v3", "repeat it in four weeks"])],
        ["Photo of the glimepiride strip in chat today", ev(["v6", "Send me a photo of the strip on chat today"])],
        ["Keep a biscuit handy until the glimepiride is reviewed", ev(["v12", "keep a biscuit handy"])],
        ["A ten-minute walk after lunch and after dinner", ev(["v10", "Ten minutes after lunch and ten after dinner"])],
      ],
      patient: [
        ["Vikram, your kidney test shows creatinine 1.3 and eGFR 62, which we will check again in four weeks.", ev("v1", "v3")],
        ["Keep taking metformin as before.", ev("v3")],
        ["Please send a photo of your glimepiride strip in the chat today.", ev("v6")],
        ["Until we have looked at it, keep a biscuit with you in case you feel shaky or sweaty.", ev("v7", "v12")],
        ["Try a ten-minute walk after lunch and after dinner.", ev("v10")],
      ],
    }),
    meds: [{ id: "m1", action: "CONTINUE", name: "Metformin SR", strength: "500 mg", detail: "Twice a day, with meals", ev: ev("v3"), include: true }],
    updates: [{ id: "u1", field: "outside_meds", label: "Other medicines", from: "Glimepiride 1 mg, from his previous doctor (not verified)", to: "Glimepiride 2 mg each morning, from his previous doctor (dose from the patient; strip photo awaited)", include: true }],
    followups: [
      { id: "f1", text: "Order a repeat kidney test in four weeks", owner: "You", ev: ev("v3"), include: true, done: false },
      { id: "f2", text: "Check the glimepiride strip photo", owner: "You", ev: ev("v6"), include: true, done: false },
    ],
  };

  /* N4. Meera: in clinic hours the call ended two minutes ago and the scribe is still writing;
     out of hours it was the last call of the day, and the draft is long written */
  const meeraAt = open ? iso(t0 - 2 * M - 14 * M) : ago(30 * M);
  const meera: CallNote = {
    ...base({ id: "cn_meera", pid: "p_meera", name: "Meera Iyer", type: "FIRST_CONSULTATION", reason: "First consultation.", call_at: meeraAt, minutes: 14 }),
    ready_at: open ? iso(t0 + 25e3) : iso(Date.parse(meeraAt) + 16 * M),
    log: [],
    transcript: [
      seg("m1", "0:20", "doctor", "Before we start, can you show me a photo ID? Thank you, Meera."),
      seg("m2", "1:05", "doctor", "Tell me about your periods."),
      seg("m3", "1:09", "patient", "They come every forty-five to sixty days. It's been like this for about two years."),
      seg("m4", "1:40", "patient", "And I've put on around eight kilos in the same time. Mostly around the waist."),
      seg("m5", "2:30", "doctor", "Any medicines, or allergies to any medicine?"),
      seg("m6", "2:34", "patient", "No medicines. No allergies that I know of."),
      seg("m7", "3:10", "doctor", "Anyone in the family with diabetes?"),
      seg("m8", "3:13", "patient", "My mother, for about ten years."),
      seg("m9", "4:00", "patient", "I'm vegetarian. Desk job, I sit most of the day."),
      seg("m10", "5:20", "doctor", "I'd like home blood tests first: sugar, HbA1c, lipids, thyroid, liver, and the hormone tests for PCOS."),
      seg("m11", "6:10", "doctor", "Ritika, our dietitian, will call you this week. Once the results are in, we'll decide the plan together, and whether any medicine is needed."),
      seg("m12", "6:40", "patient", "Will the tests be at home?"),
      seg("m13", "6:44", "doctor", "Yes, a technician comes in the morning. Ten to twelve hours of fasting before."),
    ],
    sections: four("cn_meera", {
      summary: [
        ["First consultation by video; identity confirmed with photo ID.", ev(["m1", "can you show me a photo ID"])],
        ["Periods every 45 to 60 days for about two years, with about 8 kg weight gain over the same time, mostly around the waist.", ev(["m3", "every forty-five to sixty days"], ["m4", "around eight kilos"])],
        ["No regular medicines; no known medicine allergies.", ev("m5", ["m6", "No allergies that I know of"])],
        ["Mother has had diabetes for about ten years.", ev(["m8", "for about ten years"])],
        ["Vegetarian; desk job, mostly sitting.", ev("m9")],
      ],
      assessment: [
        ["Irregular cycles and central weight gain suggest PCOS, to be confirmed with blood tests.", ev("m3", "m4", "m10")],
        ["Family history of diabetes; glucose and HbA1c to be checked.", ev("m8", "m10")],
      ],
      plan: [
        ["Home blood tests: fasting glucose, HbA1c, lipids, thyroid, liver and PCOS hormone tests", ev("m10")],
        ["Fast for 10 to 12 hours before the morning collection", ev(["m13", "Ten to twelve hours of fasting"])],
        ["Dietitian call this week", ev(["m11", "will call you this week"])],
        ["Plan, and whether medicine is needed, decided once results are in", ev(["m11", "whether any medicine is needed"])],
      ],
      patient: [
        ["Your irregular periods and the weight gain around your waist may be linked to PCOS, and blood tests will help us confirm it.", ev("m3", "m4", "m10")],
        ["A technician will come to your home in the morning for the tests; please do not eat for 10 to 12 hours before.", ev("m13")],
        ["Ritika, your dietitian, will call you this week.", ev("m11")],
        ["Once the results are in, we will decide the plan together, including whether any medicine is needed.", ev("m11")],
      ],
    }),
    updates: [
      { id: "u1", field: "allergies", label: "Allergies", from: "Not recorded", to: "No known medicine allergies (asked on the call)", include: true },
      { id: "u2", field: "identity_verified", label: "Identity", from: "Not verified", to: "Verified on the call with photo ID", include: true },
    ],
    followups: [
      { id: "f1", text: "Book home blood tests", owner: "Care team", ev: ev("m10"), include: true, done: false },
      { id: "f2", text: "Dietitian introduction call", owner: "Dietitian", ev: ev("m11"), include: true, done: false },
    ],
  };
  meera.log = [{ at: meera.ready_at, what: "Draft written by the scribe" }];

  /* N5. Arjun: signed three days ago */
  const arjunAt = callAt(3, 10);
  const arjunSigned = iso(Date.parse(arjunAt) + 40 * M);
  const arjun: CallNote = {
    ...base({ id: "cn_arjun", pid: "p_arjun", name: "Arjun Bhatia", type: "FOLLOW_UP", reason: "Metformin refill and review.", call_at: arjunAt, minutes: 15 }),
    transcript: [
      seg("ar1", "0:10", "doctor", "Arjun, your metformin refill is due. How has it been?"),
      seg("ar2", "0:18", "patient", "Fine. Constipation last week, but more water and isabgol helped."),
      seg("ar3", "1:05", "doctor", "Good. The app shows about 9,800 steps a day, and protein is close to target."),
      seg("ar4", "1:40", "patient", "This morning I was 93.1 on the scale."),
      seg("ar5", "2:20", "doctor", "That's from 98 at the start. Let's add strength training twice a week."),
      seg("ar6", "3:10", "doctor", "I'll refill the metformin on the current prescription. Blood tests at three months, before the next review."),
    ],
    sections: four("cn_arjun", {
      summary: [
        ["Follow-up by video; metformin refill due.", ev("ar1")],
        ["Mild constipation last week, eased with more water and fibre.", ev(["ar2", "more water and isabgol helped"])],
        ["Walking about 9,800 steps a day; protein close to target.", ev(["ar3", "about 9,800 steps a day"])],
        ["Weight 93.1 kg, from 98 kg at the start.", ev(["ar4", "93.1"], ["ar5", "from 98 at the start"])],
      ],
      assessment: [["Prediabetes and fatty liver; tolerating metformin and following the plan.", ev("ar2", "ar3")]],
      plan: [
        ["Metformin SR 500 mg after dinner continues, refilled on the current prescription", ev(["ar6", "refill the metformin on the current prescription"])],
        ["Strength training twice a week", ev(["ar5", "strength training twice a week"])],
        ["Three-month blood tests before the next review", ev(["ar6", "Blood tests at three months"])],
      ],
      patient: [
        ["Your weight is 93.1 kg, down from 98 kg when you started, and your walking is steady.", ev("ar4", "ar5", "ar3")],
        ["Keep taking metformin after dinner; your refill is on the current prescription.", ev("ar6")],
        ["Add strength training twice a week, and book your three-month blood tests before the next review.", ev("ar5", "ar6")],
      ],
    }),
    meds: [{ id: "m1", action: "CONTINUE", name: "Metformin SR", strength: "500 mg", detail: "After dinner", ev: ev("ar6"), include: true }],
    followups: [{ id: "f1", text: "Book three-month blood tests", owner: "Care team", ev: ev("ar6"), include: true, done: true }],
    status: "SIGNED",
    signed: { at: arjunSigned, by: ME.name, rx_id: null, app: true },
  };
  // he rewrote one plan point in his own words before signing
  const ap = sectionOf(arjun, "plan");
  ap.cur[1] = { id: "cn_arjun-plan-d1", text: "Strength training twice a week: squats and a resistance band, 20 minutes", ev: [], by: "doctor" };
  arjun.sections.forEach((s) => (s.checked = true));
  arjun.log = [
    { at: written(arjunAt, 15), what: "Draft written by the scribe" },
    { at: iso(Date.parse(arjunAt) + 31 * M), what: "Edited the Plan" },
    { at: arjunSigned, what: "Signed" },
  ];

  /* N6. Priya: she did not consent to transcription, so the doctor writes it himself */
  const priya: CallNote = {
    ...base({ id: "cn_priya", pid: "p_priya", name: "Priya Raghavan", type: "FOLLOW_UP", reason: "Weekend travel and meals.", call_at: ago(150 * M), minutes: 18 }),
    transcribed: false,
    ready_at: iso(Date.parse(ago(150 * M)) + 18 * M),
    sections: four("cn_priya", { summary: [], assessment: [], plan: [], patient: [] }),
    transcript: [],
    log: [],
  };

  return [aanya, ritu, vikram, meera, arjun, priya];
}

/* ---------- store: kept in this browser, fresh each day (the sample times are relative) ---------- */

const KEY = "medistry-clinic-notes-v1";
const APP_KEY = "medistry-account-demo";
type Store = { day: string; notes: CallNote[] };
let cache: Store | null = null;
const listeners = new Set<() => void>();

function read(): Store {
  if (cache) return cache;
  const day = new Date().toDateString();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Store | null;
    if (raw && raw.day === day) cache = raw;
  } catch {
    // unreadable: start again below
  }
  if (!cache) {
    // kept straight away, so the sample times hold across reloads for the rest of the day
    cache = { day, notes: seed() };
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {}
  }
  return cache;
}
function save(next: Store) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private browsing: holds for this visit
  }
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** The patient app on this device, read raw: the same person as Aanya in the prototype. */
type AppDb = { session?: { user_id: string; expires_at: number } | null; care?: Record<string, { stage?: number; consultations?: AppConsultation[] }> };
type AppConsultation = { id: string; at: string; type: VisitType; duration_min: number; doctor: string; summary: string; next_steps: string[] };
function appDb(): { db: AppDb; uid: string } | null {
  try {
    const db = JSON.parse(localStorage.getItem(APP_KEY) ?? "null") as AppDb | null;
    const uid = db?.session && db.session.expires_at > Date.now() ? db.session.user_id : null;
    return db && uid ? { db, uid } : null;
  } catch {
    return null;
  }
}
/** Aanya's note describes the day her first injection is due (stage 2). At any other stage of the
    patient demo it would contradict her app, so it is left out. */
function aanyaShown() {
  const a = appDb();
  return !a || a.db.care?.[a.uid]?.stage === 2;
}

/** Every call note the doctor can open, or null on the server. */
export function useNotes(): CallNote[] | null {
  const store = useSyncExternalStore(subscribe, read, () => null);
  const app = useAccountVersion();
  return useMemo(() => {
    void app;
    if (!store) return null;
    return aanyaShown() ? store.notes : store.notes.filter((n) => n.pid !== "p_aanya");
  }, [store, app]);
}

/* ---------- actions: each one is logged on the note ---------- */

const stamp = () => new Date().toISOString();
function change(nid: string, fn: (n: CallNote) => string | void) {
  const s = read();
  const notes = s.notes.map((n) => {
    if (n.id !== nid) return n;
    const copy = structuredClone(n);
    const what = fn(copy);
    if (what) copy.log = [...copy.log, { at: stamp(), what }];
    return copy;
  });
  save({ ...s, notes });
}
const find = (nid: string) => read().notes.find((n) => n.id === nid);

/** Split the doctor's text back into sentences. Unchanged sentences keep their evidence and flags. */
function split(key: SectionKey, text: string): string[] {
  if (key === "plan") return text.split("\n").map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
  return text.trim().split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
}
export function editSection(nid: string, key: SectionKey, text: string) {
  change(nid, (n) => {
    const s = sectionOf(n, key);
    const parts = split(key, text);
    if (parts.length === s.cur.length && parts.every((p, i) => p === s.cur[i].text)) return;
    const pool = [...s.cur];
    const tag = Date.now().toString(36);
    s.cur = parts.map((p, i) => {
      const j = pool.findIndex((x) => x.text === p);
      if (j >= 0) return pool.splice(j, 1)[0];
      return { id: `${nid}-${key}-d${tag}${i}`, text: p, ev: [], by: "doctor" };
    });
    return `Edited the ${TITLES[key]}`;
  });
}
export const checkSection = (nid: string, key: SectionKey | ListKey, on: boolean) =>
  change(nid, (n) => {
    if (key === "meds" || key === "followups" || key === "updates") n.checks = { ...n.checks, [key]: on };
    else sectionOf(n, key).checked = on;
    return `${on ? "Checked" : "Unchecked"} the ${TITLES[key]}`;
  });
export const restoreSection = (nid: string, key: SectionKey) =>
  change(nid, (n) => {
    const s = sectionOf(n, key);
    s.cur = structuredClone(s.draft);
    s.checked = false;
    return `Restored the scribe's ${TITLES[key]}`;
  });

/** Settle a flag with one of its options. Returns an undo that puts the sentence and flag back. */
export function resolveFlag(nid: string, sid: string, i: number): () => void {
  const n = find(nid);
  const key = n?.sections.find((s) => s.cur.some((x) => x.id === sid))?.key;
  if (!n || !key) return () => {};
  const before = structuredClone(sectionOf(n, key).cur);
  let label = "";
  change(nid, (m) => {
    const s = sectionOf(m, key);
    const x = s.cur.find((y) => y.id === sid);
    const opt = x?.flag?.options[i];
    if (!x || !opt) return;
    label = opt.label;
    if (opt.text === null) s.cur = s.cur.filter((y) => y.id !== sid);
    else Object.assign(x, { text: opt.text, flag: { ...x.flag!, resolved: opt.label } });
    return `Checked: ${opt.label}`;
  });
  return () =>
    change(nid, (m) => {
      sectionOf(m, key).cur = before;
      return `Undid: ${label}`;
    });
}

/** "Add to note" from the transcript: the moment becomes the doctor's sentence, linked to the call. */
export function addMissed(nid: string, segId: string): { sid: string; undo: () => void } | null {
  const n = find(nid);
  const g = n?.transcript.find((x) => x.id === segId);
  if (!n || !g?.missed) return null;
  const to = g.missed.to;
  const sid = `${nid}-${to}-m${segId}`;
  if (sectionOf(n, to).cur.some((x) => x.id === sid)) return null;
  change(nid, (m) => {
    sectionOf(m, to).cur.push({ id: sid, text: g.missed!.text, ev: [{ seg: segId }], by: "doctor" });
    return `Added to the ${TITLES[to]} from the transcript`;
  });
  return {
    sid,
    undo: () =>
      change(nid, (m) => {
        const s = sectionOf(m, to);
        s.cur = s.cur.filter((x) => x.id !== sid);
        return `Took out of the ${TITLES[to]}`;
      }),
  };
}

export const toggleMed = (nid: string, id: string) => change(nid, (n) => void n.meds.forEach((x) => x.id === id && (x.include = !x.include)));
export const toggleFollowUp = (nid: string, id: string) => change(nid, (n) => void n.followups.forEach((x) => x.id === id && (x.include = !x.include)));
export const toggleUpdate = (nid: string, id: string) => change(nid, (n) => void n.updates.forEach((x) => x.id === id && (x.include = !x.include)));
export const markFollowUpDone = (nid: string, id: string) =>
  change(nid, (n) => {
    const f = n.followups.find((x) => x.id === id);
    if (!f) return;
    f.done = !f.done;
    return `${f.done ? "Done" : "Not done"}: ${f.text}`;
  });

/** Who a follow-up goes to when the note is signed. */
export const sentTo = (f: FollowUp) => (f.owner === "Care team" ? `${SIDE.team.name}, Care team` : f.owner === "Dietitian" ? `${SIDE.coach.name}, Dietitian` : null);
export const rxChanges = (n: CallNote) => n.meds.filter((m) => m.action !== "CONTINUE" && m.include);
const prose = (s: NoteSection) => s.cur.map((x) => x.text).join(" ");

/**
 * Sign: the visit goes into the record, included medicine changes become a draft prescription,
 * record updates apply, open flagged symptoms are marked discussed, and (for Aanya, live) the
 * patient summary reaches her app. Returns an undo that puts every piece back.
 */
export function signNote(nid: string, opts: { app: boolean }): { undo: () => void; rx_version: number | null; inApp: boolean } {
  const n = find(nid);
  if (!n) return { undo: () => {}, rx_version: null, inApp: false };
  const snapP = snapshotPatient(n.pid);
  const snapN = structuredClone(n);
  const plan = sectionOf(n, "plan").cur.map((x) => x.text);
  const rec = recordCallNote(n.pid, {
    visit: { id: n.id, note_id: n.id, at: n.call_at, type: n.type, summary: prose(sectionOf(n, "summary")), assessment: prose(sectionOf(n, "assessment")) || undefined, plan },
    rx: rxChanges(n).map((m) => ({ action: m.action as "START" | "CHANGE" | "STOP", name: m.name, strength: m.strength, detail: m.detail })),
    advice: plan.join(". "),
    updates: n.updates.filter((u) => u.include).map((u) => ({ field: u.field, to: u.to })),
  });
  const patientText = prose(sectionOf(n, "patient"));
  const inApp = opts.app && n.pid === "p_aanya" && !!patientText && addAppConsultation({ id: n.id, at: n.call_at, type: n.type, duration_min: n.minutes, doctor: DOCTOR.name, summary: patientText, next_steps: plan });
  if (inApp) refreshClinic();
  const at = stamp();
  change(nid, (m) => {
    m.status = "SIGNED";
    m.signed = { at, by: ME.name, rx_id: rec.rx_id, app: opts.app && !!patientText };
    m.sections.forEach((s) => (s.checked = true));
    m.checks = { meds: true, followups: true, updates: true };
    return "Signed";
  });
  return {
    rx_version: rec.rx_version,
    inApp,
    undo: () => {
      if (snapP) restorePatient(n.pid, snapP, "Undid signing a call note");
      if (inApp) removeAppConsultation(n.id);
      save({ ...read(), notes: read().notes.map((x) => (x.id === nid ? { ...snapN, log: [...snapN.log, { at: stamp(), what: "Signing undone" }] } : x)) });
      refreshClinic();
    },
  };
}

export const addAddendum = (nid: string, text: string) =>
  change(nid, (n) => {
    const body = text.trim();
    if (!body) return;
    n.addenda = [...n.addenda, { at: stamp(), by: ME.name, text: body }];
    return "Signed an addendum";
  });

export function resetNotes() {
  save({ day: new Date().toDateString(), notes: seed() });
}

/* ---------- the patient app's side (POST /doctor/notes/:id/sign delivers it there) ---------- */

/** Prepends the signed summary to the patient app's past consultations. False with no session or care. */
function addAppConsultation(c: AppConsultation): boolean {
  const a = appDb();
  const care = a?.db.care?.[a.uid];
  if (!a || !care) return false;
  care.consultations = [c, ...(care.consultations ?? []).filter((x) => x.id !== c.id)];
  return writeApp(a.db);
}
function removeAppConsultation(id: string) {
  const a = appDb();
  const care = a?.db.care?.[a.uid];
  if (!a || !care?.consultations) return;
  care.consultations = care.consultations.filter((x) => x.id !== id);
  writeApp(a.db);
}
function writeApp(db: AppDb) {
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(db));
  } catch {
    return false;
  }
  // the app's own store and the clinic's both listen for this, so each re-reads in this tab too
  window.dispatchEvent(new StorageEvent("storage", { key: APP_KEY }));
  return true;
}

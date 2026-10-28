/**
 * What a call note's state means, and every change the doctor can make to a draft, as pure
 * functions on ClinicalNote (Arhaan's notes-store logic without the store). An edit returns the new
 * note and one line for its history; the screen saves it with saveClinicalNote. Derived state
 * (ready, blockers, flags) is never stored, so it can never go stale.
 */

import type { ClinicalNote, NoteListKey, NoteSection, NoteSectionKey, NoteSentence } from "@/types/clinicalNote";

export type NoteEdit = { note: ClinicalNote; change: string };
export type Blocker = { label: string; target: string };

export const TITLES: Record<NoteSectionKey | NoteListKey, string> = {
  summary: "Visit summary",
  assessment: "Assessment",
  plan: "Plan",
  patient: "For the patient",
  medicines: "Medicines",
  followUps: "Follow-ups",
  recordUpdates: "Record updates",
};

export const isSectionKey = (key: string): key is NoteSectionKey => key === "summary" || key === "assessment" || key === "plan" || key === "patient";

export const writing = (n: ClinicalNote, now: number) => n.status === "DRAFT" && now < Date.parse(n.readyAt);
export const sectionOf = (n: ClinicalNote, key: NoteSectionKey): NoteSection => n.sections.find((s) => s.key === key) ?? { key, draft: [], current: [], checked: false };
export const openFlags = (n: ClinicalNote) => n.sections.flatMap((s) => s.current.filter((x) => x.flag && !x.flag.resolved));
export const firstName = (n: ClinicalNote) => n.patientName.split(" ")[0];
export const rxChanges = (n: ClinicalNote) => n.medicines.filter((m) => m.action !== "CONTINUE" && m.include);
export const prose = (n: ClinicalNote, key: NoteSectionKey) => sectionOf(n, key).current.map((x) => x.text).join(key === "plan" ? "\n" : " ");

/** What stops signing, each with the element to scroll to. */
export function blockers(n: ClinicalNote): Blocker[] {
  const out: Blocker[] = [];
  const flags = openFlags(n);
  if (flags.length) out.push({ label: `${flags.length} to check`, target: `sent-${flags[0].id}` });
  if (!sectionOf(n, "summary").current.length) out.push({ label: "Visit summary is empty", target: "sec-summary" });
  if (!sectionOf(n, "plan").current.length) out.push({ label: "Plan is empty", target: "sec-plan" });
  return out;
}

/** Written, nothing left to check, nothing empty. The screens call it "Ready to sign". */
export const isReady = (n: ClinicalNote, now: number) => !writing(n, now) && n.status === "DRAFT" && blockers(n).length === 0;

/** Drafts that are written, oldest call first: the longest-waiting note is the liability. */
export const toSign = (notes: ClinicalNote[], now: number) =>
  notes.filter((n) => n.status === "DRAFT" && !writing(n, now)).sort((a, b) => a.callAt.localeCompare(b.callAt));

/** Clinical moments in the call that no sentence in the note uses. */
export function missedOpen(n: ClinicalNote) {
  const cited = new Set(n.sections.flatMap((s) => s.current.flatMap((x) => x.evidence.map((e) => e.segmentId))));
  return n.transcript.filter((g) => g.missed && !cited.has(g.id));
}

/** Edited: the doctor's text differs from the scribe's in any way. */
export const isEdited = (s: NoteSection) => s.current.length !== s.draft.length || s.current.some((x, i) => x.id !== s.draft[i].id || x.text !== s.draft[i].text);

const withSection = (n: ClinicalNote, key: NoteSectionKey, change: (s: NoteSection) => NoteSection): ClinicalNote => ({
  ...n,
  sections: n.sections.some((s) => s.key === key) ? n.sections.map((s) => (s.key === key ? change(s) : s)) : [...n.sections, change(sectionOf(n, key))],
});

export const setSectionText = (n: ClinicalNote, key: NoteSectionKey, current: NoteSentence[]) => withSection(n, key, (s) => ({ ...s, current }));

/** The doctor's text back into sentences: the plan is one point per line, prose splits at full stops. */
function splitText(key: NoteSectionKey, text: string): string[] {
  if (key === "plan") return text.split("\n").map((line) => line.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
  return text.trim().split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
}

/** Unchanged sentences keep their evidence and flags; new ones are the doctor's own. Null when nothing changed. */
export function editSection(n: ClinicalNote, key: NoteSectionKey, text: string): NoteEdit | null {
  const s = sectionOf(n, key);
  const parts = splitText(key, text);
  if (parts.length === s.current.length && parts.every((p, i) => p === s.current[i].text)) return null;
  const pool = [...s.current];
  const tag = Date.now().toString(36);
  const current = parts.map((text, i): NoteSentence => {
    const j = pool.findIndex((x) => x.text === text);
    if (j >= 0) return pool.splice(j, 1)[0];
    return { id: `${n.id}-${key}-d${tag}${i}`, text, evidence: [], by: "doctor", flag: null };
  });
  return { note: setSectionText(n, key, current), change: `Edited the ${TITLES[key]}` };
}

export function checkSection(n: ClinicalNote, key: NoteSectionKey | NoteListKey, on: boolean): NoteEdit {
  const note = isSectionKey(key) ? withSection(n, key, (s) => ({ ...s, checked: on })) : { ...n, checks: { ...n.checks, [key]: on } };
  return { note, change: `${on ? "Checked" : "Unchecked"} the ${TITLES[key]}` };
}

export const restoreSection = (n: ClinicalNote, key: NoteSectionKey): NoteEdit => ({
  note: withSection(n, key, (s) => ({ ...s, current: s.draft, checked: false })),
  change: `Restored the scribe's ${TITLES[key]}`,
});

/** Settle a flag with one of its options. `before` is the section as it was, for Undo. */
export function resolveFlag(n: ClinicalNote, sentenceId: string, option: number) {
  const section = n.sections.find((s) => s.current.some((x) => x.id === sentenceId));
  const sentence = section?.current.find((x) => x.id === sentenceId);
  const chosen = sentence?.flag?.options[option];
  if (!section || !sentence?.flag || !chosen) return null;
  const flag = sentence.flag;
  const current =
    chosen.text === null
      ? section.current.filter((x) => x.id !== sentenceId)
      : section.current.map((x) => (x.id === sentenceId ? { ...x, text: chosen.text ?? x.text, flag: { ...flag, resolved: chosen.label } } : x));
  return { note: setSectionText(n, section.key, current), change: `Checked: ${chosen.label}`, key: section.key, before: section.current, label: chosen.label, removed: chosen.text === null };
}

/** "Add to note" from the transcript: the moment becomes the doctor's sentence, linked to the call. */
export function addMissed(n: ClinicalNote, segmentId: string) {
  const segment = n.transcript.find((g) => g.id === segmentId);
  if (!segment?.missed) return null;
  const to = segment.missed.to;
  const sentenceId = `${n.id}-${to}-m${segmentId}`;
  const section = sectionOf(n, to);
  if (section.current.some((x) => x.id === sentenceId)) return null;
  const sentence: NoteSentence = { id: sentenceId, text: segment.missed.text, evidence: [{ segmentId, quote: null }], by: "doctor", flag: null };
  return { note: setSectionText(n, to, [...section.current, sentence]), change: `Added to the ${TITLES[to]} from the transcript`, to, sentenceId };
}

export const removeSentence = (n: ClinicalNote, key: NoteSectionKey, sentenceId: string): NoteEdit => ({
  note: setSectionText(n, key, sectionOf(n, key).current.filter((x) => x.id !== sentenceId)),
  change: `Took out of the ${TITLES[key]}`,
});

export function toggleMedicine(n: ClinicalNote, id: string): NoteEdit {
  const medicines = n.medicines.map((m) => (m.id === id ? { ...m, include: !m.include } : m));
  const changed = medicines.find((m) => m.id === id);
  return { note: { ...n, medicines }, change: `${changed?.include ? "Included" : "Left out"} ${changed?.name ?? "a medicine"}` };
}

export function toggleFollowUp(n: ClinicalNote, id: string): NoteEdit {
  const followUps = n.followUps.map((f) => (f.id === id ? { ...f, include: !f.include } : f));
  const changed = followUps.find((f) => f.id === id);
  return { note: { ...n, followUps }, change: `${changed?.include ? "Included" : "Left out"}: ${changed?.text ?? "a follow-up"}` };
}

export function toggleRecordUpdate(n: ClinicalNote, id: string): NoteEdit {
  const recordUpdates = n.recordUpdates.map((u) => (u.id === id ? { ...u, include: !u.include } : u));
  const changed = recordUpdates.find((u) => u.id === id);
  return { note: { ...n, recordUpdates }, change: `${changed?.include ? "Included" : "Left out"}: ${changed?.label ?? "a record update"}` };
}

/** After signing, a follow-up can still be ticked off as done. */
export function markFollowUpDone(n: ClinicalNote, id: string): NoteEdit {
  const followUps = n.followUps.map((f) => (f.id === id ? { ...f, done: !f.done } : f));
  const changed = followUps.find((f) => f.id === id);
  return { note: { ...n, followUps }, change: `${changed?.done ? "Done" : "Not done"}: ${changed?.text ?? ""}` };
}

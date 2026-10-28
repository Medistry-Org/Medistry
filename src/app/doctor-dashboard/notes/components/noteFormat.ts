/**
 * Words and times for call notes: visit types, flag titles, empty-section prompts, and the note
 * header's own time formats ("Today, 7 pm"). Clock and date wording come from lib/format/dateTime.
 */

import { clockTime, shortDate } from "@/lib/format/dateTime";
import type {
  Evidence,
  NoteFlagKind,
  NoteSectionKey,
} from "@/types/clinicalNote";
import type { VisitType } from "@/types/patientRecord";

export const VISIT_TYPE: Record<VisitType, string> = {
  FIRST_CONSULTATION: "First consultation",
  FOLLOW_UP: "Follow-up",
};
export const FLAG_TITLE: Record<NoteFlagKind, string> = {
  unclear: "Audio unclear",
  conflict: "Differs from the record",
  unsaid: "Not said on the call",
};
export const PROMPT: Record<NoteSectionKey, string> = {
  summary: "Write the visit summary",
  assessment: "Write your assessment",
  plan: "Add what you told the patient, one point per line",
  patient: "Write the summary the patient will see",
};

/** "7 pm" with a non-breaking space, so a time never breaks across lines. */
export const clock = (iso: string) =>
  clockTime(new Date(iso)).replace(" ", " ");
const sameDay = (a: number, b: number) =>
  new Date(a).toDateString() === new Date(b).toDateString();
export const dayWord = (iso: string, now: number) =>
  sameDay(Date.parse(iso), now)
    ? "Today"
    : sameDay(Date.parse(iso), now - 864e5)
      ? "Yesterday"
      : shortDate(iso);
/** "Today, 8:49 pm", "Yesterday, 7 pm", "3 Oct, 6 pm": one format for every time in a note's header. */
export const dayTime = (iso: string, now: number) =>
  `${dayWord(iso, now)}, ${clock(iso)}`;
export const lowerDay = (text: string) =>
  text.replace(/^(Today|Yesterday)/, (word) => word.toLowerCase());
/** "3 Oct 2026, 6 pm": a signature's timestamp. */
export const stampOf = (iso: string) =>
  `${shortDate(iso)} ${new Date(iso).getFullYear()}, ${clock(iso)}`;
/** "1:20" into the call. */
export const minutesSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export const andList = (items: string[]) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
export const segmentIds = (evidence: Evidence[]) => [
  ...new Set(evidence.map((link) => link.segmentId)),
];

/** The exact words each segment is quoted for, keyed by segment id (for highlighting in the transcript). */
export function quotesBySegment(evidence: Evidence[]) {
  const quotes = new Map<string, string[]>();
  for (const link of evidence)
    if (link.quote)
      quotes.set(link.segmentId, [
        ...(quotes.get(link.segmentId) ?? []),
        link.quote,
      ]);
  return quotes;
}

/** "Dr. Arvind Menon" -> "Dr. Menon", as the transcript names the doctor. */
export const shortDoctorName = (fullName: string) =>
  /^Dr\.?\s/.test(fullName) ? `Dr. ${fullName.split(" ").at(-1)}` : fullName;

/** "her", "his" or "their", from the patient's recorded sex. */
export const possessive = (sex: string) =>
  /^m/i.test(sex) ? "his" : /^f/i.test(sex) ? "her" : "their";

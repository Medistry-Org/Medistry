/*
  How a waiting item (GET /api/doctor/queue) is said and where it opens, shared by Today's queue,
  Today's day list and the patient list. A flagged symptom outranks a report or a draft.
*/

import type { WaitingItem } from "@/types/patientRecord";

/** A waiting item as a short chip: what it is, never the whole sentence. */
export const chipWords = (item: WaitingItem) =>
  item.kind === "symptom"
    ? item.title
    : item.kind === "message"
      ? item.urgent
        ? "Urgent message"
        : item.title
      : item.kind === "lab"
        ? "Report to review"
        : item.kind === "note"
          ? "Note to sign"
          : item.title.replace("Prescription version ", "Prescription v");

/** The same in a few words, for a patient's row in a list. */
const flagWords = (item: WaitingItem) =>
  item.kind === "symptom"
    ? item.severity === "Severe"
      ? "Severe symptom"
      : "Symptom flagged"
    : item.kind === "message"
      ? item.urgent
        ? "Urgent message"
        : "Message for you"
      : item.kind === "lab"
        ? "Report to review"
        : item.kind === "note"
          ? "Note to sign"
          : "To sign";

/** Where an item opens; `from` lets the record's or the note's Back return to the list it came from. */
export const itemHref = (item: WaitingItem, from = "today") =>
  item.kind === "note"
    ? `/doctor-dashboard/notes/${item.id}?from=${from}`
    : item.kind === "message"
      ? `/doctor-dashboard/messages?p=${item.patientId}`
      : `/doctor-dashboard/patients/${item.patientId}?from=${from}${item.kind === "lab" ? "#labs" : item.kind === "rx" ? "#prescriptions" : "#flagged"}`;

/** Each patient's most pressing item in words (the queue arrives most pressing first). */
export function flagsByPatient(items: WaitingItem[]) {
  const flags = new Map<string, string>();
  for (const item of items)
    if (!flags.has(item.patientId)) flags.set(item.patientId, flagWords(item));
  return flags;
}

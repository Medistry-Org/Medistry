/**
 * Call notes the scribe drafts from each transcribed consultation, for the doctor to check and sign.
 * PROPOSED endpoints (not on the backend yet; see docs/backend/doctor-dashboard.md):
 *   GET  /api/doctor/notes                      the doctor's notes (drafts, and signed in the last 30 days)
 *   GET  /api/doctor/notes/:noteId              one note with its transcript
 *   PUT  /api/doctor/notes/:noteId              saves the doctor's edits to a draft (ClinicalNoteChanges)
 *   POST /api/doctor/notes/:noteId/sign         { sendToApp } signs it into the patient's record
 *   POST /api/doctor/notes/:noteId/addenda      { text } adds a signed addendum to a signed note
 * Each write answers with the whole updated note. Reads return null while the backend does not
 * offer the endpoint (404), so screens can say so.
 */

import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import type { ClinicalNote, ClinicalNoteChanges } from "@/types/clinicalNote";

async function nullWhenMissing<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

function toClinicalNote(raw: ClinicalNote): ClinicalNote {
  return {
    ...raw,
    id: String(raw.id),
    patientId: String(raw.patientId),
    sections: raw.sections ?? [],
    medicines: raw.medicines ?? [],
    followUps: raw.followUps ?? [],
    recordUpdates: raw.recordUpdates ?? [],
    checks: raw.checks ?? {},
    transcript: raw.transcript ?? [],
    signed: raw.signed ?? null,
    addenda: raw.addenda ?? [],
    history: raw.history ?? [],
  };
}

const noteFrom = (body: { data?: ClinicalNote }) => toClinicalNote((body.data ?? body) as ClinicalNote);

export function listClinicalNotes(): Promise<ClinicalNote[] | null> {
  return nullWhenMissing(async () => listFrom<ClinicalNote>(await apiRequest("/api/doctor/notes"), "notes").map(toClinicalNote));
}

export function getClinicalNote(noteId: string): Promise<ClinicalNote | null> {
  return nullWhenMissing(async () => noteFrom(await apiRequest(`/api/doctor/notes/${noteId}`)));
}

export async function saveClinicalNote(noteId: string, changes: ClinicalNoteChanges): Promise<ClinicalNote> {
  return noteFrom(await apiRequest(`/api/doctor/notes/${noteId}`, { method: "PUT", body: changes }));
}

export async function signClinicalNote(noteId: string, sendToApp: boolean): Promise<ClinicalNote> {
  return noteFrom(await apiRequest(`/api/doctor/notes/${noteId}/sign`, { method: "POST", body: { sendToApp } }));
}

export async function addNoteAddendum(noteId: string, text: string): Promise<ClinicalNote> {
  return noteFrom(await apiRequest(`/api/doctor/notes/${noteId}/addenda`, { method: "POST", body: { text } }));
}

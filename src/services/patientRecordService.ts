/**
 * A patient's clinical record, from their doctor's side, and the doctor's work queue.
 * PROPOSED endpoints (not on the backend yet; see docs/backend/doctor-dashboard.md):
 *   GET    /api/doctor/patients/:patientId/record                              the record
 *   GET    /api/doctor/patients/snapshots                                      list columns per patient
 *   GET    /api/doctor/queue                                                   what is waiting on the doctor
 *   GET    /api/doctor/work-counts                                             navigation badge counts
 *   GET    /api/doctor/patients/:patientId/photos                              shared progress photos
 *   POST   /api/doctor/patients/:patientId/photos/viewed                       logs a look at the photos
 *   POST   /api/doctor/patients/:patientId/symptoms/:symptomId/acknowledgement { outcome }
 *   DELETE /api/doctor/patients/:patientId/symptoms/:symptomId/acknowledgement (undo)
 *   POST   /api/doctor/patients/:patientId/labs/:labId/review                  { comment }
 *   POST   /api/doctor/patients/:patientId/prescriptions/:prescriptionId/sign
 *   POST   /api/doctor/patients/:patientId/private-notes                       { text }
 * Reads return null while the backend does not offer the endpoint (404), so screens can say so.
 */

import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import type { DoctorWorkCounts, PatientRecord, PatientSnapshot, ProgressPhotoSet, SinceLastVisit, WaitingItem } from "@/types/patientRecord";

const WEEK_MS = 7 * 864e5;

async function nullWhenMissing<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

const dataOf = <T>(body: { data?: T } | T): T => ((body as { data?: T }).data ?? body) as T;

export const careWeekFrom = (careStartedAt: string | null) => (careStartedAt ? Math.max(1, Math.ceil((Date.now() - Date.parse(careStartedAt)) / WEEK_MS)) : null);

/** What changed since the last consultation: the doctor's first question. */
function sinceLastVisitOf(record: PatientRecord): SinceLastVisit | null {
  const last = [...record.visits].sort((a, b) => b.at.localeCompare(a.at))[0];
  if (!last) return null;
  const before = record.weights.filter((w) => w.at <= last.at).at(-1) ?? record.weights[0];
  const latest = record.weights.at(-1);
  const newLab = record.labs.find((l) => (l.reportedAt ?? "") > last.at);
  const newSymptom = record.symptoms.find((s) => s.at > last.at && s.requiresReview);
  const hba1c = newLab?.results.find((r) => r.test === "HbA1c");
  const hba1cBefore = record.labs.find((l) => l !== newLab && l.results.some((r) => r.test === "HbA1c"))?.results.find((r) => r.test === "HbA1c");
  return {
    at: last.at,
    weightChangeKg: before && latest && latest !== before ? Math.round((latest.kg - before.kg) * 10) / 10 : null,
    news: newSymptom
      ? `${newSymptom.label}, ${newSymptom.severity.toLowerCase()}`
      : hba1c
        ? `HbA1c ${hba1c.value}%${hba1cBefore ? `, was ${hba1cBefore.value}%` : ""}`
        : newLab
          ? `${newLab.packageName} ready`
          : null,
  };
}

function toPatientRecord(raw: Partial<PatientRecord>, patientId: string): PatientRecord {
  const record: PatientRecord = {
    patientId,
    programme: raw.programme ?? "",
    city: raw.city ?? "",
    careStartedAt: raw.careStartedAt ?? null,
    identityVerified: raw.identityVerified ?? false,
    heightCm: raw.heightCm ?? null,
    weights: [...(raw.weights ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
    waist: raw.waist ?? null,
    hba1c: [...(raw.hba1c ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
    conditions: raw.conditions ?? [],
    allergies: raw.allergies ?? null,
    outsideMedicines: raw.outsideMedicines ?? null,
    consents: raw.consents ?? [],
    plan: raw.plan ?? null,
    concern: raw.concern ?? "",
    screening: raw.screening ?? null,
    labs: raw.labs ?? [],
    prescriptions: raw.prescriptions ?? [],
    visits: raw.visits ?? [],
    symptoms: raw.symptoms ?? [],
    adherence: raw.adherence ?? null,
    injections: raw.injections ?? null,
    privateNotes: raw.privateNotes ?? [],
    audit: raw.audit ?? [],
    photosShared: raw.photosShared ?? false,
    bmi: null,
    careWeek: careWeekFrom(raw.careStartedAt ?? null),
    sinceLastVisit: null,
  };
  const latestKg = record.weights.at(-1)?.kg;
  record.bmi = latestKg && record.heightCm ? Math.round((latestKg / (record.heightCm / 100) ** 2) * 10) / 10 : null;
  record.sinceLastVisit = sinceLastVisitOf(record);
  return record;
}

export function getPatientRecord(patientId: string): Promise<PatientRecord | null> {
  return nullWhenMissing(async () => {
    const body = await apiRequest<{ data?: Partial<PatientRecord> }>(`/api/doctor/patients/${patientId}/record`);
    return toPatientRecord(dataOf(body), patientId);
  });
}

export function listPatientSnapshots(): Promise<PatientSnapshot[] | null> {
  return nullWhenMissing(async () => {
    const body = await apiRequest("/api/doctor/patients/snapshots");
    return listFrom<Omit<PatientSnapshot, "careWeek">>(body, "patients").map((raw) => ({ ...raw, patientId: String(raw.patientId), careWeek: careWeekFrom(raw.careStartedAt) }));
  });
}

export function listWaitingItems(): Promise<WaitingItem[] | null> {
  return nullWhenMissing(async () => {
    const body = await apiRequest("/api/doctor/queue");
    return listFrom<WaitingItem>(body, "items").map((raw) => ({ ...raw, patientId: String(raw.patientId), severity: raw.severity ?? null, urgent: !!raw.urgent }));
  });
}

export function getWorkCounts(): Promise<DoctorWorkCounts | null> {
  return nullWhenMissing(async () => {
    const raw = dataOf(await apiRequest<{ data?: Partial<DoctorWorkCounts> }>("/api/doctor/work-counts"));
    return { waitingOnYou: raw.waitingOnYou ?? 0, notesToSign: raw.notesToSign ?? 0, messagesForYou: raw.messagesForYou ?? 0 };
  });
}

/** Null when the endpoint is missing or the patient is not sharing photos (403). */
export async function listProgressPhotos(patientId: string): Promise<ProgressPhotoSet[] | null> {
  try {
    const body = await apiRequest(`/api/doctor/patients/${patientId}/photos`);
    const sets = listFrom<ProgressPhotoSet>(body, "sets").sort((a, b) => a.takenAt.localeCompare(b.takenAt));
    return sets.length ? sets : null;
  } catch (caught) {
    if (caught instanceof ApiError && (caught.isMissingEndpoint || caught.status === 403)) return null;
    throw caught;
  }
}

export async function recordPhotoViewing(patientId: string): Promise<void> {
  await apiRequest(`/api/doctor/patients/${patientId}/photos/viewed`, { method: "POST" });
}

export async function acknowledgeSymptom(patientId: string, symptomId: string, outcome: string): Promise<void> {
  await apiRequest(`/api/doctor/patients/${patientId}/symptoms/${symptomId}/acknowledgement`, { method: "POST", body: { outcome } });
}

export async function undoSymptomAcknowledgement(patientId: string, symptomId: string): Promise<void> {
  await apiRequest(`/api/doctor/patients/${patientId}/symptoms/${symptomId}/acknowledgement`, { method: "DELETE" });
}

export async function reviewLabReport(patientId: string, labId: string, comment: string): Promise<void> {
  await apiRequest(`/api/doctor/patients/${patientId}/labs/${labId}/review`, { method: "POST", body: { comment } });
}

export async function signPrescription(patientId: string, prescriptionId: string): Promise<void> {
  await apiRequest(`/api/doctor/patients/${patientId}/prescriptions/${prescriptionId}/sign`, { method: "POST" });
}

export async function addPrivateNote(patientId: string, text: string): Promise<void> {
  await apiRequest(`/api/doctor/patients/${patientId}/private-notes`, { method: "POST", body: { text } });
}

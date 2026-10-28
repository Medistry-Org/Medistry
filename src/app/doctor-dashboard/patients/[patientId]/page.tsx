"use client";

/*
  One patient's record (Arhaan's clinician PatientRecord): everything a doctor needs before and
  during a consultation, safety first. Who the patient is and their next visit come from the team
  endpoints (GET /api/doctor/patients, GET /api/appointments/doctor); the clinical record, photos,
  queue and call notes come from proposed endpoints and the page says so calmly until they exist.
  A first-consultation record shows one "Before the first consultation" panel instead of empty
  prescriptions, plan, labs and visits.
*/

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { errorMessage } from "@/lib/http/apiClient";
import { getSessionUser } from "@/lib/session/authSession";
import { listClinicalNotes } from "@/services/clinicalNotesService";
import { listAllAppointments, listMyPatients } from "@/services/doctorPortalService";
import { getPatientRecord, listProgressPhotos, listWaitingItems, recordPhotoViewing } from "@/services/patientRecordService";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import ActivityPanel from "./components/ActivityPanel";
import FirstConsultationPanel from "./components/FirstConsultationPanel";
import LabsPanel from "./components/LabsPanel";
import OverviewPanel from "./components/OverviewPanel";
import PhotosPanel from "./components/PhotosPanel";
import PlanPanel from "./components/PlanPanel";
import PrescriptionsPanel from "./components/PrescriptionsPanel";
import PrivateNotesPanel from "./components/PrivateNotesPanel";
import RecordHeader, { type RecordOrigin } from "./components/RecordHeader";
import RecordSectionNav, { type RecordChip } from "./components/RecordSectionNav";
import SafetyStrip from "./components/SafetyStrip";
import TrackersPanel from "./components/TrackersPanel";
import VisitsPanel from "./components/VisitsPanel";
import styles from "./PatientRecordPage.module.css";

/** Where the record was opened from (?from=), so the back link returns there. */
const ORIGINS: Record<string, (patientId: string) => RecordOrigin> = {
  today: () => ({ label: "Today", href: "/doctor-dashboard" }),
  schedule: () => ({ label: "Schedule", href: "/doctor-dashboard/schedule" }),
  messages: (patientId) => ({ label: "Messages", href: `/doctor-dashboard/messages?p=${patientId}` }),
  notes: () => ({ label: "Notes", href: "/doctor-dashboard/notes" }),
};

export default function PatientRecordPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const from = useSearchParams().get("from") ?? "";
  const toast = useToast();
  const now = useNow();
  const [doctorName] = useState(() => getSessionUser()?.fullName || "you");

  const patients = useApiResource("doctor-patients", listMyPatients);
  const appointments = useApiResource("doctor-all-appointments", listAllAppointments);
  const record = useApiResource(`record-${patientId}`, () => getPatientRecord(patientId));
  const photos = useApiResource(record.data?.photosShared ? `photos-${patientId}` : null, () => listProgressPhotos(patientId));
  const queue = useApiResource("doctor-queue", listWaitingItems);
  const notes = useApiResource("doctor-notes", listClinicalNotes);

  const nextVisit = useMemo(
    () => (appointments.data ?? []).find((a) => a.patientId === patientId && a.status === "BOOKED" && Date.parse(a.startsAt) + 30 * 6e4 > now),
    [appointments.data, patientId, now],
  );
  const origin = (ORIGINS[from] ?? (() => ({ label: "Patients", href: "/doctor-dashboard/patients" })))(patientId);

  if (patients.error && !patients.data) {
    return (
      <main className={clinicStyles.page}>
        <ErrorNotice message={patients.error} onRetry={patients.reload} />
      </main>
    );
  }
  if (!patients.data || (record.loading && !record.data)) {
    return (
      <main className={clinicStyles.page}>
        <LoadingSkeleton />
      </main>
    );
  }

  const patient = patients.data.find((p) => p.id === patientId);
  if (!patient) {
    return (
      <main className={clinicStyles.page}>
        <h1 className={clinicStyles.h1}>Patient not found</h1>
        <p className={clinicStyles.sub}>
          The record may belong to another doctor. <Link href="/doctor-dashboard/patients">Back to your patients</Link>
        </p>
      </main>
    );
  }

  const data = record.data;
  const message = (queue.data ?? []).find((item) => item.kind === "message" && item.patientId === patientId);
  const noteToSign = (notes.data ?? [])
    .filter((n) => n.patientId === patientId && n.status === "DRAFT" && Date.parse(n.readyAt) <= now)
    .sort((a, b) => a.callAt.localeCompare(b.callAt))[0];
  const header = <RecordHeader patient={patient} record={data ?? null} origin={origin} nextVisit={nextVisit} message={message} now={now} />;

  if (!data) {
    return (
      <main className={clinicStyles.page}>
        {header}
        {record.error ? (
          <ErrorNotice message={record.error} onRetry={record.reload} />
        ) : (
          <section className={clinicStyles.panel}>
            <p className={clinicStyles.empty}>The clinical record is not available yet. Allergies, prescriptions, labs, trackers, notes and visits will appear here.</p>
          </section>
        )}
      </main>
    );
  }

  // a first-consultation record: one panel saying what to collect, never five empty ones
  const fresh = !data.labs.length && !data.plan && !data.prescriptions.length && !data.visits.length;
  const flagged = data.symptoms.some((s) => s.requiresReview && !s.acknowledged);
  const sharedPhotos = photos.data ?? null;
  const chips: RecordChip[] = [
    { id: "overview", label: "Overview" },
    ...(fresh
      ? [{ id: "first", label: "Before the call" }]
      : [
          { id: "prescriptions", label: "Prescriptions", dot: data.prescriptions.some((rx) => rx.status === "DRAFT") ? { label: "draft to sign" } : undefined },
          { id: "plan", label: "Plan" },
          { id: "labs", label: "Labs", dot: data.labs.some((l) => l.status === "DOCTOR_REVIEW_PENDING") ? { label: "needs review" } : undefined },
        ]),
    { id: "trackers", label: "Trackers", dot: flagged ? { label: "flagged symptom", urgent: true } : undefined },
    { id: "notes", label: "Notes" },
    ...(sharedPhotos ? [{ id: "photos", label: "Photos" }] : []),
    ...(fresh ? [] : [{ id: "visits", label: "Visits" }]),
    { id: "activity", label: "Activity" },
  ];

  return (
    <main className={clinicStyles.page}>
      {header}
      <SafetyStrip record={data} onChanged={record.reload} />
      <RecordSectionNav key={fresh ? "fresh" : "care"} chips={chips} />

      <div className={styles.recGrid}>
        <OverviewPanel record={data} sex={patient.sex} />
        {fresh && <FirstConsultationPanel screening={data.screening} />}
        {!fresh && <PrescriptionsPanel patientId={patientId} prescriptions={data.prescriptions} doctorName={doctorName} onChanged={record.reload} />}
        {!fresh && <PlanPanel plan={data.plan} />}
        {!fresh && <LabsPanel patientId={patientId} labs={data.labs} onChanged={record.reload} />}
        <TrackersPanel record={data} onChanged={record.reload} />
        <PrivateNotesPanel patientId={patientId} notes={data.privateNotes} onChanged={record.reload} />
        {sharedPhotos && (
          <PhotosPanel
            sets={sharedPhotos}
            onShow={() =>
              recordPhotoViewing(patientId)
                .then(record.reload)
                .catch((caught) => toast(errorMessage(caught)))
            }
          />
        )}
        {!fresh && <VisitsPanel visits={data.visits} noteToSign={noteToSign} />}
        <ActivityPanel record={data} />
      </div>
    </main>
  );
}

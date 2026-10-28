"use client";

import Link from "next/link";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import { useApiResource } from "@/hooks/useApiResource";
import { getClinicalNote, listClinicalNotes } from "@/services/clinicalNotesService";
import { getMyDoctorProfile, listMyPatients } from "@/services/doctorPortalService";
import { getPatientRecord } from "@/services/patientRecordService";
import { possessive, shortDoctorName } from "./noteFormat";
import NoteReviewBody from "./NoteReviewBody";

/**
 * Loads one call note with what its review needs: the queue of notes to sign, the patient's
 * record (safety facts, prescriptions, flagged symptoms) and the signed-in doctor.
 */
export default function NoteReview({ noteId }: { noteId: string }) {
  const note = useApiResource(`clinical-note-${noteId}`, () => getClinicalNote(noteId));
  const notes = useApiResource("clinical-notes", listClinicalNotes);
  const patientId = note.data?.patientId ?? null;
  const record = useApiResource(patientId ? `patient-record-${patientId}` : null, () => getPatientRecord(patientId ?? ""));
  const patients = useApiResource("doctor-patients", listMyPatients);
  const profile = useApiResource("doctor-profile", getMyDoctorProfile);

  if (note.error && !note.data)
    return (
      <main className={clinicStyles.page}>
        <ErrorNotice message={note.error} onRetry={note.reload} />
      </main>
    );
  if (note.loading || (patientId && record.loading && !record.data && !record.error))
    return (
      <main className={clinicStyles.page}>
        <LoadingSkeleton />
      </main>
    );
  if (!note.data)
    return (
      <main className={clinicStyles.page}>
        <h1 className={clinicStyles.h1}>Note not available</h1>
        <p className={clinicStyles.sub}>
          It may belong to another doctor, or call notes are not available yet. <Link href="/doctor-dashboard/notes">Back to Notes</Link>
        </p>
      </main>
    );

  const fullName = profile.data?.fullName ?? "You";
  return (
    <NoteReviewBody
      note={note.data}
      notes={notes.data ?? []}
      record={record.data}
      their={possessive(patients.data?.find((p) => p.id === note.data?.patientId)?.sex ?? "")}
      doctor={{ name: fullName, shortName: shortDoctorName(fullName), qualification: profile.data?.specialization ?? "", photoUrl: profile.data?.photoUrl ?? null }}
      setNote={note.setData}
      reloadNote={note.reload}
    />
  );
}

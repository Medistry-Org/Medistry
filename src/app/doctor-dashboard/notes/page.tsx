"use client";

import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import { useApiResource } from "@/hooks/useApiResource";
import { listClinicalNotes } from "@/services/clinicalNotesService";
import { listPatientSnapshots } from "@/services/patientRecordService";
import NotesLists from "./components/NotesLists";

/** /doctor-dashboard/notes: the scribe's drafts waiting to be signed, oldest first, and the last month's signed ones. */
export default function NotesPage() {
  const notes = useApiResource("clinical-notes", listClinicalNotes);
  const snapshots = useApiResource("patient-snapshots", listPatientSnapshots);

  return (
    <main className={clinicStyles.page}>
      <div className={clinicStyles.hello}>
        <h1 className={clinicStyles.h1}>Notes</h1>
        <p className={clinicStyles.sub}>The scribe drafts a note from every call. Nothing reaches a record until you sign it.</p>
      </div>
      {notes.error && !notes.data ? (
        <ErrorNotice message={notes.error} onRetry={notes.reload} />
      ) : notes.loading ? (
        <LoadingSkeleton />
      ) : notes.data ? (
        <NotesLists notes={notes.data} snapshots={snapshots.data ?? []} />
      ) : (
        <p className={clinicStyles.empty}>Call notes are not available yet. Drafts appear here once the scribe is connected.</p>
      )}
    </main>
  );
}

"use client";

/**
 * Applies an edit at once and saves it in the background. A save that comes back after a newer
 * edit is ignored; a failed save says so and reloads the note as the backend has it. `latest` is
 * the newest note, for undos that run later.
 */

import { useEffect, useRef } from "react";
import { errorMessage } from "@/lib/http/apiClient";
import { saveClinicalNote } from "@/services/clinicalNoteService";
import type { ClinicalNote } from "@/types/clinicalNote";
import type { NoteEdit } from "@/app/doctor-dashboard/notes/components/noteEdits";

export function useNoteSaving(
  note: ClinicalNote,
  setNote: (note: ClinicalNote) => void,
  reloadNote: () => void,
  toast: (message: string) => void,
) {
  const latest = useRef(note);
  const saveCount = useRef(0);
  useEffect(() => {
    latest.current = note;
  });

  const apply = (edit: NoteEdit | null) => {
    if (!edit) return;
    latest.current = edit.note;
    setNote(edit.note);
    const count = ++saveCount.current;
    const { sections, medicines, followUps, recordUpdates, checks } = edit.note;
    saveClinicalNote(edit.note.id, {
      sections,
      medicines,
      followUps,
      recordUpdates,
      checks,
      change: edit.change,
    })
      .then((saved) => count === saveCount.current && setNote(saved))
      .catch((caught) => {
        toast(errorMessage(caught, "The change was not saved."));
        reloadNote();
      });
  };
  return { apply, latest };
}

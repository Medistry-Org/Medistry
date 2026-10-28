/**
 * What every part of a note under review reads and calls: the note, what the doctor has pinned or
 * is editing, and the actions that save edits. NoteReviewBody provides it.
 */

import { createContext, useContext } from "react";
import type {
  ClinicalNote,
  Evidence,
  NoteSectionKey,
} from "@/types/clinicalNote";
import type { NoteEdit } from "@/app/doctor-dashboard/notes/components/noteEdits";

/** What the doctor has pinned: a sentence, a medicine or a follow-up, and where it was said. */
export type Pin = {
  id: string;
  evidence: Evidence[];
  by: "scribe" | "doctor";
  at: string;
};

/** The signed-in doctor, as the note names them. */
export type ReviewDoctor = {
  name: string;
  shortName: string;
  qualification: string;
  photoUrl: string | null;
};

export type NoteReviewState = {
  note: ClinicalNote;
  done: boolean;
  /** the transcript is on screen (beside the note, or open as a drawer or sheet) */
  shown: boolean;
  pin: Pin | null;
  lit: Set<string>;
  flash: string | null;
  editing: { key: NoteSectionKey; caret?: string } | null;
  undos: Record<string, { label: string; undo: () => void }>;
  hoverable: boolean;
  doctor: ReviewDoctor;
  pinIt: (pin: Pin) => void;
  setHover: (evidence: Evidence[] | null) => void;
  openEditor: (key: NoteSectionKey, caret?: string) => void;
  closeEditor: (key: NoteSectionKey) => void;
  resolve: (sentenceId: string, option: number) => void;
  openTranscript: (segmentId?: string) => void;
  /** saves an edit (null: nothing changed) */
  apply: (edit: NoteEdit | null) => void;
  toast: (message: string, undo?: () => void) => void;
};

export const NoteReviewContext = createContext<NoteReviewState | null>(null);

export function useNoteReview(): NoteReviewState {
  const state = useContext(NoteReviewContext);
  if (!state)
    throw new Error("useNoteReview must be used inside NoteReviewContext");
  return state;
}

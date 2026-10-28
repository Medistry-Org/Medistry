"use client";

/**
 * Settling a flagged sentence with one of its options. Each settled flag keeps an Undo (restores
 * the section as it was) and a short label for the line left in its place; a screen reader hears
 * how many are left to check.
 */

import { useState, type RefObject } from "react";
import type { ClinicalNote } from "@/types/clinicalNote";
import {
  resolveFlag,
  setSectionText,
  type NoteEdit,
} from "@/app/doctor-dashboard/notes/components/noteEdits";
import { openFlags } from "@/app/doctor-dashboard/notes/components/noteState";
import type { NoteReviewState } from "./NoteReviewContext";

export function useFlagResolving({
  note,
  latest,
  apply,
  announce,
}: {
  note: ClinicalNote;
  /** the newest note, so an Undo that runs later restores onto it */
  latest: RefObject<ClinicalNote>;
  apply: (edit: NoteEdit | null) => void;
  announce: (message: string) => void;
}) {
  const [undos, setUndos] = useState<NoteReviewState["undos"]>({});

  const resolve = (sentenceId: string, option: number) => {
    const resolved = resolveFlag(note, sentenceId, option);
    if (!resolved) return;
    apply(resolved);
    const label = resolved.removed ? "removed the sentence" : resolved.label;
    const undo = () =>
      apply({
        note: setSectionText(latest.current, resolved.key, resolved.before),
        change: `Undid: ${resolved.label}`,
      });
    setUndos((current) => ({ ...current, [sentenceId]: { label, undo } }));
    const rest = openFlags(resolved.note).length;
    announce(
      rest
        ? `Checked. ${rest} more to check.`
        : "Checked. Nothing left to check.",
    );
  };

  return { undos, resolve };
}

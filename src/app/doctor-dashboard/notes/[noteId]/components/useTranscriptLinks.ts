"use client";

/**
 * The links between a note and its call: the sentence (or medicine, or follow-up) the doctor has
 * pinned and the moments it came from, stepping through those moments, pressing a moment to light
 * the sentences that use it, and adding a missed moment to the note. `announcement` is read out to
 * screen readers.
 */

import { useState } from "react";
import {
  addMissed,
  removeSentence,
  type NoteEdit,
} from "@/app/doctor-dashboard/notes/components/noteEdits";
import { TITLES } from "@/app/doctor-dashboard/notes/components/noteState";
import type { ClinicalNote, Evidence } from "@/types/clinicalNote";
import { segmentIds } from "@/app/doctor-dashboard/notes/components/noteFormat";
import { centreIn, centrePage, nearestInView } from "./noteScroll";
import type { NoteReviewState, Pin } from "./NoteReviewContext";
import type { ViewportMode } from "./useViewportMode";

export function useTranscriptLinks({
  note,
  latest,
  mode,
  transcriptShown,
  closeSheet,
  apply,
  toast,
}: {
  note: ClinicalNote;
  /** the newest note, for an Undo that runs later */
  latest: { current: ClinicalNote };
  mode: ViewportMode;
  transcriptShown: boolean;
  closeSheet: () => void;
  apply: (edit: NoteEdit | null) => void;
  toast: NoteReviewState["toast"];
}) {
  const [pin, setPin] = useState<Pin | null>(null);
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState<Evidence[] | null>(null);
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [notUsed, setNotUsed] = useState<string | null>(null);
  const [announcement, announce] = useState("");

  const clearPin = () => {
    setPin(null);
    setLit(new Set());
  };
  const pinIt = (next: Pin) => {
    if (pin?.id === next.id) return clearPin();
    setPin(next);
    setStep(0);
    setLit(new Set());
    const moments = segmentIds(next.evidence).length;
    announce(
      moments
        ? `${moments} ${moments === 1 ? "moment" : "moments"} in the transcript`
        : next.by === "doctor"
          ? "Written by you"
          : "Not linked to the call",
    );
    if (transcriptShown && moments)
      requestAnimationFrame(() =>
        centreIn(document.getElementById(`seg-${next.evidence[0].segmentId}`)),
      );
    // in place: the card opens under the paragraph; bring it into view if it opened below the fold
    else requestAnimationFrame(() => nearestInView("evidence"));
  };
  const moveStep = (by: number) => {
    if (!pin) return;
    const segments = segmentIds(pin.evidence);
    const index = (step + by + segments.length) % segments.length;
    setStep(index);
    centreIn(document.getElementById(`seg-${segments[index]}`));
  };
  const showSentence = (sentenceId: string) => {
    if (mode === "narrow") {
      closeSheet();
      window.setTimeout(() => centrePage(`sent-${sentenceId}`), 420);
    } else
      requestAnimationFrame(() =>
        requestAnimationFrame(() => centrePage(`sent-${sentenceId}`)),
      );
  };
  /** A moment pressed in the transcript: light every sentence that uses it, or say none does. */
  const onSegment = (segmentId: string) => {
    const hits = note.sections.flatMap((section) =>
      section.current.filter((sentence) =>
        sentence.evidence.some((evidence) => evidence.segmentId === segmentId),
      ),
    );
    if (!hits.length) {
      setNotUsed(segmentId);
      window.setTimeout(
        () => setNotUsed((current) => (current === segmentId ? null : current)),
        2000,
      );
      return;
    }
    const first = hits[0];
    setPin({
      id: first.id,
      evidence: first.evidence,
      by: first.by,
      at: first.id,
    });
    setStep(Math.max(0, segmentIds(first.evidence).indexOf(segmentId)));
    setLit(new Set(hits.map((hit) => hit.id)));
    announce(
      `${hits.length} ${hits.length === 1 ? "sentence uses" : "sentences use"} this moment`,
    );
    showSentence(first.id);
  };
  /** "Add to note" on a missed moment, with Undo. */
  const onAdd = (segmentId: string) => {
    const added = addMissed(note, segmentId);
    if (!added) return;
    apply(added);
    toast(`Added to the ${TITLES[added.to]}`, () =>
      apply(removeSentence(latest.current, added.to, added.sentenceId)),
    );
    setFlash(added.sentenceId);
    window.setTimeout(
      () =>
        setFlash((current) => (current === added.sentenceId ? null : current)),
      1200,
    );
    showSentence(added.sentenceId);
  };

  return {
    pin,
    setPin,
    clearPin,
    step,
    hover,
    setHover,
    lit,
    flash,
    notUsed,
    announcement,
    announce,
    pinIt,
    moveStep,
    onSegment,
    onAdd,
  };
}

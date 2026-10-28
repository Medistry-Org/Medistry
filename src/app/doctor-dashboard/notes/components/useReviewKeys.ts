"use client";

/**
 * The note review's keyboard shortcuts (listed in ShortcutsMenu): J/K between sections, E to edit,
 * A to tick, F to the next flag, T for the transcript, [ and ] between notes, Cmd+Shift+Enter to
 * sign. Ignored while typing or while a sheet is open.
 */

import { useEffect, useRef } from "react";
import type { ClinicalNote, NoteListKey, NoteSectionKey } from "@/types/clinicalNote";
import { checkSection, isSectionKey, openFlags, sectionOf, type NoteEdit } from "./noteEdits";
import { prefersReducedMotion } from "./noteScroll";

export type ReviewKeyActions = {
  note: ClinicalNote;
  editable: boolean;
  ready: boolean;
  keysOpen: boolean;
  hasPin: boolean;
  drawerOpen: boolean;
  closeKeys: () => void;
  clearPin: () => void;
  closeDrawer: () => void;
  toggleKeys: () => void;
  openEditor: (key: NoteSectionKey) => void;
  apply: (edit: NoteEdit) => void;
  jumpTo: (id: string) => void;
  showTranscript: () => void;
  previousNote: () => void;
  nextNote: () => void;
  startSigning: () => void;
};

function handleReviewKey(e: KeyboardEvent, r: ReviewKeyActions) {
  const target = e.target as HTMLElement;
  if (e.defaultPrevented || target.closest("input, textarea, select, [contenteditable='true']") || document.documentElement.dataset.sheet) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.shiftKey && e.key === "Enter") {
    if (r.ready) {
      e.preventDefault();
      r.startSigning();
    }
    return;
  }
  if (mod || e.altKey) return;
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-sec]"));
  const current = target.closest<HTMLElement>("[data-sec]");
  const i = current ? sections.indexOf(current) : -1;
  const k = e.key;
  if (k === "Escape") {
    if (r.keysOpen) r.closeKeys();
    else if (r.hasPin) r.clearPin();
    else if (r.drawerOpen) r.closeDrawer();
    return;
  }
  const focusSection = (el?: HTMLElement) => {
    if (!el) return;
    e.preventDefault();
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };
  if (k === "j") return focusSection(sections[Math.min(sections.length - 1, i + 1)]);
  if (k === "k") return focusSection(sections[Math.max(0, i - 1)]);
  const key = current?.dataset.sec as NoteSectionKey | NoteListKey | undefined;
  if ((k === "e" || (k === "Enter" && target === current)) && key && r.editable && isSectionKey(key)) {
    e.preventDefault();
    return r.openEditor(key);
  }
  if (k === "a" && key && r.editable) {
    e.preventDefault();
    const on = isSectionKey(key) ? !sectionOf(r.note, key).checked : !r.note.checks[key];
    return r.apply(checkSection(r.note, key, on));
  }
  if (k === "f") {
    const flags = openFlags(r.note)
      .map((x) => document.getElementById(`sent-${x.id}`))
      .filter((x): x is HTMLElement => !!x);
    const next = flags.find((el) => target.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && el !== target) ?? flags[0];
    if (next) {
      e.preventDefault();
      r.jumpTo(next.id);
    }
    return;
  }
  if (k === "t") {
    e.preventDefault();
    return r.showTranscript();
  }
  if (k === "[") return r.previousNote();
  if (k === "]") return r.nextNote();
  if (k === "?") r.toggleKeys();
}

/** Listens for the shortcuts once, always acting on the latest state (`actions` is rebuilt each render). */
export function useReviewKeys(actions: ReviewKeyActions) {
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleReviewKey(e, latest.current);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}

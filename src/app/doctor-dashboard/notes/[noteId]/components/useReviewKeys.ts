"use client";

/**
 * The note review's keyboard shortcuts (listed in ShortcutsMenu): J/K between sections, E to edit,
 * A to tick, F to the next flag, T for the transcript, [ and ] between notes, Cmd+Shift+Enter to
 * sign. Ignored while typing or while a sheet is open.
 */

import { useEffect, useRef } from "react";
import type {
  ClinicalNote,
  NoteListKey,
  NoteSectionKey,
} from "@/types/clinicalNote";
import {
  checkSection,
  type NoteEdit,
} from "@/app/doctor-dashboard/notes/components/noteEdits";
import {
  isSectionKey,
  openFlags,
  sectionOf,
} from "@/app/doctor-dashboard/notes/components/noteState";
import { prefersReducedMotion } from "./noteScroll";

type ReviewKeyActions = {
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

function handleReviewKey(event: KeyboardEvent, actions: ReviewKeyActions) {
  const target = event.target as HTMLElement;
  if (
    event.defaultPrevented ||
    target.closest("input, textarea, select, [contenteditable='true']") ||
    document.documentElement.dataset.sheet
  )
    return;
  const withModifier = event.metaKey || event.ctrlKey;
  if (withModifier && event.shiftKey && event.key === "Enter") {
    if (actions.ready) {
      event.preventDefault();
      actions.startSigning();
    }
    return;
  }
  if (withModifier || event.altKey) return;
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-sec]"),
  );
  const current = target.closest<HTMLElement>("[data-sec]");
  const i = current ? sections.indexOf(current) : -1;
  const pressed = event.key;
  if (pressed === "Escape") {
    if (actions.keysOpen) actions.closeKeys();
    else if (actions.hasPin) actions.clearPin();
    else if (actions.drawerOpen) actions.closeDrawer();
    return;
  }
  const focusSection = (element?: HTMLElement) => {
    if (!element) return;
    event.preventDefault();
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };
  if (pressed === "j")
    return focusSection(sections[Math.min(sections.length - 1, i + 1)]);
  if (pressed === "k") return focusSection(sections[Math.max(0, i - 1)]);
  const key = current?.dataset.sec as NoteSectionKey | NoteListKey | undefined;
  if (
    (pressed === "e" || (pressed === "Enter" && target === current)) &&
    key &&
    actions.editable &&
    isSectionKey(key)
  ) {
    event.preventDefault();
    return actions.openEditor(key);
  }
  if (pressed === "a" && key && actions.editable) {
    event.preventDefault();
    const on = isSectionKey(key)
      ? !sectionOf(actions.note, key).checked
      : !actions.note.checks[key];
    return actions.apply(checkSection(actions.note, key, on));
  }
  if (pressed === "f") {
    const flags = openFlags(actions.note)
      .map((sentence) => document.getElementById(`sent-${sentence.id}`))
      .filter((element): element is HTMLElement => !!element);
    const next =
      flags.find(
        (element) =>
          target.compareDocumentPosition(element) &
            Node.DOCUMENT_POSITION_FOLLOWING && element !== target,
      ) ?? flags[0];
    if (next) {
      event.preventDefault();
      actions.jumpTo(next.id);
    }
    return;
  }
  if (pressed === "t") {
    event.preventDefault();
    return actions.showTranscript();
  }
  if (pressed === "[") return actions.previousNote();
  if (pressed === "]") return actions.nextNote();
  if (pressed === "?") actions.toggleKeys();
}

/** Listens for the shortcuts once, always acting on the latest state (`actions` is rebuilt each render). */
export function useReviewKeys(actions: ReviewKeyActions) {
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) =>
      handleReviewKey(event, latest.current);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}

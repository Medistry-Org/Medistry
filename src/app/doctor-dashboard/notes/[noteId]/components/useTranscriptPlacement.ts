"use client";

/**
 * Where the call's transcript sits beside a note under review: beside the note on a wide laptop
 * (1280px and up), a drawer on a small one, a sheet on a phone. Owns the drawer and the sheet, and
 * opening the transcript at one moment of the call.
 */

import { useCallback, useRef, useState } from "react";
import { centreIn } from "./noteScroll";
import { useViewportMode } from "./useViewportMode";

export function useTranscriptPlacement() {
  const mode = useViewportMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const drawerButton = useRef<HTMLButtonElement>(null);
  const shown =
    mode === "wide" ||
    (mode === "mid" && drawerOpen) ||
    (mode === "narrow" && sheetOpen);

  /** Opens the transcript, then scrolls to the moment (or, with none, focuses the transcript). */
  const open = (segmentId?: string) => {
    if (mode === "mid") setDrawerOpen(true);
    if (mode === "narrow") setSheetOpen(true);
    // the drawer and the sheet mount first, then the moment scrolls into view
    window.setTimeout(
      () =>
        segmentId
          ? centreIn(document.getElementById(`seg-${segmentId}`))
          : transcriptRef.current?.focus({ preventScroll: true }),
      mode === "narrow" ? 460 : 60,
    );
  };
  /** The transcript shortcut: toggles the drawer, focuses the side panel, or opens the sheet. */
  const toggle = () =>
    mode === "mid"
      ? setDrawerOpen((isOpen) => !isOpen)
      : mode === "wide"
        ? transcriptRef.current?.focus()
        : setSheetOpen(true);
  const toggleDrawer = () => setDrawerOpen((isOpen) => !isOpen);
  const closeDrawer = () => {
    setDrawerOpen(false);
    drawerButton.current?.focus();
  };
  const openSheet = () => setSheetOpen(true);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return {
    mode,
    shown,
    drawerOpen,
    sheetOpen,
    transcriptRef,
    drawerButton,
    open,
    toggle,
    toggleDrawer,
    closeDrawer,
    openSheet,
    closeSheet,
  };
}

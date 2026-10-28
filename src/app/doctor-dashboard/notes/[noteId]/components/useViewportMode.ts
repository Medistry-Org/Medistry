"use client";

/** 1280px and up: note and transcript side by side; 1024 to 1279: the transcript as a drawer; below: a sheet. */

import { useEffect, useState } from "react";

export type ViewportMode = "wide" | "mid" | "narrow";

const read = (): ViewportMode =>
  window.matchMedia("(min-width: 1280px)").matches
    ? "wide"
    : window.matchMedia("(min-width: 1024px)").matches
      ? "mid"
      : "narrow";

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState(read);
  useEffect(() => {
    const queries = ["(min-width: 1280px)", "(min-width: 1024px)"].map(
      (media) => window.matchMedia(media),
    );
    const onChange = () => setMode(read());
    queries.forEach((query) => query.addEventListener("change", onChange));
    return () =>
      queries.forEach((query) => query.removeEventListener("change", onChange));
  }, []);
  return mode;
}

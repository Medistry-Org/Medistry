"use client";

import { useEffect, useState } from "react";

export type ViewportMode = "wide" | "mid" | "narrow";

const read = (): ViewportMode => (window.matchMedia("(min-width: 1280px)").matches ? "wide" : window.matchMedia("(min-width: 1024px)").matches ? "mid" : "narrow");

/** 1280px and up: note and transcript side by side; 1024 to 1279: the transcript as a drawer; below: a sheet. */
export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState(read);
  useEffect(() => {
    const queries = ["(min-width: 1280px)", "(min-width: 1024px)"].map((q) => window.matchMedia(q));
    const onChange = () => setMode(read());
    queries.forEach((q) => q.addEventListener("change", onChange));
    return () => queries.forEach((q) => q.removeEventListener("change", onChange));
  }, []);
  return mode;
}

"use client";

import { useEffect, useRef } from "react";
import { Art } from "./Brand";

/**
 * The site's line art for screens without the homepage's reveal script: it draws in once, a
 * moment after the screen arrives, in the same direction and easing as on the homepage.
 */
export default function DrawnArt({ kind, className }: { kind: "ticks" | "arcs"; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current?.firstElementChild;
    if (!el) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <span ref={ref} style={{ display: "contents" }}>
      <Art kind={kind} className={className} />
    </span>
  );
}

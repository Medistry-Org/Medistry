"use client";

/**
 * The brand's isoline arcs behind the onboarding questions (the landing page's `Art`, arcs kind),
 * for a screen without the homepage's reveal script: they draw in once, a moment after the screen
 * arrives, in the same direction and easing as on the homepage. The `.art` classes and the draw-in
 * live in the kit's styles/appTheme.css.
 */

import { useEffect, useRef } from "react";

// centred just outside the corner, so each line crosses both edges at an angle, like isolines
// passing through, instead of dropping straight off the edge
const CENTRE_X = -34;
const CENTRE_Y = 274;
const RADII = [66, 92, 120, 150, 182, 216, 252];
const ARC_PATHS = RADII.map((radius) => {
  const reach = Math.sqrt(radius * radius - 34 * 34);
  return `M0 ${round1(CENTRE_Y - reach)}A${radius} ${radius} 0 0 1 ${round1(CENTRE_X + reach)} 240`;
});

/** Hoisted, so ARC_PATHS above can use it while the constants still read first. */
function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export default function DrawnArcs({ className }: { className: string }) {
  const wrapper = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const art = wrapper.current?.firstElementChild;
    if (!art) return;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => art.classList.add("in")),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  // the wrapper is observed; only the drawing inside it is clipped, so the reveal always fires
  return (
    <span ref={wrapper} style={{ display: "contents" }}>
      <span
        className={`art art--arcs ${className}`}
        suppressHydrationWarning
        data-reveal="draw"
        aria-hidden="true"
      >
        <svg viewBox="0 0 240 240" preserveAspectRatio="xMaxYMin meet">
          {ARC_PATHS.map((path, index) => (
            <path key={index} d={path} />
          ))}
        </svg>
      </span>
    </span>
  );
}

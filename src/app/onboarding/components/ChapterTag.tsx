/** The chapter name above each question, with the brand's three-tick ruler glyph. */

import type { ReactNode } from "react";
import styles from "../OnboardingPage.module.css";

export default function ChapterTag({ children }: { children: ReactNode }) {
  return (
    <p className={`tag ${styles.tag}`}>
      <svg width="9" height="11" viewBox="0 0 9 11" shapeRendering="crispEdges" aria-hidden="true">
        <path d="M1.5 1v9M4.5 1v4.5M7.5 1v6.5" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
      {children}
    </p>
  );
}

/**
 * A screen of the blood test step that is not a single question (the report upload, the home test
 * booking): the chapter tag, the heading and its reason, then the screen's own content and actions.
 */

import type { CSSProperties, ReactNode, RefObject } from "react";
import ChapterTag from "@/app/onboarding/components/ChapterTag";
import styles from "@/app/onboarding/OnboardingPage.module.css";

type Props = {
  /** changes with every screen, so each one arrives with the step animation */
  screenKey: string;
  direction: 1 | -1;
  title: string;
  why?: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
};

export default function BloodTestScreenFrame({
  screenKey,
  direction,
  title,
  why,
  headingRef,
  children,
}: Props) {
  return (
    <div className={`${styles.stage} ${styles.screen}`}>
      <div
        key={screenKey}
        className={styles.step}
        style={{ "--dir": direction } as CSSProperties}
      >
        <ChapterTag>Blood test</ChapterTag>
        <div className={styles.head}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.q}>
            {title}
          </h1>
          {why && <p className={styles.why}>{why}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

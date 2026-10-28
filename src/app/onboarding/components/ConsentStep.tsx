"use client";

/**
 * Question 8: one tick for the four consents care needs, the documents behind "Read them", and
 * the optional AI scribe as its own choice (never bundled with the care consents).
 */

import { useState, type MouseEvent } from "react";
import { CaretDown, CaretRight, Check } from "@phosphor-icons/react";
import Sheet from "@/components/ui/Sheet";
import type { ConsentType } from "@/types/onboarding";
import { CONSENTS, REQUIRED_CONSENTS } from "../onboardingOptions";
import type { DraftChanges, OnboardingDraft } from "../useOnboardingProgress";
import styles from "../OnboardingPage.module.css";

const titleOf = (type: ConsentType | null) => CONSENTS.find((c) => c.type === type)?.title ?? "";

export default function ConsentStep({ draft, update }: { draft: OnboardingDraft; update: (changes: DraftChanges) => void }) {
  const [openDocument, setOpenDocument] = useState<ConsentType | null>(null);
  const allRequired = REQUIRED_CONSENTS.every((c) => draft.consents.includes(c));
  const aiAgreed = draft.consents.includes("AI");
  const shownConsent = CONSENTS.find((c) => c.type === openDocument);

  // a link inside the tick's label: it opens the document and leaves the tick alone
  const openFromLabel = (type: ConsentType) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDocument(type);
  };

  return (
    <div className={styles.consents}>
      <label className={styles.agree} data-on={allRequired}>
        <input
          type="checkbox"
          className={styles.check}
          checked={allRequired}
          onChange={() =>
            update({ consents: allRequired ? draft.consents.filter((c) => !REQUIRED_CONSENTS.includes(c)) : [...new Set([...draft.consents, ...REQUIRED_CONSENTS])] })
          }
        />
        <i className={styles.mark} data-multi="true" aria-hidden="true">
          <Check size={12} weight="bold" />
        </i>
        <span className={styles.agreeText}>
          <strong>I agree</strong> to the terms, privacy notice, use of my health details and video consultations.
        </span>
      </label>
      <details className={styles.readDocs}>
        <summary>
          Read them
          <CaretDown size={14} weight="bold" className={styles.readCaret} aria-hidden="true" />
        </summary>
        <ul>
          {REQUIRED_CONSENTS.map((type) => (
            <li key={type}>
              <button type="button" onClick={() => setOpenDocument(type)}>
                {titleOf(type)}
                <CaretRight size={14} weight="bold" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </details>
      <label className={styles.agree} data-on={aiAgreed} data-optional="true">
        <input
          type="checkbox"
          className={styles.check}
          checked={aiAgreed}
          onChange={() => update({ consents: aiAgreed ? draft.consents.filter((c) => c !== "AI") : [...draft.consents, "AI"] })}
        />
        <i className={styles.mark} data-multi="true" aria-hidden="true">
          <Check size={12} weight="bold" />
        </i>
        <span className={styles.agreeText}>
          <strong>Optional.</strong> Let an{" "}
          <a href="#ai" className={styles.docLink} onClick={openFromLabel("AI")}>
            AI&nbsp;scribe
          </a>{" "}
          transcribe my video calls to draft my doctor&rsquo;s notes.
        </span>
      </label>

      <Sheet open={!!openDocument} onClose={() => setOpenDocument(null)} title={titleOf(openDocument)}>
        {shownConsent && (
          <div className={styles.docs}>
            <p className={styles.docLead}>{shownConsent.line}</p>
            <p>{shownConsent.more}</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

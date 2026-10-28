/*
  The foot of a note under review. A draft: what still stops signing beside the Sign button. A
  signed note: the way on to the next note to sign, then the signature, addenda and history.
*/

import type { ReactNode } from "react";
import type { ClinicalNote } from "@/types/clinicalNote";
import NextToSignLink from "./NextToSignLink";
import SignedFooter from "./SignedFooter";
import styles from "../NoteReviewPage.module.css";

export default function NoteFooter({
  done,
  nextUp,
  toSignCount,
  status,
  signButton,
  onAddAddendum,
}: {
  done: boolean;
  nextUp?: ClinicalNote;
  toSignCount: number;
  status: ReactNode;
  signButton: ReactNode;
  onAddAddendum: (text: string) => Promise<boolean>;
}) {
  if (!done)
    return (
      <div className={styles.signBar}>
        <span className={styles.signText}>{status}</span>
        {signButton}
      </div>
    );
  return (
    <>
      {nextUp && (
        <div className={styles.signBar}>
          <span className={styles.signText}>
            <span className={styles.readyText}>Signed.</span>{" "}
            <span className="num">{toSignCount}</span> more to sign
          </span>
          <NextToSignLink
            note={nextUp}
            label={`Next to sign: ${nextUp.patientName}`}
          />
        </div>
      )}
      <SignedFooter onAddAddendum={onAddAddendum} />
    </>
  );
}

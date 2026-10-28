/** The note's Sign button (sign bar on a laptop, bottom bar on a phone): live once the note is ready. */

import { Signature } from "@phosphor-icons/react";
import styles from "../NoteReviewPage.module.css";

export default function SignButton({
  ready,
  onSign,
}: {
  ready: boolean;
  onSign: () => void;
}) {
  return (
    <button
      type="button"
      className={`btn ${styles.signBtn}`}
      disabled={!ready}
      onClick={onSign}
    >
      <span>Sign</span>
      <span className="well" aria-hidden="true">
        <Signature size={18} />
      </span>
    </button>
  );
}

/** Below a laptop: what stops signing, the transcript button and the main action, within thumb reach. */

import type { ReactNode } from "react";
import { Waveform } from "@phosphor-icons/react";
import styles from "../NoteReviewPage.module.css";

export default function PhoneBottomBar({
  status,
  action,
  onTranscript,
}: {
  status: ReactNode;
  action: ReactNode;
  onTranscript: () => void;
}) {
  return (
    <div className={styles.bottomBar}>
      {status && <p className={styles.bottomStatus}>{status}</p>}
      <div className={styles.bottomRow}>
        <button
          type="button"
          className={`btn btn--ghost ${styles.ghostSm}`}
          onClick={onTranscript}
        >
          <Waveform size={16} aria-hidden="true" /> Transcript
        </button>
        {action}
      </div>
    </div>
  );
}

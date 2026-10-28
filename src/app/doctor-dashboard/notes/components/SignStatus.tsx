import { Fragment } from "react";
import type { Blocker } from "./noteEdits";
import styles from "./NoteReview.module.css";

/** Beside the Sign button: what still stops signing (each a jump to it), or "Ready to sign". */
export default function SignStatus({ isWriting, blockers, uncheckedCount, onJump }: { isWriting: boolean; blockers: Blocker[]; uncheckedCount: number; onJump: (target: string) => void }) {
  if (isWriting) return <span className={styles.statusQuiet}>Available once the draft is written</span>;
  if (blockers.length)
    return (
      <span className={styles.blockers}>
        {blockers.map((b, i) => (
          <Fragment key={b.label}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <button type="button" className={styles.blocker} onClick={() => onJump(b.target)}>
              {b.label}
            </button>
          </Fragment>
        ))}
      </span>
    );
  return (
    <span className={styles.readyText}>
      Ready to sign
      {/* ticking sections is optional: nothing here may read as a blocker */}
      {uncheckedCount > 0 && <span> · ticks optional</span>}
    </span>
  );
}

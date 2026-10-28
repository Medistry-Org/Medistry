import { SealCheck } from "@phosphor-icons/react";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import { dayTime, lowerDay } from "./noteFormat";
import styles from "./NoteReview.module.css";

/** Where the note stands: signed, being written, ready to sign, or a draft. */
export default function NoteStatusPill({
  signedAt,
  isWriting,
  ready,
  now,
  sectionsShown,
  uncheckedCount,
}: {
  signedAt: string | null;
  isWriting: boolean;
  ready: boolean;
  now: number;
  sectionsShown: number;
  uncheckedCount: number;
}) {
  if (signedAt)
    return (
      <span className={clinicStyles.pill} data-tone="ok">
        <SealCheck size={14} weight="fill" aria-hidden="true" /> Signed {lowerDay(dayTime(signedAt, now))}
      </span>
    );
  if (isWriting)
    return (
      <span className={clinicStyles.pill} data-tone="pending">
        <i className={styles.breath} aria-hidden="true" /> Writing
      </span>
    );
  if (!ready)
    return (
      <span className={clinicStyles.pill} data-tone="draft">
        Draft
      </span>
    );
  // ticking sections is optional, so the pill counts them only once one is ticked
  const checked = sectionsShown - uncheckedCount;
  return (
    <span className={clinicStyles.pill} data-tone="ok" title="Nothing left to check and no section empty. Marking sections checked is optional.">
      Ready to sign
      {sectionsShown > 0 && (
        <span className={styles.pillCount}>
          {" "}·{" "}
          {checked > 0 ? (
            <>
              <span className="num">{checked}</span> of <span className="num">{sectionsShown}</span> checked
            </>
          ) : (
            "ticks optional"
          )}
        </span>
      )}
    </span>
  );
}

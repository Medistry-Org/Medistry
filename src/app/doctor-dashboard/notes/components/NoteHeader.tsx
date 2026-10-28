import type { ReactNode, RefObject } from "react";
import Link from "next/link";
import { CaretDown, CaretUp, Waveform } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import type { ClinicalNote } from "@/types/clinicalNote";
import type { PatientRecord } from "@/types/patientRecord";
import { firstName } from "./noteEdits";
import { dayTime, VISIT_TYPE } from "./noteFormat";
import ShortcutsMenu from "./ShortcutsMenu";
import type { ViewportMode } from "./useViewportMode";
import styles from "./NoteReview.module.css";

/** The two safety facts from the record; while the record is not available, say so rather than guess. */
function safetyFacts(record: PatientRecord | null) {
  if (!record) return { allergies: "Not available yet. Ask before prescribing.", allergiesWarn: true, prescription: "Not available yet" };
  const signed = record.prescriptions.find((r) => r.status === "SIGNED");
  return {
    allergies: record.allergies ?? "Not recorded. Ask before prescribing.",
    allergiesWarn: !record.allergies || !/^No known/i.test(record.allergies),
    prescription: signed ? signed.items.map((i) => `${i.name.replace(/ \(.*\)/, "")} ${i.strength}`).join("; ") : "Nothing prescribed",
  };
}

/**
 * The note's header: who and which call, the status pill, moving through the notes to sign, the
 * transcript button on a small laptop, and the two safety facts a doctor checks before agreeing.
 */
export default function NoteHeader({
  note,
  now,
  pill,
  isWriting,
  done,
  stepper,
  mode,
  drawerOpen,
  onToggleDrawer,
  drawerButton,
  hoverable,
  keysOpen,
  setKeysOpen,
  record,
}: {
  note: ClinicalNote;
  now: number;
  pill: ReactNode;
  isWriting: boolean;
  done: boolean;
  stepper: { at: number; total: number; onPrevious: () => void; onNext: () => void } | null;
  mode: ViewportMode;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  drawerButton: RefObject<HTMLButtonElement | null>;
  hoverable: boolean;
  keysOpen: boolean;
  setKeysOpen: (open: boolean) => void;
  /** null while the patient record is not available */
  record: PatientRecord | null;
}) {
  const safety = safetyFacts(record);
  return (
    <header className={styles.head}>
      <div className={styles.headRow}>
        <div className={styles.who}>
          <Avatar name={note.patientName} size={48} />
          <div>
            <h1 className={styles.name}>
              <Link href={`/doctor-dashboard/patients/${note.patientId}`}>{note.patientName}</Link>
            </h1>
            <p className={styles.meta}>
              {VISIT_TYPE[note.type]} by video · <span className="num">{dayTime(note.callAt, now)}</span> · <span className="num">{note.minutes}</span> min ·{" "}
              {note.transcribed ? "Transcribed with consent" : `Not transcribed: ${firstName(note)} did not consent to call transcription`}
            </p>
          </div>
        </div>
        <div className={styles.cluster}>
          <span className={styles.pillWide}>{pill}</span>
          {stepper && (
            <span className={styles.stepper}>
              <span className={`${styles.of} num`}>
                {stepper.at + 1} of {stepper.total}
              </span>
              <button type="button" className={styles.iconBtn} aria-label="Previous note to sign" disabled={stepper.at === 0} onClick={stepper.onPrevious}>
                <CaretUp size={18} />
              </button>
              <button type="button" className={styles.iconBtn} aria-label="Next note to sign" disabled={stepper.at === stepper.total - 1} onClick={stepper.onNext}>
                <CaretDown size={18} />
              </button>
            </span>
          )}
          {mode === "mid" && (
            <button ref={drawerButton} type="button" className={`btn btn--ghost ${styles.ghostSm}`} aria-expanded={drawerOpen} onClick={onToggleDrawer}>
              <Waveform size={16} aria-hidden="true" /> Transcript
            </button>
          )}
          {hoverable && <ShortcutsMenu open={keysOpen} setOpen={setKeysOpen} />}
        </div>
      </div>
      <dl className={styles.safety}>
        <div data-warn={safety.allergiesWarn || undefined}>
          <dt>Allergies</dt>
          <dd>{safety.allergies}</dd>
        </div>
        <div>
          <dt>On prescription</dt>
          <dd>{safety.prescription}</dd>
        </div>
      </dl>
      {!note.transcribed && !done && <p className={styles.info}>No draft or transcript. Write the note from your own notes; sign as usual.</p>}
      {isWriting && (
        <p className={styles.info} aria-live="polite">
          The scribe is writing the note from the <span className="num">{note.minutes}</span>-minute call. About{" "}
          <span className="num">{Math.max(1, Math.ceil((Date.parse(note.readyAt) - now) / 1000))}</span> s.
        </p>
      )}
    </header>
  );
}

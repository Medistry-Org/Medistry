import type { RefObject } from "react";
import { CaretDown, CaretUp, X } from "@phosphor-icons/react";
import SegmentedControl from "@/components/ui/SegmentedControl";
import type { ClinicalNote, TranscriptSegment } from "@/types/clinicalNote";
import { firstName, TITLES } from "./noteEdits";
import { minutesSeconds } from "./noteFormat";
import MarkedText from "./MarkedText";
import styles from "./TranscriptPanel.module.css";

export type TranscriptFilter = "all" | "missed";

/**
 * The call, line by line. Pressing a line lights the sentences that use it; a moment no sentence
 * uses can be added to the note. Sits beside the note, in a drawer, or in a sheet on a phone.
 */
export default function TranscriptPanel({
  note,
  doctorName,
  boxRef,
  lit,
  preview,
  quotes,
  notUsed,
  missed,
  filter,
  setFilter,
  onSegment,
  onAdd,
  step,
  onClose,
}: {
  note: ClinicalNote;
  doctorName: string;
  boxRef: RefObject<HTMLDivElement | null>;
  lit: Set<string>;
  preview: Set<string>;
  quotes: Map<string, string[]>;
  notUsed: string | null;
  missed: TranscriptSegment[];
  filter: TranscriptFilter;
  setFilter: (filter: TranscriptFilter) => void;
  onSegment: (id: string) => void;
  onAdd: (id: string) => void;
  step: { i: number; of: number; move: (by: number) => void; clear: () => void } | null;
  onClose?: () => void;
}) {
  const open = new Set(missed.map((g) => g.id));
  const rows = filter === "missed" ? missed : note.transcript;
  const first = firstName(note);
  return (
    <div ref={boxRef} className={styles.transcript} tabIndex={-1} aria-label="Transcript">
      <div className={styles.tHead}>
        <div className={styles.tTitle}>
          <h2 className={styles.h2}>Transcript</h2>
          {note.transcribed && (
            <span className={styles.secMeta}>
              <span className="num">{note.minutes}</span> min · {note.transcript.some((g) => g.english) ? "English and Hindi" : "English"}
            </span>
          )}
          {onClose && (
            <button type="button" className={styles.iconBtn} aria-label="Close the transcript" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>
        {missed.length > 0 && (
          <SegmentedControl
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              {
                value: "missed",
                label: (
                  <>
                    Not in the note<span className="num">&nbsp;{missed.length}</span>
                  </>
                ),
              },
            ]}
          />
        )}
        {step && (
          <div className={styles.moments}>
            <span className="num">
              {step.i + 1} of {step.of} {step.of === 1 ? "moment" : "moments"}
            </span>
            {step.of > 1 && (
              <>
                <button type="button" className={styles.iconBtn} aria-label="Previous moment" onClick={() => step.move(-1)}>
                  <CaretUp size={16} />
                </button>
                <button type="button" className={styles.iconBtn} aria-label="Next moment" onClick={() => step.move(1)}>
                  <CaretDown size={16} />
                </button>
              </>
            )}
            <button type="button" className={styles.inlineBtn} onClick={step.clear}>
              Clear
            </button>
          </div>
        )}
      </div>
      {!note.transcribed ? (
        <p className={styles.tNone}>Not transcribed. {first} did not consent to call transcription, so there is no draft.</p>
      ) : (
        <ol className={styles.tList} aria-label="Transcript">
          {rows.map((g) => (
            <li key={g.id} id={`seg-${g.id}`} className={styles.tRow} data-lit={lit.has(g.id) || undefined} data-preview={(!lit.has(g.id) && preview.has(g.id)) || undefined}>
              <button type="button" className={styles.tBtn} onClick={() => onSegment(g.id)}>
                <span className={`${styles.tTime} num`}>{minutesSeconds(g.t)}</span>
                <span className={styles.tBody}>
                  <span className={styles.tWho}>{g.who === "doctor" ? doctorName : first}</span>
                  <span className={styles.tText}>
                    <MarkedText text={g.text} quotes={lit.has(g.id) ? quotes.get(g.id) : undefined} unsure={g.unsure} />
                  </span>
                  {g.english && <span className={styles.en}>In English: {g.english}</span>}
                  {notUsed === g.id && <span className={styles.notUsed}>Not used in the note</span>}
                </span>
              </button>
              {open.has(g.id) && g.missed && (
                <span className={styles.missed}>
                  <span className={styles.tag}>Not in the note</span>
                  <button type="button" className={styles.inlineBtn} onClick={() => onAdd(g.id)}>
                    Add to {TITLES[g.missed.to]}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

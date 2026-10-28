"use client";

/**
 * Under a signed note: who signed and when, the prescription its medicine changes became, any
 * addenda, and the note's history. A signed note is never edited: corrections are signed addenda.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";
import { shortDate } from "@/lib/format/dateTime";
import {
  clock,
  dayWord,
  stampOf,
} from "@/app/doctor-dashboard/notes/components/noteFormat";
import { useNoteReview } from "./NoteReviewContext";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import styles from "./NoteSections.module.css";

export default function SignedFooter({
  onAddAddendum,
}: {
  onAddAddendum: (text: string) => Promise<boolean>;
}) {
  const { note } = useNoteReview();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const signed = note.signed;
  if (!signed) return null;
  const signedAt = Date.parse(signed.at);

  return (
    <footer className={styles.signedFoot}>
      <p className={styles.signedBy}>
        <SealCheck size={18} weight="fill" aria-hidden="true" />
        <span>
          Signed by {signed.by}
          {signed.byQualification ? `, ${signed.byQualification}` : ""},{" "}
          <span className="num">{stampOf(signed.at)}</span>
        </span>
      </p>
      {signed.prescriptionVersion !== null && (
        <div className={clinicStyles.confirm}>
          <p>
            {signed.prescriptionStatus === "DRAFT"
              ? `Prescription version ${signed.prescriptionVersion} is a draft.`
              : `Prescription version ${signed.prescriptionVersion} is signed.`}
          </p>
          {signed.prescriptionStatus === "DRAFT" && (
            <div>
              <Link
                href={`/doctor-dashboard/patients/${note.patientId}?from=notes#prescriptions`}
                className="btn"
              >
                <span>Review and sign</span>
                <span className="well" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </Link>
            </div>
          )}
        </div>
      )}
      {note.addenda.length > 0 && (
        <ol className={styles.addenda}>
          {note.addenda.map((addendum) => (
            <li key={addendum.at}>
              <p className={styles.addHead}>
                Addendum · {addendum.by},{" "}
                <span className="num">{stampOf(addendum.at)}</span>
              </p>
              <p>{addendum.text}</p>
            </li>
          ))}
        </ol>
      )}
      {adding ? (
        <form
          className={styles.editor}
          onSubmit={async (event) => {
            event.preventDefault();
            if (!text.trim() || saving) return;
            setSaving(true);
            const saved = await onAddAddendum(text.trim());
            setSaving(false);
            if (!saved) return;
            setText("");
            setAdding(false);
          }}
        >
          <div className={conversationStyles.box}>
            <label htmlFor="addendum" className="sr-only">
              Addendum
            </label>
            <textarea
              id="addendum"
              className={styles.field}
              rows={3}
              value={text}
              autoFocus
              onChange={(event) => setText(event.target.value)}
              placeholder="What to add. The note above stays as signed."
            />
          </div>
          <div className={styles.editFoot}>
            <p className={styles.hint}>
              Signed under your name, with today&apos;s date.
            </p>
            <span className={styles.editActions}>
              <button
                type="button"
                className={styles.inlineBtn}
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${styles.doneBtn}`}
                disabled={!text.trim() || saving}
              >
                Sign addendum
              </button>
            </span>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={clinicStyles.textBtn}
          onClick={() => setAdding(true)}
        >
          Add an addendum
        </button>
      )}
      <details className={clinicStyles.history}>
        <summary>History</summary>
        <ul className={styles.log}>
          {note.history.map((entry, i) => (
            <li key={i}>
              {entry.what},{" "}
              <span className="num">
                {dayWord(entry.at, signedAt) === "Today"
                  ? clock(entry.at)
                  : `${shortDate(entry.at)}, ${clock(entry.at)}`}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </footer>
  );
}

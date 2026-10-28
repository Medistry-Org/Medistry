"use client";

/* Private notes on the record (Arhaan's Notes panel): for the care team only, never shown to the patient. */

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { shortDate } from "@/lib/format/dateTime";
import { errorMessage } from "@/lib/http/apiClient";
import { addPrivateNote } from "@/services/patientRecordService";
import type { PrivateNote } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "./PrivateNotesPanel.module.css";

export default function PrivateNotesPanel({ patientId, notes, onChanged }: { patientId: string; notes: PrivateNote[]; onChanged: () => void }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await addPrivateNote(patientId, text.trim());
      setText("");
      toast("Note saved");
      onChanged();
    } catch (caught) {
      toast(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="notes" className={clinicStyles.panel} aria-labelledby="private-notes-heading">
      <div className={clinicStyles.panelHead}>
        <h2 id="private-notes-heading" className={clinicStyles.h2}>
          Private notes
        </h2>
        <span className={clinicStyles.muted}>Care team only</span>
      </div>
      <form
        className={styles.noteForm}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="sr-only" htmlFor="private-note">
          New note
        </label>
        <textarea id="private-note" className={clinicStyles.textarea} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Never shown to the patient" />
        <button type="submit" className="btn btn--ghost" disabled={!text.trim() || saving}>
          Save note
        </button>
      </form>
      <ul className={styles.notes}>
        {notes.map((note) => (
          <li key={note.id}>
            <p>{note.text}</p>
            <span>
              {note.by}, {shortDate(note.at)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

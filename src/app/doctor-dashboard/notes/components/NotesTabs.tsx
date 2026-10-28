"use client";

/** The two lists on Notes: to sign (written drafts oldest first, then any still being written) and signed in the last 30 days. */

import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import SegmentedControl from "@/components/ui/SegmentedControl";
import type { ClinicalNote } from "@/types/clinicalNote";
import type { PatientSnapshot } from "@/types/patientRecord";
import { toSign, writing } from "./noteState";
import { useUntil } from "./useUntil";
import NoteRow from "./NoteRow";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import styles from "../NotesPage.module.css";

const MONTH_MS = 30 * 864e5;

export default function NotesTabs({
  notes,
  snapshots,
}: {
  notes: ClinicalNote[];
  snapshots: PatientSnapshot[];
}) {
  const [mounted] = useState(() => Date.now());
  const soonest = Math.min(
    Infinity,
    ...notes
      .filter((note) => writing(note, mounted))
      .map((note) => Date.parse(note.readyAt)),
  );
  const now = useUntil(Number.isFinite(soonest) ? soonest : 0);
  const [tab, setTab] = useState<"sign" | "signed">("sign");
  const still = notes
    .filter((note) => writing(note, now))
    .sort((a, b) => a.readyAt.localeCompare(b.readyAt));
  const written = toSign(notes, now);
  // the count is what can be signed now, the same as the badge; one still being written is said apart
  const sign = [...written, ...still];
  const signed = notes
    .filter(
      (note) =>
        note.status === "SIGNED" &&
        note.signed &&
        now - Date.parse(note.signed.at) < MONTH_MS,
    )
    .sort((a, b) => (b.signed?.at ?? "").localeCompare(a.signed?.at ?? ""));
  const list = tab === "sign" ? sign : signed;
  const careTag = (patientId: string) => {
    const snapshot = snapshots.find((entry) => entry.patientId === patientId);
    return snapshot
      ? snapshot.careWeek
        ? `Week ${snapshot.careWeek}`
        : snapshot.programme || null
      : null;
  };

  return (
    <>
      <div className={styles.listTools}>
        <SegmentedControl
          label="Show"
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "sign",
              label: (
                <>
                  To sign<span className="num">&nbsp;{written.length}</span>
                  {still.length > 0 && (
                    <span className={styles.writingCount}>
                      &nbsp;· <span className="num">{still.length}</span> being
                      written
                    </span>
                  )}
                </>
              ),
            },
            { value: "signed", label: "Signed" },
          ]}
        />
      </div>
      {list.length ? (
        <ul className={styles.list}>
          {list.map((listed) => (
            <li key={listed.id}>
              <NoteRow
                note={listed}
                careTag={careTag(listed.patientId)}
                now={now}
              />
            </li>
          ))}
        </ul>
      ) : tab === "sign" ? (
        <div className={`${conversationStyles.empty} ${styles.empty}`}>
          <Check size={22} aria-hidden="true" />
          <p>
            Every note is signed. A draft appears here a minute or two after
            each call.
          </p>
          <button
            type="button"
            className={conversationStyles.linkBtn}
            onClick={() => setTab("signed")}
          >
            See signed notes
          </button>
        </div>
      ) : (
        <div className={`${conversationStyles.empty} ${styles.empty}`}>
          <p>No notes signed in the last 30 days.</p>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import SegmentedControl from "@/components/ui/SegmentedControl";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import type { ClinicalNote } from "@/types/clinicalNote";
import type { PatientSnapshot } from "@/types/patientRecord";
import { toSign, writing } from "./noteEdits";
import { useUntil } from "./useUntil";
import NoteRow from "./NoteRow";
import styles from "../NotesPage.module.css";

const MONTH_MS = 30 * 864e5;

/** The two lists on Notes: to sign (written drafts oldest first, then any still being written) and signed in the last 30 days. */
export default function NotesLists({ notes, snapshots }: { notes: ClinicalNote[]; snapshots: PatientSnapshot[] }) {
  const [mounted] = useState(() => Date.now());
  const soonest = Math.min(Infinity, ...notes.filter((n) => writing(n, mounted)).map((n) => Date.parse(n.readyAt)));
  const now = useUntil(Number.isFinite(soonest) ? soonest : 0);
  const [tab, setTab] = useState<"sign" | "signed">("sign");
  const still = notes.filter((n) => writing(n, now)).sort((a, b) => a.readyAt.localeCompare(b.readyAt));
  const written = toSign(notes, now);
  // the count is what can be signed now, the same as the badge; one still being written is said apart
  const sign = [...written, ...still];
  const signed = notes
    .filter((n) => n.status === "SIGNED" && n.signed && now - Date.parse(n.signed.at) < MONTH_MS)
    .sort((a, b) => (b.signed?.at ?? "").localeCompare(a.signed?.at ?? ""));
  const list = tab === "sign" ? sign : signed;
  const careTag = (patientId: string) => {
    const snapshot = snapshots.find((s) => s.patientId === patientId);
    return snapshot ? (snapshot.careWeek ? `Week ${snapshot.careWeek}` : snapshot.programme || null) : null;
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
                      &nbsp;· <span className="num">{still.length}</span> being written
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
          {list.map((n) => (
            <li key={n.id}>
              <NoteRow note={n} careTag={careTag(n.patientId)} now={now} />
            </li>
          ))}
        </ul>
      ) : tab === "sign" ? (
        <div className={`${conversationStyles.empty} ${styles.empty}`}>
          <Check size={22} aria-hidden="true" />
          <p>Every note is signed. A draft appears here a minute or two after each call.</p>
          <button type="button" className={conversationStyles.linkBtn} onClick={() => setTab("signed")}>
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

/** Below a laptop the review is a pushed screen with its own top bar: back, who, and the status pill. */

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import type { BackDestination } from "@/lib/navigation/backDestination";
import type { ClinicalNote } from "@/types/clinicalNote";
import {
  dayWord,
  VISIT_TYPE,
} from "@/app/doctor-dashboard/notes/components/noteFormat";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import styles from "../NoteReviewPage.module.css";

export default function PhoneTopBar({
  note,
  now,
  pill,
  back,
}: {
  note: ClinicalNote;
  now: number;
  pill: ReactNode;
  back: BackDestination;
}) {
  return (
    <div className={styles.topBar}>
      <Link
        href={back.href}
        className={conversationStyles.back}
        aria-label={`Back to ${back.label}`}
      >
        <ArrowLeft size={18} />
      </Link>
      <Avatar name={note.patientName} size={32} />
      <div className={styles.topWho}>
        <h1>
          <Link
            href={`/doctor-dashboard/patients/${note.patientId}?from=notes`}
          >
            {note.patientName}
          </Link>
        </h1>
        <span>
          {VISIT_TYPE[note.type]} · {dayWord(note.callAt, now)}
        </span>
      </div>
      {pill}
    </div>
  );
}

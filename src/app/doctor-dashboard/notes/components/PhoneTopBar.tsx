import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import type { ClinicalNote } from "@/types/clinicalNote";
import { dayWord, VISIT_TYPE } from "./noteFormat";
import styles from "./NoteReview.module.css";

/** Below a laptop the review is a pushed screen with its own top bar: back, who, and the status pill. */
export default function PhoneTopBar({ note, now, pill }: { note: ClinicalNote; now: number; pill: ReactNode }) {
  return (
    <div className={styles.topBar}>
      <Link href="/doctor-dashboard/notes" className={conversationStyles.back} aria-label="Back to notes">
        <ArrowLeft size={18} />
      </Link>
      <Avatar name={note.patientName} size={32} />
      <div className={styles.topWho}>
        <h1>
          <Link href={`/doctor-dashboard/patients/${note.patientId}`}>{note.patientName}</Link>
        </h1>
        <span>
          {VISIT_TYPE[note.type]} · {dayWord(note.callAt, now)}
        </span>
      </div>
      {pill}
    </div>
  );
}

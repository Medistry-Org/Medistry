import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import Avatar from "@/components/ui/Avatar";
import conversationStyles from "@/app/doctor-dashboard/styles/ClinicConversations.module.css";
import { shortDate, timeAgo } from "@/lib/format/dateTime";
import type { ClinicalNote } from "@/types/clinicalNote";
import { blockers, isReady, openFlags, sectionOf, writing } from "./noteEdits";
import { clock, dayWord, VISIT_TYPE } from "./noteFormat";
import listStyles from "../NotesPage.module.css";

/** One note in the list: who, which call, its first line, and where it stands. `careTag`: "Week 6" or the programme. */
export default function NoteRow({ note, careTag, now }: { note: ClinicalNote; careTag: string | null; now: number }) {
  const isWriting = writing(note, now);
  const flags = openFlags(note).length;
  const first = sectionOf(note, "summary").current[0]?.text;
  const line = isWriting ? "Writing the note from the call" : !note.transcribed && !first ? "Not transcribed. Write the note yourself." : (first ?? "No summary yet");
  return (
    <Link href={`/doctor-dashboard/notes/${note.id}`} className={`${conversationStyles.item} ${listStyles.row}`}>
      <Avatar name={note.patientName} size={40} />
      <span className={conversationStyles.itemText}>
        <span className={conversationStyles.itemTop}>
          <strong>{note.patientName}</strong>
          <span className={`${conversationStyles.itemWhen} num`}>{note.signed ? clock(note.signed.at) : timeAgo(note.callAt, now)}</span>
        </span>
        <span className={listStyles.rowMeta}>
          {VISIT_TYPE[note.type]} · {dayWord(note.callAt, now)}, <span className="num">{clock(note.callAt)}</span> · <span className="num">{note.minutes}</span> min
        </span>
        <span className={conversationStyles.snippet} data-quiet={isWriting || !first || undefined}>
          <span>{line}</span>
        </span>
        <span className={conversationStyles.tags}>
          {note.signed ? (
            <span className={listStyles.tag}>Signed {shortDate(note.signed.at)}</span>
          ) : isWriting ? (
            <span className={listStyles.tag}>
              <i className={listStyles.breath} aria-hidden="true" /> Writing
            </span>
          ) : !note.transcribed && !first ? (
            <span className={listStyles.tag}>Not transcribed</span>
          ) : flags ? (
            <span className={conversationStyles.tag} data-kind="urgent">
              <WarningCircle size={13} weight="fill" aria-hidden="true" /> {flags} to check
            </span>
          ) : isReady(note, now) ? (
            <span className={conversationStyles.tag} data-kind="you">
              Ready to sign
            </span>
          ) : (
            <span className={listStyles.tag}>{blockers(note)[0]?.label}</span>
          )}
          {careTag && <span className={conversationStyles.tagQuiet}>{careTag}</span>}
        </span>
      </span>
    </Link>
  );
}

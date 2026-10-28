import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import type { ClinicalNote } from "@/types/clinicalNote";
import styles from "./NoteReview.module.css";

/** After signing: straight on to the next note waiting. */
export default function NextToSignLink({ note, label }: { note: ClinicalNote; label: string }) {
  return (
    <Link href={`/doctor-dashboard/notes/${note.id}`} className={`btn ${styles.signBtn}`}>
      <span>{label}</span>
      <span className="well" aria-hidden="true">
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}

"use client";

import { useParams } from "next/navigation";
import NoteReview from "../components/NoteReview";

/** /doctor-dashboard/notes/[noteId]: one call note to check, edit and sign. */
export default function NoteReviewPage() {
  const { noteId } = useParams<{ noteId: string }>();
  return <NoteReview key={noteId} noteId={noteId} />;
}

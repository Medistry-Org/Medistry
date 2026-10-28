/** What sits under a paragraph or a plan point: its open flags, settled flags, and the evidence card. */

import type { NoteSectionKey } from "@/types/clinicalNote";
import { sectionOf } from "@/app/doctor-dashboard/notes/components/noteState";
import { useNoteReview } from "./NoteReviewContext";
import EvidenceCard from "./EvidenceCard";
import FlagCard from "./FlagCard";
import SettledFlag from "./SettledFlag";

export default function SentenceUnder({
  sectionKey,
  ids,
}: {
  sectionKey: NoteSectionKey;
  ids: string[];
}) {
  const review = useNoteReview();
  const { note, pin, done } = review;
  const section = sectionOf(note, sectionKey);
  const rows = section.current.filter((sentence) => ids.includes(sentence.id));
  // a flag settled by removing its sentence leaves only its Undo, under the paragraph it came from
  const removed =
    sectionKey !== "plan"
      ? Object.entries(review.undos).filter(
          ([id, undo]) =>
            id.startsWith(`${note.id}-${sectionKey}-`) &&
            !section.current.some((sentence) => sentence.id === id) &&
            undo.label === "removed the sentence",
        )
      : [];
  return (
    <>
      {pin &&
        !review.shown &&
        rows.some((sentence) => sentence.id === pin.at) && <EvidenceCard />}
      {!done &&
        rows.map((sentence) =>
          sentence.flag && !sentence.flag.resolved ? (
            <FlagCard
              key={sentence.id}
              sentence={sentence}
              sectionKey={sectionKey}
            />
          ) : sentence.flag?.resolved ? (
            <SettledFlag
              key={sentence.id}
              sentenceId={sentence.id}
              label={sentence.flag.resolved}
            />
          ) : null,
        )}
      {!done &&
        removed.map(([id]) => (
          <SettledFlag key={id} sentenceId={id} label="removed the sentence" />
        ))}
    </>
  );
}

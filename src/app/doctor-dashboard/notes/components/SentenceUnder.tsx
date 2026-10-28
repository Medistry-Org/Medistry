import type { NoteSectionKey } from "@/types/clinicalNote";
import { sectionOf } from "./noteEdits";
import { useNoteReview } from "./NoteReviewContext";
import EvidenceCard from "./EvidenceCard";
import FlagCard from "./FlagCard";
import SettledFlag from "./SettledFlag";

/** What sits under a paragraph or a plan point: its open flags, settled flags, and the evidence card. */
export default function SentenceUnder({ sectionKey, ids }: { sectionKey: NoteSectionKey; ids: string[] }) {
  const review = useNoteReview();
  const { note, pin, done } = review;
  const section = sectionOf(note, sectionKey);
  const rows = section.current.filter((y) => ids.includes(y.id));
  // a flag settled by removing its sentence leaves only its Undo, under the paragraph it came from
  const removed =
    sectionKey !== "plan"
      ? Object.entries(review.undos).filter(([id, u]) => id.startsWith(`${note.id}-${sectionKey}-`) && !section.current.some((y) => y.id === id) && u.label === "removed the sentence")
      : [];
  return (
    <>
      {pin && !review.shown && rows.some((y) => y.id === pin.at) && <EvidenceCard />}
      {!done &&
        rows.map((y) =>
          y.flag && !y.flag.resolved ? <FlagCard key={y.id} sentence={y} sectionKey={sectionKey} /> : y.flag?.resolved ? <SettledFlag key={y.id} sentenceId={y.id} label={y.flag.resolved} /> : null,
        )}
      {!done && removed.map(([id]) => <SettledFlag key={id} sentenceId={id} label="removed the sentence" />)}
    </>
  );
}

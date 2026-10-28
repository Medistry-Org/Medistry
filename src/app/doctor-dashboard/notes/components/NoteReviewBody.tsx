"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Signature } from "@phosphor-icons/react";
import Sheet from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/ToastProvider";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import { errorMessage } from "@/lib/http/apiClient";
import { addNoteAddendum, signClinicalNote } from "@/services/clinicalNotesService";
import type { ClinicalNote, Evidence, NoteListKey, NoteSectionKey } from "@/types/clinicalNote";
import type { PatientRecord } from "@/types/patientRecord";
import { addMissed, blockers, firstName, isReady, missedOpen, openFlags, removeSentence, resolveFlag, sectionOf, setSectionText, TITLES, toSign, writing } from "./noteEdits";
import { segmentIds } from "./noteFormat";
import { centreIn, centrePage, nearestInView, scrollPageTop } from "./noteScroll";
import { NoteReviewContext, type NoteReviewState, type Pin, type ReviewDoctor } from "./NoteReviewContext";
import { useReviewKeys } from "./useReviewKeys";
import { useNoteSaving } from "./useNoteSaving";
import { useUntil } from "./useUntil";
import { useViewportMode } from "./useViewportMode";
import FollowUpsSection from "./FollowUpsSection";
import MedicinesSection from "./MedicinesSection";
import NextToSignLink from "./NextToSignLink";
import NoteHeader from "./NoteHeader";
import NoteStatusPill from "./NoteStatusPill";
import PhoneBottomBar from "./PhoneBottomBar";
import PhoneTopBar from "./PhoneTopBar";
import ProseSection from "./ProseSection";
import RecordUpdatesSection from "./RecordUpdatesSection";
import SignedFooter from "./SignedFooter";
import SignSheet from "./SignSheet";
import SignStatus from "./SignStatus";
import TranscriptPanel, { type TranscriptFilter } from "./TranscriptPanel";
import styles from "./NoteReview.module.css";
import bodyStyles from "./NoteBody.module.css";

/**
 * One call note: the draft to check, edit and sign, with the call's transcript beside it. Every
 * edit shows at once and is saved in the background; if a save fails the note reloads as the
 * backend has it. Signing has no Undo: a signed note is final, and corrections are signed addenda.
 */
export default function NoteReviewBody({
  note,
  notes,
  record,
  their,
  doctor,
  setNote,
  reloadNote,
}: {
  note: ClinicalNote;
  /** every note, for the queue of notes to sign */
  notes: ClinicalNote[];
  /** null while the patient record is not available */
  record: PatientRecord | null;
  their: string;
  doctor: ReviewDoctor;
  setNote: (note: ClinicalNote) => void;
  reloadNote: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const mode = useViewportMode();
  const now = useUntil(note.status === "DRAFT" ? Date.parse(note.readyAt) : 0);
  const [fadeIn] = useState(() => writing(note, Date.now()));
  const [hoverable] = useState(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  const [pin, setPin] = useState<Pin | null>(null);
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState<Evidence[] | null>(null);
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [notUsed, setNotUsed] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ key: NoteSectionKey; caret?: string } | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [signing, setSigning] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const [filter, setFilter] = useState<TranscriptFilter>("all");
  const [live, setLive] = useState("");
  const [undos, setUndos] = useState<NoteReviewState["undos"]>({});
  // set when the doctor signs: the note after this one in the queue, so the sign bar can point onwards
  const [after, setAfter] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const drawerButton = useRef<HTMLButtonElement>(null);

  const { apply, latest } = useNoteSaving(note, setNote, reloadNote, toast);

  const queueSource = notes.some((x) => x.id === note.id) ? notes.map((x) => (x.id === note.id ? note : x)) : [...notes, note];
  const queue = toSign(queueSource, now);
  const at = queue.findIndex((x) => x.id === note.id);
  const go = (to?: ClinicalNote) => to && router.push(`/doctor-dashboard/notes/${to.id}`);
  const shown = mode === "wide" || (mode === "mid" && drawer) || (mode === "narrow" && sheet);

  const first = firstName(note);
  const isWriting = writing(note, now);
  const done = note.status === "SIGNED";
  const ready = isReady(note, now);
  const block = blockers(note);
  const missed = done ? [] : missedOpen(note);
  const nextPrescriptionVersion = Math.max(0, ...(record?.prescriptions ?? []).map((r) => r.version)) + 1;
  const showMedicines = note.transcribed || note.medicines.length > 0;
  const showFollowUps = note.transcribed || note.followUps.length > 0;
  const listKeys: NoteListKey[] = [...(showMedicines ? (["medicines"] as const) : []), ...(showFollowUps ? (["followUps"] as const) : []), ...(note.recordUpdates.length ? (["recordUpdates"] as const) : [])];
  const listHasRows = (k: NoteListKey) => (k !== "medicines" || note.medicines.length > 0) && (k !== "followUps" || note.followUps.length > 0);
  const unchecked = [...note.sections.filter((s) => s.current.length && !s.checked).map((s) => TITLES[s.key]), ...listKeys.filter((k) => !note.checks[k] && listHasRows(k)).map((k) => TITLES[k])];
  const nextUp = queueSource.find((x) => x.id === after && x.status === "DRAFT") ?? queue.find((x) => x.id !== note.id);
  const sectionsShown = note.sections.filter((s) => s.current.length).length + listKeys.filter(listHasRows).length;
  const flaggedSymptoms = record?.symptoms.filter((s) => s.requiresReview && !s.acknowledged) ?? [];

  const pinIt = (x: Pin) => {
    if (pin?.id === x.id) {
      setPin(null);
      setLit(new Set());
      return;
    }
    setPin(x);
    setStep(0);
    setLit(new Set());
    const moments = segmentIds(x.evidence).length;
    setLive(moments ? `${moments} ${moments === 1 ? "moment" : "moments"} in the transcript` : x.by === "doctor" ? "Written by you" : "Not linked to the call");
    if (shown && moments) requestAnimationFrame(() => centreIn(document.getElementById(`seg-${x.evidence[0].segmentId}`)));
    // in place: the card opens under the paragraph; bring it into view if it opened below the fold
    else requestAnimationFrame(() => nearestInView("evidence"));
  };
  const moveStep = (by: number) => {
    if (!pin) return;
    const segments = segmentIds(pin.evidence);
    const i = (step + by + segments.length) % segments.length;
    setStep(i);
    centreIn(document.getElementById(`seg-${segments[i]}`));
  };
  const openTranscript = (segmentId?: string) => {
    if (mode === "mid") setDrawer(true);
    if (mode === "narrow") setSheet(true);
    const target = segmentId ?? pin?.evidence[0]?.segmentId;
    // the drawer and the sheet mount first, then the moment scrolls into view
    window.setTimeout(() => (target ? centreIn(document.getElementById(`seg-${target}`)) : transcriptRef.current?.focus({ preventScroll: true })), mode === "narrow" ? 460 : 60);
  };
  const showSentence = (sentenceId: string) => {
    if (mode === "narrow") {
      setSheet(false);
      window.setTimeout(() => centrePage(`sent-${sentenceId}`), 420);
    } else requestAnimationFrame(() => requestAnimationFrame(() => centrePage(`sent-${sentenceId}`)));
  };
  const onSegment = (segmentId: string) => {
    const hits = note.sections.flatMap((s) => s.current.filter((x) => x.evidence.some((e) => e.segmentId === segmentId)));
    if (!hits.length) {
      setNotUsed(segmentId);
      window.setTimeout(() => setNotUsed((v) => (v === segmentId ? null : v)), 2000);
      return;
    }
    const x = hits[0];
    setPin({ id: x.id, evidence: x.evidence, by: x.by, at: x.id });
    setStep(Math.max(0, segmentIds(x.evidence).indexOf(segmentId)));
    setLit(new Set(hits.map((h) => h.id)));
    setLive(`${hits.length} ${hits.length === 1 ? "sentence uses" : "sentences use"} this moment`);
    showSentence(x.id);
  };
  const onAdd = (segmentId: string) => {
    const added = addMissed(note, segmentId);
    if (!added) return;
    apply(added);
    toast(`Added to the ${TITLES[added.to]}`, () => apply(removeSentence(latest.current, added.to, added.sentenceId)));
    setFlash(added.sentenceId);
    window.setTimeout(() => setFlash((v) => (v === added.sentenceId ? null : v)), 1200);
    showSentence(added.sentenceId);
  };
  const openEditor = (key: NoteSectionKey, caret?: string) => {
    setPin(null);
    setEditing({ key, caret });
  };
  const closeEditor = (key: NoteSectionKey) => {
    setEditing(null);
    requestAnimationFrame(() => (document.getElementById(`edit-${key}`) ?? document.getElementById(`sec-${key}`))?.focus({ preventScroll: true }));
  };
  const resolve = (sentenceId: string, option: number) => {
    const resolved = resolveFlag(note, sentenceId, option);
    if (!resolved) return;
    apply(resolved);
    const label = resolved.removed ? "removed the sentence" : resolved.label;
    const undo = () => apply({ note: setSectionText(latest.current, resolved.key, resolved.before), change: `Undid: ${resolved.label}` });
    setUndos((u) => ({ ...u, [sentenceId]: { label, undo } }));
    const rest = openFlags(resolved.note).length;
    setLive(rest ? `Checked. ${rest} more to check.` : "Checked. Nothing left to check.");
  };
  const sign = (sendToApp: boolean) => {
    setSigning(false);
    const hasText = sectionOf(note, "patient").current.length > 0;
    // the next note waiting after this one, else the first before it
    setAfter((queue.slice(at + 1).find((x) => x.id !== note.id) ?? queue.find((x) => x.id !== note.id))?.id ?? null);
    signClinicalNote(note.id, sendToApp)
      .then((signed) => {
        setNote(signed);
        toast(`Signed. In ${first}'s record${sendToApp && hasText ? `, and ${their} summary is in ${their} app` : ""}`);
        scrollPageTop();
      })
      .catch((caught) => toast(errorMessage(caught, "The note was not signed.")));
  };
  const addAddendum = async (text: string) => {
    try {
      setNote(await addNoteAddendum(note.id, text));
      toast("Addendum signed");
      return true;
    } catch (caught) {
      toast(errorMessage(caught, "The addendum was not saved."));
      return false;
    }
  };
  const jumpTo = (target: string) => {
    const el = document.getElementById(target);
    if (!el) return;
    centrePage(target);
    el.focus({ preventScroll: true });
  };
  const closeDrawer = () => {
    setDrawer(false);
    drawerButton.current?.focus();
  };
  const closeSheet = useCallback(() => setSheet(false), []);
  const closeSigning = useCallback(() => setSigning(false), []);

  useReviewKeys({
    note,
    editable: !done && !isWriting,
    ready,
    keysOpen,
    hasPin: !!pin,
    drawerOpen: drawer,
    closeKeys: () => setKeysOpen(false),
    clearPin: () => {
      setPin(null);
      setLit(new Set());
    },
    closeDrawer,
    toggleKeys: () => setKeysOpen((v) => !v),
    openEditor,
    apply,
    jumpTo,
    showTranscript: () => (mode === "mid" ? setDrawer((v) => !v) : mode === "wide" ? transcriptRef.current?.focus() : setSheet(true)),
    previousNote: () => at > 0 && go(queue[at - 1]),
    nextNote: () => at >= 0 && at < queue.length - 1 && go(queue[at + 1]),
    startSigning: () => setSigning(true),
  });

  const context: NoteReviewState = { note, done, shown, pin, lit, flash, editing, undos, hoverable, doctor, pinIt, setHover, openEditor, closeEditor, resolve, openTranscript, apply, toast };
  const pinSegments = pin ? segmentIds(pin.evidence) : [];
  const quotes = new Map<string, string[]>();
  for (const e of pin?.evidence ?? []) if (e.quote) quotes.set(e.segmentId, [...(quotes.get(e.segmentId) ?? []), e.quote]);
  const transcript = (
    <TranscriptPanel
      note={note}
      doctorName={doctor.shortName}
      boxRef={transcriptRef}
      lit={new Set(pinSegments)}
      preview={new Set((hover ?? []).map((e) => e.segmentId))}
      quotes={quotes}
      notUsed={notUsed}
      missed={missed}
      filter={missed.length ? filter : "all"}
      setFilter={setFilter}
      onSegment={onSegment}
      onAdd={onAdd}
      step={pin && pinSegments.length ? { i: step, of: pinSegments.length, move: moveStep, clear: () => setPin(null) } : null}
      onClose={mode === "mid" ? closeDrawer : undefined}
    />
  );
  const pill = <NoteStatusPill signedAt={note.signed?.at ?? null} isWriting={isWriting} ready={ready} now={now} sectionsShown={sectionsShown} uncheckedCount={unchecked.length} />;
  const signButton = (
    <button type="button" className={`btn ${styles.signBtn}`} disabled={!ready} onClick={() => setSigning(true)}>
      <span>Sign</span>
      <span className="well" aria-hidden="true">
        <Signature size={18} />
      </span>
    </button>
  );
  const status = <SignStatus isWriting={isWriting} blockers={block} uncheckedCount={unchecked.length} onJump={jumpTo} />;

  return (
    <NoteReviewContext.Provider value={context}>
      {/* a phone: its own top bar, as a pushed screen */}
      <PhoneTopBar note={note} now={now} pill={pill} />

      <main className={`${clinicStyles.page} ${styles.page}`} data-mode={mode}>
        <Link href="/doctor-dashboard/notes" className={`${clinicStyles.back} ${styles.backLink}`}>
          <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Notes
        </Link>
        <div className={styles.grid}>
          <article className={styles.note} aria-label={`Call note, ${note.patientName}`}>
            <NoteHeader
              note={note}
              now={now}
              pill={pill}
              isWriting={isWriting}
              done={done}
              stepper={at >= 0 && queue.length > 1 ? { at, total: queue.length, onPrevious: () => go(queue[at - 1]), onNext: () => go(queue[at + 1]) } : null}
              mode={mode}
              drawerOpen={drawer}
              onToggleDrawer={() => setDrawer((v) => !v)}
              drawerButton={drawerButton}
              hoverable={hoverable}
              keysOpen={keysOpen}
              setKeysOpen={setKeysOpen}
              record={record}
            />

            <div className={bodyStyles.sections} data-fade={(fadeIn && !isWriting) || undefined}>
              <ProseSection sectionKey="summary" isWriting={isWriting} />
              <ProseSection sectionKey="assessment" isWriting={isWriting} />
              <ProseSection sectionKey="plan" isWriting={isWriting} />
              {!isWriting && showMedicines && <MedicinesSection nextPrescriptionVersion={nextPrescriptionVersion} />}
              {!isWriting && showFollowUps && <FollowUpsSection />}
              {!isWriting && note.recordUpdates.length > 0 && <RecordUpdatesSection />}
              <ProseSection sectionKey="patient" isWriting={isWriting} />
            </div>

            {done ? (
              <>
                {nextUp && (
                  <div className={styles.signBar}>
                    <span className={styles.signText}>
                      <span className={styles.readyText}>Signed.</span> <span className="num">{queue.length}</span> more to sign
                    </span>
                    <NextToSignLink note={nextUp} label={`Next to sign: ${nextUp.patientName}`} />
                  </div>
                )}
                <SignedFooter onAddAddendum={addAddendum} />
              </>
            ) : (
              <div className={styles.signBar}>
                <span className={styles.signText}>{status}</span>
                {signButton}
              </div>
            )}
          </article>

          {mode === "wide" && <aside className={styles.tPanel}>{transcript}</aside>}
        </div>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </main>

      {mode === "mid" && drawer && (
        <aside className={styles.drawer} aria-label="Transcript">
          {transcript}
        </aside>
      )}
      {mode === "narrow" && (
        <>
          <Sheet open={sheet} onClose={closeSheet} title="Transcript">
            {transcript}
          </Sheet>
          <PhoneBottomBar
            status={done ? null : status}
            action={done ? nextUp && <NextToSignLink note={nextUp} label={`Next: ${firstName(nextUp)}`} /> : signButton}
            onTranscript={() => setSheet(true)}
          />
        </>
      )}
      <SignSheet
        note={note}
        doctor={doctor}
        their={their}
        flaggedSymptoms={flaggedSymptoms}
        open={signing}
        onClose={closeSigning}
        onSign={sign}
        unchecked={unchecked}
        nextPrescriptionVersion={nextPrescriptionVersion}
      />
    </NoteReviewContext.Provider>
  );
}

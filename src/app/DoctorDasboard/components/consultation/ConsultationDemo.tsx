"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowsOut,
  CaretDown,
  CaretRight,
  ChartLine,
  Check,
  Circle,
  ClipboardText,
  DotsThree,
  FileText,
  ForkKnife,
  Info,
  Microphone,
  MicrophoneSlash,
  NotePencil,
  PhoneDisconnect,
  Pill,
  ShareNetwork,
  ShieldCheck,
  SpeakerHigh,
  SpeakerSlash,
  VideoCamera,
  VideoCameraSlash,
  Waveform,
  WifiHigh,
  WifiSlash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Wordmark } from "@/components/ui";
import { short } from "@/components/account/bits";
import { useClinic } from "@/components/clinician/data";
import { useNotes } from "@/components/clinician/notes-store";
import { DOCTOR, PATIENT_IMAGE, SCENARIOS, type Scenario, type ScenarioKey, type ShareKey } from "./data";
import s from "./ConsultationDemo.module.css";

type Role = "patient" | "doctor";

/* each sample visit is a patient in the clinician portal, with a call note the scribe drafts after it */
const LINKED: Record<ScenarioKey, { pid: string; note: string }> = { weight: { pid: "p_aanya", note: "cn_aanya" }, diabetes: { pid: "p_ritu", note: "cn_ritu" }, first: { pid: "p_meera", note: "cn_meera" } };
type Section = "overview" | "measurements" | "treatment" | "diet" | "notes" | "scribe";
type CallState = "active" | "reconnecting" | "ended";

const sections: { key: Section; label: string; icon: typeof ChartLine }[] = [
  { key: "notes", label: "Private notes", icon: NotePencil },
  { key: "diet", label: "Diet plan", icon: ForkKnife },
  { key: "scribe", label: "AI scribe", icon: Waveform },
];

const sectionTitles: Record<Section, string> = {
  overview: "Visit brief",
  measurements: "Weight history",
  treatment: "Current treatment",
  diet: "Diet plan",
  notes: "Private notes",
  scribe: "AI scribe",
};

function formatDuration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function IconButton({
  label,
  onClick,
  children,
  className = "",
  pressed,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${s.iconButton} ${className}`}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {children}
    </button>
  );
}

function WeightChart({ scenario, compact = false }: { scenario: Scenario; compact?: boolean }) {
  const readings = scenario.weights;
  const values = readings.map((point) => point.value);
  const min = Math.min(...values) - 0.6;
  const max = Math.max(...values) + 0.6;
  const plot = readings.map((point, index) => ({
    x: readings.length === 1 ? 50 : 9 + (index / (readings.length - 1)) * 82,
    y: 77 - ((point.value - min) / (max - min)) * 53,
    ...point,
  }));
  const path = plot.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  return (
    <div className={`${s.chart} ${compact ? s.chartCompact : ""}`}>
      <div className={s.chartTop}>
        <div>
          <span className={s.chartLabel}>Weight history</span>
          <strong>{scenario.weight ?? "Not recorded"}</strong>
        </div>
        <span>{scenario.weightDate ?? "No date"}</span>
      </div>
      <svg viewBox="0 0 100 96" preserveAspectRatio="none" role="img" aria-label={`Recorded weight: ${readings.map((point) => `${point.value} kilograms on ${point.date}`).join(", ")}`}>
        <line x1="0" y1="77" x2="100" y2="77" className={s.chartBase} />
        {readings.length > 1 && <path d={path} className={s.chartLine} />}
        {plot.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="1.4" className={s.chartPoint} />)}
      </svg>
      <div className={s.chartDates}><span>{readings[0]?.date}</span><span>{readings.at(-1)?.date}</span></div>
    </div>
  );
}

function ShareContent({ type, scenario, compact = false }: { type: ShareKey; scenario: Scenario; compact?: boolean }) {
  if (type === "weight") return <><WeightChart scenario={scenario} compact={compact} /><div className={s.sharedReadings}>{scenario.weights.map((reading) => <span key={reading.date}>{reading.date}<strong>{reading.value.toFixed(1)} kg</strong></span>)}</div></>;
  if (type === "lab") return scenario.lab ? (
    <div className={s.shareLab}>
      <div><span className={s.eyebrow}>Lab result</span><strong>{scenario.lab.name}</strong></div>
      <p>{scenario.lab.result}</p>
      <span>{scenario.lab.date} · {scenario.lab.source}</span>
    </div>
  ) : <p className={s.emptyText}>No lab report is on file for this visit.</p>;
  return (
    <div className={s.sharePlan}>
      <span className={s.eyebrow}>Current signed treatment</span>
      {scenario.treatment ? <><strong>{scenario.treatment.name}</strong><p>{scenario.treatment.instructions}</p><span>{scenario.treatment.source}</span></> : <p>There is no current Medistry prescription.</p>}
    </div>
  );
}

export default function ConsultationDemo({ initial = "weight", as = "patient" }: { initial?: ScenarioKey; as?: Role }) {
  const [role, setRole] = useState<Role>(as);
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(initial);
  const clinic = useClinic();
  const notesList = useNotes();
  const linked = LINKED[scenarioKey];
  const record = clinic?.find((p) => p.id === linked.pid);
  const [now] = useState(() => Date.now());
  // weights, allergies, the programme week and the signed treatment all come from the record the
  // portal shows, so the call and the record never disagree
  const scenario = useMemo<Scenario>(() => {
    const base = SCENARIOS[scenarioKey];
    if (!record || record.weights.length < 2) return base;
    const last = record.weights.slice(-4);
    const latest = last.at(-1)!;
    const day = (iso: string) => `${short(iso)} ${new Date(iso).getFullYear()}`;
    const out: Scenario = {
      ...base,
      weights: last.map((w) => ({ date: short(w.at), value: w.kg })),
      weight: `${latest.kg.toFixed(1)} kg`,
      weightDate: day(latest.at),
      allergy: record.allergies ? record.allergies.replace(/ \((.*)\)$/, " · $1") : base.allergy,
    };
    if (record.since && /· week \d+$/.test(base.programme)) {
      const week = Math.max(1, Math.floor((now - Date.parse(record.since)) / (7 * 864e5)) + 1);
      out.programme = base.programme.replace(/week \d+$/, `week ${week}`);
    }
    const signed = record.rx.filter((r) => r.status === "SIGNED").sort((x, y) => y.version - x.version)[0];
    const main = signed?.items[0];
    if (base.treatment && signed && main) {
      const also = signed.items[1];
      const baseDose = base.treatment.instructions.split(" · ")[0];
      out.treatment = {
        ...base.treatment,
        name: main.name,
        instructions: [main.strength, main.frequency.split(",")[0].toLowerCase(), also ? `with ${also.name.replace(/ \(.*\)/, "")} ${also.strength}` : null].filter(Boolean).join(" · "),
        date: `Signed ${day(signed.date)}`,
      };
      // talking points written for the starting dose give way once the dose has moved on
      if (main.strength !== baseDose) {
        out.discussion = [`On ${main.strength} since ${short(signed.date)}: side effects and how the week goes`, ...base.discussion.slice(1)];
        out.plan = ["Doctor to review the current dose", ...base.plan.slice(1)];
      }
    }
    return out;
  }, [scenarioKey, record, now]);
  // the note this call becomes; if the portal does not show it at this point in the demo, Notes itself
  const noteHref = notesList?.some((n) => n.id === linked.note) ? `/clinician/notes/${linked.note}` : "/clinician/notes";
  const [callState, setCallState] = useState<CallState>("active");
  const [elapsed, setElapsed] = useState(9 * 60 + 24);
  const [media, setMedia] = useState({ patient: { mic: true, camera: true, speaker: true }, doctor: { mic: true, camera: true, speaker: true } });
  const [selfVisible, setSelfVisible] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [recordExpanded, setRecordExpanded] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [report, setReport] = useState<"weight" | "lab" | null>(null);
  const [shared, setShared] = useState<ShareKey | null>(null);
  const [sharedDismissed, setSharedDismissed] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [doctorDetailsOpen, setDoctorDetailsOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const railScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (callState !== "active") return;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (!report && !confirmEnd && !doctorDetailsOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReport(null);
        setConfirmEnd(false);
        setDoctorDetailsOpen(false);
      } else if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
        const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onDialogKeyDown);
    dialogCloseRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onDialogKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [report, confirmEnd, doctorDetailsOpen]);

  useEffect(() => {
    if (railScrollRef.current) railScrollRef.current.scrollTop = 0;
  }, [section, scenarioKey]);

  function openSection(next: Section) {
    setSection(next);
    if (window.matchMedia("(max-width: 760px)").matches) setRecordExpanded(true);
  }

  function changeScenario(key: ScenarioKey) {
    setScenarioKey(key);
    setCallState("active");
    setElapsed(9 * 60 + 24);
    setSection("overview");
    setRecordExpanded(false);
    setReport(null);
    setShared(null);
    setSharedDismissed(false);
    setNotes("");
    setNotesSaved(false);
    setCareOpen(false);
  }

  function toggleMedia(key: "mic" | "camera" | "speaker") {
    setMedia((current) => ({ ...current, [role]: { ...current[role], [key]: !current[role][key] } }));
  }

  function endCall() {
    setCallState("ended");
    setConfirmEnd(false);
    setMoreOpen(false);
    setReport(null);
    setShared(null);
    setSharedDismissed(false);
  }

  function share(type: ShareKey) {
    setShared(type);
    setSharedDismissed(false);
    setReport(null);
  }

  const remoteName = role === "patient" ? DOCTOR.name : scenario.patient;
  const remoteImage = role === "patient" ? DOCTOR.image : PATIENT_IMAGE;
  const localImage = role === "patient" ? PATIENT_IMAGE : DOCTOR.image;
  const localName = role === "patient" ? scenario.patient : DOCTOR.name;
  const currentMedia = media[role];
  const patientShared = sharedDismissed ? null : shared;
  const primaryMetric = scenario.key === "diabetes" && scenario.lab
    ? { label: "Latest HbA1c", value: scenario.lab.result, date: scenario.lab.date, isLab: true }
    : { label: "Latest weight", value: scenario.weight ?? "Not recorded", date: scenario.weightDate ?? "No reading", isLab: false };
  const secondaryMetric = scenario.key === "diabetes"
    ? { label: "Latest weight", value: scenario.weight ?? "Not recorded", date: scenario.weightDate ?? "No reading" }
    : scenario.weights.length > 1
      ? (() => {
          // what changed since the visit before is worth more on the call than a height
          const d = Math.round((scenario.weights.at(-1)!.value - scenario.weights.at(-2)!.value) * 10) / 10;
          return { label: "Since last reading", value: `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)} kg`, date: `From ${scenario.weights.at(-2)!.date}` };
        })()
      : { label: "Height", value: scenario.height, date: "Patient record" };

  return (
    <main className={s.demo}>
      <div className={s.previewBar}>
        <div className={s.previewTitle}><span className={s.previewMark} aria-hidden="true" /><span>Consultation prototype</span><span className={s.previewFiction}>Fictional data and AI illustrations</span><span className={s.previewFictionMobile}>Fictional demo</span></div>
        <div className={s.previewActions}>
          <div className={s.roleSwitch} role="group" aria-label="View as">
            <button type="button" className={role === "patient" ? s.roleActive : ""} onClick={() => { setRole("patient"); setMoreOpen(false); }}>Patient view</button>
            <button type="button" className={role === "doctor" ? s.roleActive : ""} onClick={() => { setRole("doctor"); setMoreOpen(false); if (window.matchMedia("(max-width: 760px)").matches) setRailOpen(false); }}>Doctor view</button>
          </div>
          <label className={s.scenarioSelect}><span>Visit</span><select value={scenarioKey} onChange={(event) => changeScenario(event.target.value as ScenarioKey)}>{Object.values(SCENARIOS).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><CaretDown size={14} aria-hidden="true" /></label>
        </div>
      </div>

      <div className={`${s.appShell} ${callState === "ended" ? s.endedShell : ""}`}>
        <header className={s.appHeader}>
          <div className={s.brandCluster}><Wordmark height={23} /><span className={s.headerDivider} /><span className={s.headerTitle}>Consultation</span></div>
          <div className={s.headerMeta}><span className={s.appointment}>{scenario.appointment}</span><span className={`${s.connection} ${callState === "reconnecting" ? s.connectionProblem : ""}`}>{callState === "reconnecting" ? <WifiSlash size={15} /> : <WifiHigh size={15} />}{callState === "ended" ? "Call ended" : callState === "reconnecting" ? "Reconnecting" : "Connected"}</span></div>
        </header>

        {callState === "ended" ? (
          <section className={`${s.ended} ${role === "doctor" ? s.doctorEnded : ""}`} aria-live="polite">
            <div className={s.endedIcon}><Check size={30} weight="light" /></div>
            <span className={s.eyebrow}>Consultation complete</span>
            <h1>{role === "patient" ? "Your visit has ended." : "The call has ended."}</h1>
            {role === "patient" ? <p>Your doctor is finalising the visit summary. It will appear in your care record once reviewed.</p> : <div className={s.endedSummary}>
              <span className={s.eyebrow}>AI scribe · only you see the draft</span>
              <h2>Your note is drafting.</h2>
              <p>It will be in Notes to sign. Nothing reaches {scenario.patient.split(" ")[0]}&apos;s record or app until you sign it.</p>
              <div className={s.scribeHighlights}><span>Points to verify in the note</span>{scenario.discussion.map((item) => <div key={item}><Circle size={16} />{item}</div>)}</div>
              <div className={s.endedActions}>
                <a href={noteHref} className={s.primaryButton}>Open in Notes <ArrowRight size={17} /></a>
                <a href="/clinician" className={s.secondaryButton}>Back to Today</a>
              </div>
              <p>Private note {notesSaved ? "saved as a draft" : "not saved"}. This demo creates no clinical record or prescription.</p>
            </div>}
            <button type="button" className={role === "doctor" ? s.textButton : s.secondaryButton} onClick={() => { setCallState("active"); setElapsed(0); }}>Rejoin the demo call <ArrowClockwise size={17} /></button>
          </section>
        ) : (
          <div className={`${s.workspace} ${role === "doctor" ? s.doctorWorkspace : s.patientWorkspace} ${!railOpen && role === "doctor" ? s.railCollapsed : ""}`}>
            <section className={s.videoArea} aria-label="Video consultation">
              <div className={s.remoteFrame}>
                <Image src={remoteImage} alt={role === "patient" ? "AI illustration of a fictional doctor facing the camera" : "AI illustration of a fictional patient facing the camera"} fill priority sizes={role === "patient" ? "(max-width: 760px) 100vw, 70vw" : "(max-width: 900px) 100vw, 65vw"} className={s.remoteImage} />
                <div className={s.videoTop}><div className={s.remoteIdentity}><span className={s.liveIndicator} aria-hidden="true" /><span>{remoteName}</span></div><span className={s.elapsed}>{formatDuration(elapsed)}</span></div>
                {role === "doctor" && !railOpen && <button type="button" className={s.openRecordOnVideo} onClick={() => setRailOpen(true)}><ClipboardText size={17} />Patient record</button>}
                {role === "patient" && <button type="button" className={s.doctorInfoOnVideo} onClick={() => setDoctorDetailsOpen(true)}><Info size={17} />Doctor details</button>}
                {selfVisible && <div className={s.selfView} aria-label={`Your camera preview, ${localName}`}>
                  {currentMedia.camera ? <Image src={localImage} alt="" fill sizes="170px" className={s.selfImage} /> : <div className={s.selfOff}><VideoCameraSlash size={24} /><span>Camera off</span></div>}
                  <span className={s.selfLabel}>You</span>
                  <button type="button" className={s.hideSelf} onClick={() => setSelfVisible(false)} aria-label="Hide self-view" title="Hide self-view"><X size={13} /></button>
                </div>}
                {!selfVisible && <button type="button" className={s.showSelf} onClick={() => setSelfVisible(true)} aria-label="Show self-view" title="Show self-view"><VideoCamera size={18} /></button>}
                {callState === "reconnecting" && <div className={s.reconnectOverlay} role="status"><WifiSlash size={30} /><strong>Connection interrupted</strong><span>Your call will continue when the connection returns.</span><button type="button" onClick={() => setCallState("active")}><ArrowClockwise size={17} />Reconnect now</button></div>}
                {shared && role === "doctor" && <div className={s.sharingNotice}><ShareNetwork size={16} /><span>{sharedDismissed ? "Patient closed the shared view" : `Showing ${shared === "weight" ? "weight history" : shared === "lab" ? "lab result" : "current treatment"} to the patient`}</span>{sharedDismissed && <button type="button" onClick={() => setSharedDismissed(false)}>Show again</button>}<button type="button" onClick={() => setShared(null)}>Stop sharing</button></div>}
              </div>
              <div className={s.controls}>
                <div className={s.controlsSide} />
                <div className={s.controlsCenter}>
                  <IconButton label={currentMedia.mic ? "Mute microphone" : "Unmute microphone"} onClick={() => toggleMedia("mic")} pressed={!currentMedia.mic} className={!currentMedia.mic ? s.controlOff : ""}>{currentMedia.mic ? <Microphone size={22} /> : <MicrophoneSlash size={22} />}</IconButton>
                  <IconButton label={currentMedia.camera ? "Turn camera off" : "Turn camera on"} onClick={() => toggleMedia("camera")} pressed={!currentMedia.camera} className={!currentMedia.camera ? s.controlOff : ""}>{currentMedia.camera ? <VideoCamera size={22} /> : <VideoCameraSlash size={22} />}</IconButton>
                  <IconButton label={currentMedia.speaker ? "Mute speaker" : "Unmute speaker"} onClick={() => toggleMedia("speaker")} pressed={!currentMedia.speaker} className={!currentMedia.speaker ? s.controlOff : ""}>{currentMedia.speaker ? <SpeakerHigh size={22} /> : <SpeakerSlash size={22} />}</IconButton>
                  <div className={s.moreWrap}><IconButton label="More call options" onClick={() => setMoreOpen((value) => !value)} pressed={moreOpen}><DotsThree size={24} /></IconButton>{moreOpen && <div className={s.moreMenu}><button type="button" onClick={() => { setCallState("reconnecting"); setMoreOpen(false); }}><WifiSlash size={17} />Preview connection issue</button></div>}</div>
                  <IconButton label="End call" onClick={() => setConfirmEnd(true)} className={s.endButton}><PhoneDisconnect size={22} /></IconButton>
                </div>
                <div className={s.controlsSideRight}>{role === "doctor" && <button type="button" className={s.recordToggle} onClick={() => setRailOpen((value) => !value)} aria-pressed={railOpen} aria-label={railOpen ? "Close patient record" : "Open patient record"} title={railOpen ? "Close patient record" : "Open patient record"}><ClipboardText size={18} />Patient record</button>}</div>
              </div>
            </section>

            {role === "doctor" && railOpen && <aside className={`${s.clinicalRail} ${recordExpanded ? s.recordExpanded : ""}`} aria-label="Patient record">
              <div className={s.railMiniVideo}><Image src={PATIENT_IMAGE} alt="Fictional patient in the ongoing call" fill sizes="(max-width: 900px) 100vw, 1px" /><span>{scenario.patient} · call continues</span></div>
              <div className={s.railHeader}><div><span className={s.eyebrow}>Patient record</span><h1>{scenario.patient}</h1><p>{scenario.age} years · {scenario.sex}</p>{section !== "overview" && <span className={s.railFocus}>{scenario.focus}</span>}</div><div className={s.railHeaderActions}><button type="button" className={s.notesShortcut} onClick={() => openSection("notes")} aria-label="Private notes" aria-pressed={section === "notes"} title="Private notes"><NotePencil size={17} /><span>Notes</span></button><button type="button" className={s.expandRecord} onClick={() => setRecordExpanded((value) => !value)}>{recordExpanded ? "Reduce" : "Expand"}</button><IconButton label="Collapse patient record" onClick={() => { setRailOpen(false); setRecordExpanded(false); }}><X size={19} /></IconButton></div></div>
              <div className={`${s.safetyLine} ${!scenario.allergyConfirmed ? s.safetyNeedsReview : ""}`}>{scenario.allergyConfirmed ? <ShieldCheck size={17} /> : <WarningCircle size={17} />}<span>{scenario.allergy}</span></div>
              {section !== "overview" && <div className={s.sectionBar}><button type="button" className={s.backLink} onClick={() => { setSection("overview"); if (window.matchMedia("(max-width: 760px)").matches) setRecordExpanded(false); }}><ArrowLeft size={17} />Visit brief</button><span className={s.sectionDivider} /><h2>{sectionTitles[section]}</h2></div>}
              {section === "overview" ? <div ref={railScrollRef} className={s.railScroll}>
                <div className={s.visitHeadline}><span className={s.eyebrow}>{scenario.visitType}</span><h2>{scenario.focus}</h2><span>{scenario.programme}</span></div>
                <div className={s.metricPair}>
                  <button type="button" onClick={() => primaryMetric.isLab ? setReport("lab") : openSection("measurements")} aria-label={primaryMetric.isLab ? "View latest lab report" : "View weight history"}><span>{primaryMetric.label}</span><strong>{primaryMetric.value}</strong><small>{primaryMetric.date}</small><span className={s.metricAction}>{primaryMetric.isLab ? "View report" : "View history"}<ArrowRight size={13} /></span></button>
                  {scenario.key === "diabetes" ? <button type="button" onClick={() => openSection("measurements")} aria-label="View weight history"><span>{secondaryMetric.label}</span><strong>{secondaryMetric.value}</strong><small>{secondaryMetric.date}</small><span className={s.metricAction}>View history<ArrowRight size={13} /></span></button> : <div><span>{secondaryMetric.label}</span><strong>{secondaryMetric.value}</strong><small>{secondaryMetric.date}</small></div>}
                </div>
                <div className={s.railBlock}><div className={s.blockHeading}><span className={s.eyebrow}>Discuss today</span></div><p className={s.patientQuote}>“{scenario.patientConcern}”</p><span className={s.sourceLine}>Patient reported · eligibility check or latest check-in</span></div>
                <button type="button" className={s.compactRow} onClick={() => openSection("treatment")}><span className={s.rowIcon}><Pill size={18} /></span><span><small>Current treatment</small><strong>{scenario.treatment ? `${scenario.treatment.name} · ${scenario.treatment.instructions.split(" · ")[0]}` : "No Medistry prescription yet"}</strong><span className={s.rowAction}>View details</span></span><CaretRight size={17} /></button>
                {scenario.lab ? <button type="button" className={s.compactRow} onClick={() => setReport("lab")} aria-label={`View ${scenario.lab.name} lab report`}><span className={s.rowIcon}><FileText size={18} /></span><span><small>Latest lab report</small><strong>{scenario.lab.name} · {scenario.lab.result}</strong><span className={s.rowAction}>Open report</span></span><CaretRight size={17} /></button> : <div className={`${s.compactRow} ${s.compactRowStatic}`}><span className={s.rowIcon}><FileText size={18} /></span><span><small>Latest lab report</small><strong>No lab report on file</strong></span></div>}
                <div className={s.sectionList}>{sections.map(({ key, label, icon: Icon }) => <button type="button" key={key} onClick={() => openSection(key)}><Icon size={18} /><span>{label}</span><CaretRight size={16} /></button>)}</div>
              </div> : <div ref={railScrollRef} className={s.railScroll}>
                {section === "measurements" && <div className={s.detailContent}><WeightChart scenario={scenario} /><div className={s.readingList}>{scenario.weights.map((reading) => <div key={reading.date}><span>{reading.date} 2026</span><strong>{reading.value.toFixed(1)} kg</strong></div>)}</div><div className={s.detailStat}><span>Recorded height</span><strong>{scenario.height}</strong><small>From patient record</small></div><p className={s.sourceLine}>Recorded readings only. No projected outcome.</p><div className={s.actionRow}><button type="button" className={s.primaryButton} onClick={() => share("weight")}><ShareNetwork size={17} />Review together</button><button type="button" className={s.textButton} onClick={() => setReport("weight")}>Full record <ArrowsOut size={16} /></button></div></div>}
                {section === "treatment" && <div className={s.detailContent}><div className={s.treatmentCard}><span className={s.eyebrow}>Current signed prescription</span>{scenario.treatment ? <><h3>{scenario.treatment.name}</h3><p>{scenario.treatment.instructions}</p><small>{scenario.treatment.date} · {scenario.treatment.source}</small></> : <><h3>No Medistry prescription yet</h3><p>The doctor will review suitability during this consultation.</p></>}</div><div className={s.detailLine}><span>Other medicines</span><strong>{scenario.outsideMedicine}</strong></div><div className={s.detailLine}><span>Other ongoing care</span>{scenario.otherCare.length ? scenario.otherCare.map((item) => <strong key={item}>{item}</strong>) : <strong>None recorded yet</strong>}</div><div className={s.detailLine}><span>Allergy history</span><strong>{scenario.allergy}</strong></div>{scenario.treatment && <button type="button" className={s.primaryButton} onClick={() => share("plan")}><ShareNetwork size={17} />Show signed treatment</button>}<p className={s.sourceLine}>Discussed changes are not part of the current prescription until reviewed and signed.</p></div>}
                {section === "diet" && <div className={s.detailContent}>{scenario.dietPlan ? <div className={s.treatmentCard}><span className={s.eyebrow}>Current diet plan</span><h3>{scenario.dietPlan.title}</h3><p>{scenario.dietPlan.note}</p><small>{scenario.dietPlan.date} · {scenario.dietPlan.source}</small></div> : <div className={s.emptyState}><ForkKnife size={28} /><h3>No diet plan yet</h3><p>A dietitian-reviewed plan can be added after the clinical review.</p></div>}<p className={s.sourceLine}>Prototype preview · detailed plan content to be confirmed with the care team.</p></div>}
                {section === "notes" && <div className={s.detailContent}><label className={s.noteLabel} htmlFor="visit-note">Private visit note</label><p className={s.noteHelp}>Only the doctor can see this draft. It is not the patient summary.</p><textarea id="visit-note" value={notes} onChange={(event) => { setNotes(event.target.value); setNotesSaved(false); }} placeholder="Add observations, questions to follow up, and decisions to verify…" rows={9} /><button type="button" className={s.primaryButton} onClick={() => setNotesSaved(true)} disabled={!notes.trim()}>{notesSaved ? <><Check size={17} />Draft saved</> : <>Save draft <ArrowRight size={17} /></>}</button><span className={s.sourceLine}>Prototype only · held in this browser session</span></div>}
                {section === "scribe" && <div className={s.detailContent}><div className={s.scribeStatus}><Waveform size={23} /><div><strong>Summary after the call</strong><span>You review and edit the draft before any recap reaches the patient.</span></div></div><p className={s.sourceLine}>Planned 100ms integration · simulated in this prototype. No audio is recorded here.</p></div>}
              </div>}
            </aside>}

            {role === "patient" && <aside className={`${s.patientCare} ${careOpen || patientShared ? s.patientCareOpen : ""}`} aria-label="Your care during this call">
              <div className={s.careHeader}>
                <div><span className={s.eyebrow}>{patientShared ? "Reviewing together" : "Your care"}</span><h2>{patientShared ? patientShared === "weight" ? "Your weight history" : patientShared === "lab" ? "Your lab result" : "Your current treatment" : scenario.programme}</h2></div>
                <button type="button" onClick={() => patientShared ? setSharedDismissed(true) : setCareOpen((value) => !value)} aria-label={patientShared ? "Dismiss shared item" : careOpen ? "Collapse your care" : "Expand your care"}>{patientShared ? <X size={21} /> : <CaretDown size={21} className={careOpen ? "" : s.caretUp} />}</button>
              </div>
              {patientShared ? <div className={s.careBody}><p className={s.sharedIntro}>{DOCTOR.name} is showing this item from your record.</p><ShareContent type={patientShared} scenario={scenario} compact /><span className={s.sourceLine}>This view is shared for this call only.</span></div> : <div className={s.careBody}>
                <p className={s.careIntro}>{scenario.key === "first" ? "Your doctor will review your history and discuss whether a care programme suits you." : null}</p>
                <div className={s.careFacts}><div><span>{primaryMetric.label}</span><strong>{primaryMetric.value}</strong><small>{primaryMetric.date}</small></div><div><span>Current treatment</span><strong>{scenario.treatment ? scenario.treatment.name : "Under review"}</strong><small>{scenario.treatment ? scenario.treatment.instructions : "No prescription yet"}</small></div></div>
                <button type="button" className={s.doctorDetailsLink} onClick={() => setDoctorDetailsOpen(true)}>Meet your doctor <ArrowRight size={16} /></button>
              </div>}
            </aside>}
          </div>
        )}
      </div>

      {report && <div className={s.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setReport(null); }}>
        <section className={s.reportDialog} role="dialog" aria-modal="true" aria-label={report === "weight" ? "Detailed weight report" : "Detailed lab report"}>
          <div className={s.reportHeader}><div><span className={s.eyebrow}>Patient record · {scenario.patient}</span><h2>{report === "weight" ? "Weight record" : "Lab report"}</h2></div><button ref={dialogCloseRef} type="button" className={s.closeButton} onClick={() => setReport(null)} aria-label="Close detailed report"><X size={21} /></button></div>
          <div className={s.reportContent}>
            <div className={s.reportVideo}><Image src={PATIENT_IMAGE} alt="Fictional patient in the ongoing call" fill sizes="180px" /><span>{scenario.patient} · call continues</span></div>
            {report === "weight" ? <><WeightChart scenario={scenario} /><div className={s.readingList}>{scenario.weights.map((reading) => <div key={reading.date}><span>{reading.date} 2026</span><strong>{reading.value.toFixed(1)} kg</strong></div>)}</div><p className={s.sourceLine}>Recorded by patient in Medistry check-ins. Confirm context during the call.</p></> : scenario.lab ? <div className={s.reportSheet}>
              <div className={s.reportSheetTop}><div><span className={s.eyebrow}>Partner laboratory</span><h3>Laboratory report</h3></div><span className={s.reportBadge}>Result received</span></div>
              <dl className={s.reportMeta}><div><dt>Patient</dt><dd>{scenario.patient}</dd></div><div><dt>Report ID</dt><dd>{scenario.lab.reportId}</dd></div><div><dt>Reported</dt><dd>{scenario.lab.date}</dd></div><div><dt>Source</dt><dd>{scenario.lab.source}</dd></div></dl>
              <div className={s.reportResultRow}><span>Test</span><span>Result</span><strong>{scenario.lab.name}</strong><strong>{scenario.lab.result}</strong></div>
              <p className={s.sourceLine}>Illustrative report preview for this prototype. The doctor reviews the result in its clinical context before discussing any action.</p>
            </div> : <p>No report on file.</p>}
          </div>
          <div className={s.reportFooter}><button type="button" className={s.secondaryButton} onClick={() => setReport(null)}>Back to call</button><button type="button" className={s.primaryButton} onClick={() => share(report === "weight" ? "weight" : "lab")}><ShareNetwork size={17} />Review together</button></div>
        </section>
      </div>}

      {doctorDetailsOpen && <div className={s.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setDoctorDetailsOpen(false); }}><section className={s.simpleDialog} role="dialog" aria-modal="true" aria-label="Doctor details"><button ref={dialogCloseRef} type="button" className={s.closeButton} onClick={() => setDoctorDetailsOpen(false)} aria-label="Close doctor details"><X size={21} /></button><div className={s.doctorPortrait}><Image src={DOCTOR.image} alt="AI illustration of a fictional doctor" fill sizes="120px" /></div><span className={s.eyebrow}>Your doctor</span><h2>{DOCTOR.name}</h2><p>{DOCTOR.title}</p><dl><div><dt>Qualification</dt><dd>{DOCTOR.qualification}</dd></div><div><dt>Experience</dt><dd>{DOCTOR.experience}</dd></div><div><dt>Registration</dt><dd>{DOCTOR.registration}</dd></div></dl><span className={s.sourceLine}>Illustrative profile for design review. No real clinician is represented.</span></section></div>}

      {confirmEnd && <div className={s.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmEnd(false); }}><section className={s.confirmDialog} role="dialog" aria-modal="true" aria-label="End consultation"><button ref={dialogCloseRef} type="button" className={s.closeButton} onClick={() => setConfirmEnd(false)} aria-label="Close end call confirmation"><X size={21} /></button><div className={s.confirmSymbol}><PhoneDisconnect size={25} /></div><h2>End this consultation?</h2><p>You can rejoin the demo after ending the call. {role === "doctor" ? "Your private draft note will remain available." : "Your visit summary will appear after your doctor reviews it."}</p><div><button type="button" className={s.secondaryButton} onClick={() => setConfirmEnd(false)}>Stay on call</button><button type="button" className={s.confirmEnd} onClick={endCall}>End call</button></div></section></div>}
    </main>
  );
}

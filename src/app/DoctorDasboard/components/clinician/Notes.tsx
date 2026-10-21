"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  CaretUp,
  ChatsCircle,
  Check,
  DotsThree,
  IdentificationBadge,
  Keyboard,
  ListChecks,
  Notepad,
  Prescription,
  SealCheck,
  Signature,
  WarningCircle,
  Waveform,
  X,
} from "@phosphor-icons/react";
import Sheet from "../account/Sheet";
import { Avatar, Segmented, short } from "../account/bits";
import { DOCTOR } from "../account/care";
import { ago, careWeek, ME, type Patient } from "./data";
import { useClinicToast } from "./ClinicShell";
import {
  addAddendum,
  addMissed,
  blockers,
  checkSection,
  edited,
  editSection,
  firstName,
  markFollowUpDone,
  missedOpen,
  openFlags,
  ready,
  resolveFlag,
  restoreSection,
  rxChanges,
  sectionOf,
  sentTo,
  signNote,
  TITLES,
  toggleFollowUp,
  toggleMed,
  toggleUpdate,
  toSign,
  useNotes,
  writing,
  type CallNote,
  type Ev,
  type ListKey,
  type SectionKey,
  type Seg,
  type Sentence,
} from "./notes-store";
import c from "./Clinic.module.css";
import m from "./Messages.module.css";
import st from "./Notes.module.css";

/* ---------- words and times ---------- */

const TYPE = {
  FIRST_CONSULTATION: "First consultation",
  FOLLOW_UP: "Follow-up",
} as const;
const FLAG_TITLE = {
  unclear: "Audio unclear",
  conflict: "Differs from the record",
  unsaid: "Not said on the call",
} as const;
const PROMPT: Record<SectionKey, string> = {
  summary: "Write the visit summary",
  assessment: "Write your assessment",
  plan: "Add what you told the patient, one point per line",
  patient: "Write the summary the patient will see",
};
// "7:00\u00a0pm": a time never breaks across lines
const clock = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" })
    .format(new Date(iso))
    .toLowerCase()
    .replace(/\s/g, "\u00a0");
const lcDay = (s: string) =>
  s.replace(/^(Today|Yesterday)/, (w) => w.toLowerCase());
const sameDay = (a: number, b: number) =>
  new Date(a).toDateString() === new Date(b).toDateString();
const dayWord = (iso: string, now: number) =>
  sameDay(Date.parse(iso), now)
    ? "Today"
    : sameDay(Date.parse(iso), now - 864e5)
      ? "Yesterday"
      : short(iso);
const stampOf = (iso: string) =>
  `${short(iso)} ${new Date(iso).getFullYear()}, ${clock(iso)}`;
/** "Today, 8:49 pm", "Yesterday, 7:00 pm", "3 Oct, 6:00 pm": one format for every time in a note's header */
const dayTime = (iso: string, now: number) =>
  `${dayWord(iso, now)}, ${clock(iso)}`;
const mmss = (t: number) =>
  `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
const andList = (xs: string[]) =>
  xs.length < 2
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
const uniq = (ev: Ev[]) => [...new Set(ev.map((e) => e.seg))];
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The current time, each second, until `ms` has passed; then it stops ticking. */
function useUntil(ms: number) {
  const [t, setT] = useState(() => Date.now());
  const done = t >= ms;
  useEffect(() => {
    if (done) return;
    const i = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(i);
  }, [done]);
  return t;
}

type Mode = "wide" | "mid" | "narrow";
/** ≥1280: note and transcript side by side; 1024 to 1279: the transcript as a drawer; below: a sheet. */
function useMode(): Mode {
  const get = (): Mode =>
    window.matchMedia("(min-width: 1280px)").matches
      ? "wide"
      : window.matchMedia("(min-width: 1024px)").matches
        ? "mid"
        : "narrow";
  const [mode, setMode] = useState(get);
  useEffect(() => {
    const qs = ["(min-width: 1280px)", "(min-width: 1024px)"].map((q) =>
      window.matchMedia(q),
    );
    const on = () =>
      setMode(qs[0].matches ? "wide" : qs[1].matches ? "mid" : "narrow");
    qs.forEach((q) => q.addEventListener("change", on));
    return () => qs.forEach((q) => q.removeEventListener("change", on));
  }, []);
  return mode;
}

/** Scroll an element to the middle of whatever scrolls it, without moving the page around it. */
function centreIn(el: HTMLElement | null) {
  if (!el) return;
  let box = el.parentElement;
  while (
    box &&
    !(
      /(auto|scroll)/.test(getComputedStyle(box).overflowY) &&
      box.scrollHeight > box.clientHeight
    )
  )
    box = box.parentElement;
  const behavior: ScrollBehavior = reduced() ? "auto" : "smooth";
  if (!box) return el.scrollIntoView({ block: "center", behavior });
  const top =
    el.getBoundingClientRect().top -
    box.getBoundingClientRect().top +
    box.scrollTop -
    box.clientHeight / 2 +
    el.offsetHeight / 2;
  box.scrollTo({ top, behavior });
}
const centrePage = (id: string) =>
  document
    .getElementById(id)
    ?.scrollIntoView({
      block: "center",
      behavior: reduced() ? "auto" : "smooth",
    });

/** Text with the cited words marked and the words the transcriber was unsure of underlined. */
function Marked({
  text,
  quotes = [],
  unsure,
}: {
  text: string;
  quotes?: string[];
  unsure?: string;
}) {
  const bits = new Array<number>(text.length).fill(0);
  const paint = (q: string, b: number) => {
    const i = text.indexOf(q);
    if (i >= 0) for (let j = i; j < i + q.length; j++) bits[j] |= b;
  };
  quotes.forEach((q) => paint(q, 1));
  if (unsure) paint(unsure, 2);
  const runs: { b: number; s: string }[] = [];
  for (let i = 0; i < text.length; i++) {
    if (runs.length && runs.at(-1)!.b === bits[i]) runs.at(-1)!.s += text[i];
    else runs.push({ b: bits[i], s: text[i] });
  }
  return (
    <>
      {runs.map((r, i) => {
        const inner =
          r.b & 2 ? (
            <span className={st.unsure}>
              {r.s}
              <span className="sr-only"> (unclear)</span>
            </span>
          ) : (
            r.s
          );
        return r.b & 1 ? (
          <mark key={i}>{inner}</mark>
        ) : (
          <Fragment key={i}>{inner}</Fragment>
        );
      })}
    </>
  );
}

/* ---------- the list ---------- */

/** Notes: the scribe's drafts waiting to be signed, oldest first, and the last month's signed ones. */
export function NotesList({ patients }: { patients: Patient[] }) {
  const notes = useNotes();
  const [mount] = useState(() => Date.now());
  const soonest = Math.min(
    Infinity,
    ...(notes ?? [])
      .filter((n) => writing(n, mount))
      .map((n) => Date.parse(n.ready_at)),
  );
  const now = useUntil(Number.isFinite(soonest) ? soonest : 0);
  const [tab, setTab] = useState<"sign" | "signed">("sign");
  if (!notes) return null;
  const still = notes
    .filter((n) => writing(n, now))
    .sort((a, b) => a.ready_at.localeCompare(b.ready_at));
  const written = toSign(notes, now);
  // the count is what can be signed now, the same as the badge; one still being written is said apart
  const sign = [...written, ...still];
  const signed = notes
    .filter(
      (n) =>
        n.status === "SIGNED" &&
        n.signed &&
        now - Date.parse(n.signed.at) < 30 * 864e5,
    )
    .sort((a, b) => b.signed!.at.localeCompare(a.signed!.at));
  const list = tab === "sign" ? sign : signed;

  return (
    <main className={c.page}>
      <div className={c.hello}>
        <h1 className={c.h1}>Notes</h1>
        <p className={c.sub}>
          The scribe drafts a note from every call. Nothing reaches a record
          until you sign it.
        </p>
      </div>
      <div className={st.listTools}>
        <Segmented
          label="Show"
          value={tab}
          onChange={setTab}
          options={[
            {
              v: "sign",
              label: (
                <>
                  To sign<span className="num">&nbsp;{written.length}</span>
                  {still.length > 0 && (
                    <span className={st.writingCount}>
                      &nbsp;· <span className="num">{still.length}</span> being
                      written
                    </span>
                  )}
                </>
              ),
            },
            { v: "signed", label: "Signed" },
          ]}
        />
      </div>
      {list.length ? (
        <ul className={st.list}>
          {list.map((n) => (
            <li key={n.id}>
              <NoteRow
                n={n}
                p={patients.find((x) => x.id === n.pid)}
                now={now}
              />
            </li>
          ))}
        </ul>
      ) : tab === "sign" ? (
        <div className={`${m.empty} ${st.empty}`}>
          <Check size={22} aria-hidden="true" />
          <p>
            Every note is signed. A draft appears here a minute or two after
            each call.
          </p>
          <button
            type="button"
            className={m.linkBtn}
            onClick={() => setTab("signed")}
          >
            See signed notes
          </button>
        </div>
      ) : (
        <div className={`${m.empty} ${st.empty}`}>
          <p>No notes signed in the last 30 days.</p>
        </div>
      )}
    </main>
  );
}

function NoteRow({ n, p, now }: { n: CallNote; p?: Patient; now: number }) {
  const w = writing(n, now);
  const flags = openFlags(n).length;
  const first = sectionOf(n, "summary").cur[0]?.text;
  const line = w
    ? "Writing the note from the call"
    : !n.transcribed && !first
      ? "Not transcribed. Write the note yourself."
      : (first ?? "No summary yet");
  const wk = p ? careWeek(p) : null;
  return (
    <Link
      href={`/DoctorDasboard/clinician/notes/${n.id}`}
      className={`${m.item} ${st.row}`}
    >
      <Avatar name={n.name} size={40} />
      <span className={m.itemText}>
        <span className={m.itemTop}>
          <strong>{n.name}</strong>
          <span className={`${m.itemWhen} num`}>
            {n.status === "SIGNED" ? clock(n.signed!.at) : ago(n.call_at, now)}
          </span>
        </span>
        <span className={st.rowMeta}>
          {TYPE[n.type]} · {dayWord(n.call_at, now)},{" "}
          <span className="num">{clock(n.call_at)}</span> ·{" "}
          <span className="num">{n.minutes}</span> min
        </span>
        <span className={m.snippet} data-quiet={w || !first || undefined}>
          <span>{line}</span>
        </span>
        <span className={m.tags}>
          {n.status === "SIGNED" ? (
            <span className={st.tag}>Signed {short(n.signed!.at)}</span>
          ) : w ? (
            <span className={st.tag}>
              <i className={st.breath} aria-hidden="true" /> Writing
            </span>
          ) : !n.transcribed && !first ? (
            <span className={st.tag}>Not transcribed</span>
          ) : flags ? (
            <span className={m.tag} data-kind="urgent">
              <WarningCircle size={13} weight="fill" aria-hidden="true" />{" "}
              {flags} to check
            </span>
          ) : ready(n, now) ? (
            <span className={m.tag} data-kind="you">
              Ready to sign
            </span>
          ) : (
            <span className={st.tag}>{blockers(n)[0]?.label}</span>
          )}
          {p && (
            <span className={m.tagQuiet}>
              {wk ? `Week ${wk}` : p.programme}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

/* ---------- the review ---------- */

/** What the doctor has pinned: a sentence, a medicine or a follow-up, and where it was said. */
type Pin = { id: string; ev: Ev[]; by: "scribe" | "doctor"; at: string };
type Ctx = {
  n: CallNote;
  p?: Patient;
  done: boolean;
  shown: boolean;
  pin: Pin | null;
  lit: Set<string>;
  flash: string | null;
  editing: { key: SectionKey; caret?: string } | null;
  undos: Record<string, { label: string; undo: () => void }>;
  hoverable: boolean;
  pinIt: (p: Pin) => void;
  setHover: (ev: Ev[] | null) => void;
  openEditor: (key: SectionKey, caret?: string) => void;
  closeEditor: (key: SectionKey) => void;
  resolve: (sid: string, i: number) => void;
  openTranscript: (seg?: string) => void;
  toast: (m: string, undo?: () => void) => void;
};
const Review = createContext<Ctx>(null!);

/** One call note: the draft to check, edit and sign, with the call's transcript beside it. */
export function NoteReview({
  id,
  patients,
}: {
  id: string;
  patients: Patient[];
}) {
  const notes = useNotes();
  const n = notes?.find((x) => x.id === id);
  if (!notes) return null;
  if (!n) {
    return (
      <main className={c.page}>
        <h1 className={c.h1}>Note not found</h1>
        <p className={c.sub}>
          It may belong to another doctor, or the sample data was reset.{" "}
          <Link href="/clinician/notes">Back to Notes</Link>
        </p>
      </main>
    );
  }
  return <ReviewBody n={n} notes={notes} patients={patients} />;
}

function ReviewBody({
  n,
  notes,
  patients,
}: {
  n: CallNote;
  notes: CallNote[];
  patients: Patient[];
}) {
  const id = n.id;
  const toast = useClinicToast();
  const router = useRouter();
  const mode = useMode();
  const [mount] = useState(() => Date.now());
  const now = useUntil(n.status === "DRAFT" ? Date.parse(n.ready_at) : 0);
  const [fadeIn] = useState(() => writing(n, mount));
  const [hoverable] = useState(
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );

  const [pin, setPin] = useState<Pin | null>(null);
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState<Ev[] | null>(null);
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<string | null>(null);
  const [notUsed, setNotUsed] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    key: SectionKey;
    caret?: string;
  } | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [signing, setSigning] = useState(false);
  const [keys, setKeys] = useState(false);
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [live, setLive] = useState("");
  const [undos, setUndos] = useState<
    Record<string, { label: string; undo: () => void }>
  >({});
  // set when the doctor signs: the note after this one in the queue, so the sign bar can point onwards
  const [after, setAfter] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const drawerBtn = useRef<HTMLButtonElement>(null);

  const queue = toSign(notes, now);
  const at = queue.findIndex((x) => x.id === id);
  const go = (to?: CallNote) => to && router.push(`/clinician/notes/${to.id}`);
  const shown =
    mode === "wide" ||
    (mode === "mid" && drawer) ||
    (mode === "narrow" && sheet);

  /* keyboard: one listener, always calling the latest handler (set after each render) */
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const p = patients.find((x) => x.id === n.pid);
  const first = firstName(n);
  const her = p?.sex === "Male" ? "his" : "her";
  const w = writing(n, now);
  const done = n.status === "SIGNED";
  const ok = ready(n, now);
  const block = blockers(n);
  const missed = done ? [] : missedOpen(n);
  const rxSigned = p?.rx.find((r) => r.status === "SIGNED");
  const nextRx = Math.max(0, ...(p?.rx ?? []).map((r) => r.version)) + 1;
  const showMeds = n.transcribed || n.meds.length > 0;
  const showFollow = n.transcribed || n.followups.length > 0;
  const listKeys: ListKey[] = [
    ...(showMeds ? (["meds"] as const) : []),
    ...(showFollow ? (["followups"] as const) : []),
    ...(n.updates.length ? (["updates"] as const) : []),
  ];
  const unchecked = [
    ...n.sections
      .filter((s) => s.cur.length && !s.checked)
      .map((s) => TITLES[s.key]),
    ...listKeys
      .filter(
        (k) =>
          !n.checks[k] &&
          (k !== "meds" || n.meds.length) &&
          (k !== "followups" || n.followups.length),
      )
      .map((k) => TITLES[k]),
  ];
  const nextUp =
    notes.find((x) => x.id === after && x.status === "DRAFT") ??
    queue.find((x) => x.id !== n.id);
  const sectionsShown =
    n.sections.filter((s) => s.cur.length).length +
    listKeys.filter(
      (k) =>
        (k !== "meds" || n.meds.length) &&
        (k !== "followups" || n.followups.length),
    ).length;

  const announce = (msg: string) => setLive(msg);
  const pinIt = (x: Pin) => {
    if (pin?.id === x.id) {
      setPin(null);
      setLit(new Set());
      return;
    }
    setPin(x);
    setStep(0);
    setLit(new Set());
    const moments = uniq(x.ev).length;
    announce(
      moments
        ? `${moments} ${moments === 1 ? "moment" : "moments"} in the transcript`
        : x.by === "doctor"
          ? "Written by you"
          : "Not linked to the call",
    );
    if (shown && moments)
      requestAnimationFrame(() =>
        centreIn(document.getElementById(`seg-${x.ev[0].seg}`)),
      );
    // in place: the card opens under the paragraph; bring it into view if it opened below the fold
    else
      requestAnimationFrame(() =>
        document
          .getElementById("evidence")
          ?.scrollIntoView({
            block: "nearest",
            behavior: reduced() ? "auto" : "smooth",
          }),
      );
  };
  const moveStep = (d: number) => {
    if (!pin) return;
    const segs = uniq(pin.ev);
    const i = (step + d + segs.length) % segs.length;
    setStep(i);
    centreIn(document.getElementById(`seg-${segs[i]}`));
  };
  const openTranscript = (seg?: string) => {
    if (mode === "mid") setDrawer(true);
    if (mode === "narrow") setSheet(true);
    const target = seg ?? pin?.ev[0]?.seg;
    // the drawer and the sheet mount first, then the moment scrolls into view
    window.setTimeout(
      () => {
        if (target) centreIn(document.getElementById(`seg-${target}`));
        else transcriptRef.current?.focus({ preventScroll: true });
      },
      mode === "narrow" ? 460 : 60,
    );
  };
  const citing = (seg: string) =>
    n.sections.flatMap((s) =>
      s.cur
        .filter((x) => x.ev.some((e) => e.seg === seg))
        .map((x) => ({ x, key: s.key })),
    );
  const onSeg = (seg: string) => {
    const hits = citing(seg);
    if (!hits.length) {
      setNotUsed(seg);
      window.setTimeout(() => setNotUsed((v) => (v === seg ? null : v)), 2000);
      return;
    }
    const { x } = hits[0];
    setPin({ id: x.id, ev: x.ev, by: x.by, at: x.id });
    setStep(Math.max(0, uniq(x.ev).indexOf(seg)));
    setLit(new Set(hits.map((h) => h.x.id)));
    announce(
      `${hits.length} ${hits.length === 1 ? "sentence uses" : "sentences use"} this moment`,
    );
    if (mode === "narrow") {
      setSheet(false);
      window.setTimeout(() => centrePage(`sent-${x.id}`), 420);
    } else centrePage(`sent-${x.id}`);
  };
  const onAdd = (seg: string) => {
    const r = addMissed(n.id, seg);
    if (!r) return;
    const to = n.transcript.find((g) => g.id === seg)!.missed!.to;
    toast(`Added to the ${TITLES[to]}`, r.undo);
    setFlash(r.sid);
    window.setTimeout(() => setFlash((v) => (v === r.sid ? null : v)), 1200);
    if (mode === "narrow") {
      setSheet(false);
      window.setTimeout(() => centrePage(`sent-${r.sid}`), 420);
    } else
      requestAnimationFrame(() =>
        requestAnimationFrame(() => centrePage(`sent-${r.sid}`)),
      );
  };
  const openEditor = (key: SectionKey, caret?: string) => {
    setPin(null);
    setEditing({ key, caret });
  };
  const closeEditor = (key: SectionKey) => {
    setEditing(null);
    requestAnimationFrame(() =>
      (
        document.getElementById(`edit-${key}`) ??
        document.getElementById(`sec-${key}`)
      )?.focus({ preventScroll: true }),
    );
  };
  const resolve = (sid: string, i: number) => {
    const sentence = n.sections.flatMap((s) => s.cur).find((x) => x.id === sid);
    const label =
      sentence?.flag?.options[i].text === null
        ? "removed the sentence"
        : (sentence?.flag?.options[i].label ?? "");
    const undo = resolveFlag(n.id, sid, i);
    setUndos((u) => ({ ...u, [sid]: { label, undo } }));
    const rest = openFlags(n).filter((x) => x.id !== sid);
    announce(
      rest.length
        ? `Checked. ${rest.length} more to check.`
        : "Checked. Nothing left to check.",
    );
  };
  const sign = (app: boolean) => {
    setSigning(false);
    const hasText = sectionOf(n, "patient").cur.length > 0;
    // the next note waiting after this one, else the first before it
    setAfter(
      (
        queue.slice(at + 1).find((x) => x.id !== n.id) ??
        queue.find((x) => x.id !== n.id)
      )?.id ?? null,
    );
    const r = signNote(n.id, { app });
    toast(
      `Signed. In ${first}'s record${app && hasText ? `, and ${her} summary is in ${her} app` : ""}`,
      r.undo,
    );
    window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
  };
  const jumpTo = (target: string) => {
    const el = document.getElementById(target);
    if (!el) return;
    centrePage(target);
    el.focus({ preventScroll: true });
  };

  const handleKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (
      e.defaultPrevented ||
      t.closest("input, textarea, select, [contenteditable='true']") ||
      document.documentElement.dataset.sheet
    )
      return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && e.key === "Enter") {
      if (ok) {
        e.preventDefault();
        setSigning(true);
      }
      return;
    }
    if (mod || e.altKey) return;
    const secs = Array.from(
      document.querySelectorAll<HTMLElement>("[data-sec]"),
    );
    const curSec = t.closest<HTMLElement>("[data-sec]");
    const i = curSec ? secs.indexOf(curSec) : -1;
    const k = e.key;
    if (k === "Escape") {
      if (keys) setKeys(false);
      else if (pin) {
        setPin(null);
        setLit(new Set());
      } else if (drawer) {
        setDrawer(false);
        drawerBtn.current?.focus();
      }
      return;
    }
    const focusSec = (el?: HTMLElement) => {
      if (!el) return;
      e.preventDefault();
      el.focus({ preventScroll: true });
      el.scrollIntoView({
        block: "nearest",
        behavior: reduced() ? "auto" : "smooth",
      });
    };
    if (k === "j") return focusSec(secs[Math.min(secs.length - 1, i + 1)]);
    if (k === "k") return focusSec(secs[Math.max(0, i - 1)]);
    const key = curSec?.dataset.sec as SectionKey | ListKey | undefined;
    if (
      (k === "e" || (k === "Enter" && t === curSec)) &&
      key &&
      !done &&
      !w &&
      key in PROMPT
    ) {
      e.preventDefault();
      return openEditor(key as SectionKey);
    }
    if (k === "a" && key && !done && !w) {
      e.preventDefault();
      const on =
        key in PROMPT
          ? !sectionOf(n, key as SectionKey).checked
          : !n.checks[key as ListKey];
      return checkSection(n.id, key, on);
    }
    if (k === "f") {
      const flags = openFlags(n)
        .map((x) => document.getElementById(`sent-${x.id}`))
        .filter((x): x is HTMLElement => !!x);
      const next =
        flags.find(
          (el) =>
            t.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING &&
            el !== t,
        ) ?? flags[0];
      if (next) {
        e.preventDefault();
        jumpTo(next.id);
      }
      return;
    }
    if (k === "t") {
      e.preventDefault();
      if (mode === "mid") setDrawer((v) => !v);
      else if (mode === "wide") transcriptRef.current?.focus();
      else setSheet(true);
      return;
    }
    if (k === "[" && at > 0) return go(queue[at - 1]);
    if (k === "]" && at >= 0 && at < queue.length - 1) return go(queue[at + 1]);
    if (k === "?") setKeys((v) => !v);
  };
  useEffect(() => {
    onKey.current = handleKey;
  });

  const ctx: Ctx = {
    n,
    p,
    done,
    shown,
    pin,
    lit,
    flash,
    editing,
    undos,
    hoverable,
    pinIt,
    setHover,
    openEditor,
    closeEditor,
    resolve,
    openTranscript,
    toast,
  };
  const pinSegs = pin ? uniq(pin.ev) : [];
  const quotes = new Map<string, string[]>();
  for (const e of pin?.ev ?? [])
    if (e.quote) quotes.set(e.seg, [...(quotes.get(e.seg) ?? []), e.quote]);
  const transcript = (
    <Transcript
      n={n}
      boxRef={transcriptRef}
      lit={new Set(pinSegs)}
      preview={new Set((hover ?? []).map((e) => e.seg))}
      quotes={quotes}
      notUsed={notUsed}
      missed={missed}
      filter={missed.length ? filter : "all"}
      setFilter={setFilter}
      onSeg={onSeg}
      onAdd={onAdd}
      step={
        pin && pinSegs.length
          ? {
              i: step,
              of: pinSegs.length,
              move: moveStep,
              clear: () => setPin(null),
            }
          : null
      }
      onClose={
        mode === "mid"
          ? () => {
              setDrawer(false);
              drawerBtn.current?.focus();
            }
          : undefined
      }
    />
  );

  const pill = done ? (
    <span className={c.pill} data-tone="ok">
      <SealCheck size={14} weight="fill" aria-hidden="true" /> Signed{" "}
      {lcDay(dayTime(n.signed!.at, now))}
    </span>
  ) : w ? (
    <span className={c.pill} data-tone="pending">
      <i className={st.breath} aria-hidden="true" /> Writing
    </span>
  ) : ok ? (
    // ready: nothing left to check and nothing empty; ticking sections is optional, so the pill counts them only once one is ticked
    <span
      className={c.pill}
      data-tone="ok"
      title="Nothing left to check and no section empty. Marking sections checked is optional."
    >
      Ready to sign
      {sectionsShown > 0 && (
        <span className={st.pillCount}>
          {" "}
          ·{" "}
          {sectionsShown - unchecked.length > 0 ? (
            <>
              <span className="num">{sectionsShown - unchecked.length}</span> of{" "}
              <span className="num">{sectionsShown}</span> checked
            </>
          ) : (
            "ticks optional"
          )}
        </span>
      )}
    </span>
  ) : (
    <span className={c.pill} data-tone="draft">
      Draft
    </span>
  );
  const signBtn = (
    <button
      type="button"
      className={`btn ${st.signBtn}`}
      disabled={!ok}
      onClick={() => setSigning(true)}
    >
      <span>Sign</span>
      <span className="well" aria-hidden="true">
        <Signature size={18} />
      </span>
    </button>
  );
  const status = w ? (
    <span className={st.statusQuiet}>Available once the draft is written</span>
  ) : block.length ? (
    <span className={st.blockers}>
      {block.map((b, i) => (
        <Fragment key={b.label}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <button
            type="button"
            className={st.blocker}
            onClick={() => jumpTo(b.target)}
          >
            {b.label}
          </button>
        </Fragment>
      ))}
    </span>
  ) : (
    <span className={st.readyText}>
      Ready to sign
      {/* ticking sections is optional: nothing here may read as a blocker */}
      {unchecked.length > 0 && <span> · ticks optional</span>}
    </span>
  );

  return (
    <Review.Provider value={ctx}>
      {/* a phone: its own top bar, as a pushed screen */}
      <div className={st.topBar}>
        <Link
          href="/clinician/notes"
          className={m.back}
          aria-label="Back to notes"
        >
          <ArrowLeft size={18} />
        </Link>
        <Avatar name={n.name} size={32} />
        <div className={st.topWho}>
          <h1>
            <Link href={`/clinician/patients/${n.pid}`}>{n.name}</Link>
          </h1>
          <span>
            {TYPE[n.type]} · {dayWord(n.call_at, now)}
          </span>
        </div>
        {pill}
      </div>

      <main className={`${c.page} ${st.page}`} data-mode={mode}>
        <Link href="/clinician/notes" className={`${c.back} ${st.backLink}`}>
          <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Notes
        </Link>
        <div className={st.grid}>
          <article className={st.note} aria-label={`Call note, ${n.name}`}>
            <header className={st.head}>
              <div className={st.headRow}>
                <div className={st.who}>
                  <Avatar name={n.name} size={48} />
                  <div>
                    <h1 className={st.name}>
                      <Link href={`/clinician/patients/${n.pid}`}>
                        {n.name}
                      </Link>
                    </h1>
                    <p className={st.meta}>
                      {TYPE[n.type]} by video ·{" "}
                      <span className="num">{dayTime(n.call_at, now)}</span> ·{" "}
                      <span className="num">{n.minutes}</span> min ·{" "}
                      {n.transcribed
                        ? "Transcribed with consent"
                        : `Not transcribed: ${first} did not consent to call transcription`}
                    </p>
                  </div>
                </div>
                <div className={st.cluster}>
                  <span className={st.pillWide}>{pill}</span>
                  {at >= 0 && queue.length > 1 && (
                    <span className={st.stepper}>
                      <span className={`${st.of} num`}>
                        {at + 1} of {queue.length}
                      </span>
                      <button
                        type="button"
                        className={st.iconBtn}
                        aria-label="Previous note to sign"
                        disabled={at === 0}
                        onClick={() => go(queue[at - 1])}
                      >
                        <CaretUp size={18} />
                      </button>
                      <button
                        type="button"
                        className={st.iconBtn}
                        aria-label="Next note to sign"
                        disabled={at === queue.length - 1}
                        onClick={() => go(queue[at + 1])}
                      >
                        <CaretDown size={18} />
                      </button>
                    </span>
                  )}
                  {mode === "mid" && (
                    <button
                      ref={drawerBtn}
                      type="button"
                      className={`btn btn--ghost ${st.ghostSm}`}
                      aria-expanded={drawer}
                      onClick={() => setDrawer((v) => !v)}
                    >
                      <Waveform size={16} aria-hidden="true" /> Transcript
                    </button>
                  )}
                  {hoverable && <Shortcuts open={keys} setOpen={setKeys} />}
                </div>
              </div>
              <dl className={st.safety}>
                <div
                  data-warn={
                    !p?.allergies ||
                    !/^No known/i.test(p.allergies) ||
                    undefined
                  }
                >
                  <dt>Allergies</dt>
                  <dd>
                    {p?.allergies ?? "Not recorded. Ask before prescribing."}
                  </dd>
                </div>
                <div>
                  <dt>On prescription</dt>
                  <dd>
                    {rxSigned
                      ? rxSigned.items
                          .map(
                            (i) =>
                              `${i.name.replace(/ \(.*\)/, "")} ${i.strength}`,
                          )
                          .join("; ")
                      : "Nothing prescribed"}
                  </dd>
                </div>
              </dl>
              {!n.transcribed && !done && (
                <p className={st.info}>
                  No draft or transcript. Write the note from your own notes;
                  sign as usual.
                </p>
              )}
              {w && (
                <p className={st.info} aria-live="polite">
                  The scribe is writing the note from the{" "}
                  <span className="num">{n.minutes}</span>-minute call. About{" "}
                  <span className="num">
                    {Math.max(
                      1,
                      Math.ceil((Date.parse(n.ready_at) - now) / 1000),
                    )}
                  </span>{" "}
                  s.
                </p>
              )}
            </header>

            <div
              className={st.sections}
              data-fade={(fadeIn && !w) || undefined}
            >
              <Prose k="summary" w={w} />
              <Prose k="assessment" w={w} />
              <Prose k="plan" w={w} />
              {!w && showMeds && <Medicines nextRx={nextRx} />}
              {!w && showFollow && <FollowUps />}
              {!w && n.updates.length > 0 && <Updates />}
              <Prose k="patient" w={w} />
            </div>

            {done ? (
              <>
                {nextUp && (
                  <div className={st.signBar}>
                    <span className={st.signText}>
                      <span className={st.readyText}>Signed.</span>{" "}
                      <span className="num">{toSign(notes, now).length}</span>{" "}
                      more to sign
                    </span>
                    <Link
                      href={`/clinician/notes/${nextUp.id}`}
                      className={`btn ${st.signBtn}`}
                    >
                      <span>Next to sign: {nextUp.name}</span>
                      <span className="well" aria-hidden="true">
                        <ArrowRight size={18} />
                      </span>
                    </Link>
                  </div>
                )}
                <SignedFoot />
              </>
            ) : (
              <div className={st.signBar}>
                <span className={st.signText}>{status}</span>
                {signBtn}
              </div>
            )}
          </article>

          {mode === "wide" && <aside className={st.tPanel}>{transcript}</aside>}
        </div>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </main>

      {mode === "mid" && drawer && (
        <aside className={st.drawer} aria-label="Transcript">
          {transcript}
        </aside>
      )}
      {mode === "narrow" && (
        <>
          <Sheet
            open={sheet}
            onClose={() => setSheet(false)}
            title="Transcript"
          >
            {transcript}
          </Sheet>
          <div className={st.bottomBar}>
            {!done && <p className={st.bottomStatus}>{status}</p>}
            <div className={st.bottomRow}>
              <button
                type="button"
                className={`btn btn--ghost ${st.ghostSm}`}
                onClick={() => setSheet(true)}
              >
                <Waveform size={16} aria-hidden="true" /> Transcript
              </button>
              {!done && signBtn}
              {done && nextUp && (
                <Link
                  href={`/clinician/notes/${nextUp.id}`}
                  className={`btn ${st.signBtn}`}
                >
                  <span>Next: {firstName(nextUp)}</span>
                  <span className="well" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
      {p && (
        <SignSheet
          n={n}
          p={p}
          open={signing}
          onClose={() => setSigning(false)}
          onSign={sign}
          unchecked={unchecked}
          nextRx={nextRx}
        />
      )}
    </Review.Provider>
  );
}

/* ---------- one prose section ---------- */

function SectionHead({
  k,
  title,
  meta,
  children,
}: {
  k: string;
  title: string;
  meta: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={st.secHead}>
      <h2 id={`h-${k}`} className={st.h2}>
        {title}
      </h2>
      <span className={st.secMeta}>{meta}</span>
      {children && <div className={st.tools}>{children}</div>}
    </div>
  );
}

function CheckBtn({
  on,
  title,
  onClick,
}: {
  on: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={st.check}
      aria-pressed={on}
      aria-label={`Mark ${title} as checked`}
      onClick={onClick}
    >
      <Check size={16} weight="bold" />
    </button>
  );
}

function Prose({ k, w }: { k: SectionKey; w: boolean }) {
  const x = useContext(Review);
  const { n, done } = x;
  const s = sectionOf(n, k);
  const title = TITLES[k];
  const isEdited = edited(s);
  const editing = x.editing?.key === k;
  const allDoctor = s.cur.length > 0 && s.cur.every((y) => y.by === "doctor");
  const meta = w ? null : done ? null : s.checked ? (
    <>
      <Check
        size={13}
        weight="bold"
        className={st.metaTick}
        aria-hidden="true"
      />{" "}
      Checked
    </>
  ) : !s.cur.length ? null : allDoctor && !s.draft.length ? (
    "Written by you"
  ) : isEdited ? (
    "Edited by you"
  ) : (
    "Drafted by the scribe"
  );
  const appLine =
    k === "patient" && !done
      ? `Shown in ${firstName(n)}'s app after you sign`
      : null;
  const plan = sectionOf(n, "plan").cur;

  const body = w ? (
    <div className={st.skel} aria-hidden="true">
      <span style={{ width: "92%" }} />
      <span style={{ width: "80%" }} />
      <span style={{ width: "64%" }} />
    </div>
  ) : editing ? (
    <Editor k={k} caret={x.editing?.caret} />
  ) : !s.cur.length ? (
    done ? (
      <p className={st.none}>Nothing recorded.</p>
    ) : (
      <button
        type="button"
        className={st.emptyBox}
        onClick={() => x.openEditor(k)}
      >
        {PROMPT[k]}
      </button>
    )
  ) : k === "plan" ? (
    <ul className={st.planList}>
      {s.cur.map((y) => (
        <li key={y.id}>
          <Sent y={y} />
          <Under k={k} ids={[y.id]} />
        </li>
      ))}
    </ul>
  ) : (
    <>
      <p className={st.prose}>
        {s.cur.map((y) => (
          <Fragment key={y.id}>
            <Sent y={y} />{" "}
          </Fragment>
        ))}
      </p>
      <Under k={k} ids={s.cur.map((y) => y.id)} />
    </>
  );

  return (
    <section
      id={`sec-${k}`}
      data-sec={k}
      tabIndex={-1}
      aria-labelledby={`h-${k}`}
      className={st.sec}
    >
      <SectionHead
        k={k}
        title={title}
        meta={
          <>
            {meta}
            {meta && appLine ? " · " : ""}
            {appLine}
          </>
        }
      >
        {!w && !done && (
          <>
            {s.cur.length > 0 && (
              <CheckBtn
                on={s.checked}
                title={title}
                onClick={() => checkSection(n.id, k, !s.checked)}
              />
            )}
            {!editing && s.cur.length > 0 && (
              <button
                type="button"
                id={`edit-${k}`}
                className={`${c.textBtn} ${st.editBtn}`}
                onClick={() => x.openEditor(k)}
              >
                Edit
              </button>
            )}
            {(s.cur.length > 0 || s.draft.length > 0) && (
              <More
                k={k}
                canRestore={isEdited && s.draft.length > 0}
                text={s.cur.map((y) => y.text).join(k === "plan" ? "\n" : " ")}
              />
            )}
          </>
        )}
      </SectionHead>
      <div
        className={st.body}
        data-tone={!done && !s.checked ? "draft" : undefined}
      >
        {k === "patient" && !w && !editing && s.cur.length > 0 ? (
          <div className={st.preview}>
            <p className={st.previewHead}>
              <Avatar name={DOCTOR.name} src={DOCTOR.photo_url} size={24} />{" "}
              {DOCTOR.name} · after your call
            </p>
            {body}
            {plan.length > 0 && (
              <>
                <p className={st.nextHead}>Next steps</p>
                <ul className={st.nextList}>
                  {plan.map((y) => (
                    <li key={y.id}>{y.text}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          body
        )}
      </div>
    </section>
  );
}

/** One sentence: press it to see where it was said. Links, not buttons, so a paragraph still wraps as prose. */
function Sent({ y }: { y: Sentence }) {
  const x = useContext(Review);
  const open = !!y.flag && !y.flag.resolved && !x.done;
  const pinned = x.pin?.id === y.id;
  const press = () => x.pinIt({ id: y.id, ev: y.ev, by: y.by, at: y.id });
  return (
    <a
      href={`#sent-${y.id}`}
      id={`sent-${y.id}`}
      role="button"
      className={st.sent}
      data-by={y.by}
      data-flag={open || undefined}
      data-lit={x.lit.has(y.id) || undefined}
      data-flash={x.flash === y.id || undefined}
      aria-pressed={pinned}
      aria-describedby={open ? `flag-${y.id}` : undefined}
      onClick={(e) => {
        e.preventDefault();
        press();
      }}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          press();
        }
      }}
      onMouseEnter={x.hoverable ? () => x.setHover(y.ev) : undefined}
      onMouseLeave={x.hoverable ? () => x.setHover(null) : undefined}
    >
      {y.text}
    </a>
  );
}

/** What sits under a paragraph or a plan point: its open flags, settled flags, and the evidence card. */
function Under({ k, ids }: { k: SectionKey; ids: string[] }) {
  const x = useContext(Review);
  const s = sectionOf(x.n, k);
  const rows = s.cur.filter((y) => ids.includes(y.id));
  const removed =
    k !== "plan"
      ? Object.entries(x.undos).filter(
          ([sid, u]) =>
            sid.startsWith(`${x.n.id}-${k}-`) &&
            !s.cur.some((y) => y.id === sid) &&
            u.label === "removed the sentence",
        )
      : [];
  return (
    <>
      {x.pin && !x.shown && rows.some((y) => y.id === x.pin!.at) && (
        <EvidenceCard />
      )}
      {!x.done &&
        rows.map((y) =>
          y.flag && !y.flag.resolved ? (
            <FlagCard key={y.id} y={y} k={k} />
          ) : y.flag?.resolved ? (
            <Settled key={y.id} sid={y.id} label={y.flag.resolved} />
          ) : null,
        )}
      {!x.done &&
        removed.map(([sid]) => (
          <Settled key={sid} sid={sid} label="removed the sentence" />
        ))}
    </>
  );
}

function Settled({ sid, label }: { sid: string; label: string }) {
  const x = useContext(Review);
  const u = x.undos[sid];
  return (
    <p className={st.settled}>
      <Check size={13} weight="bold" aria-hidden="true" /> Checked: {label}
      {u && (
        <button
          type="button"
          className={st.inlineBtn}
          onClick={() => {
            u.undo();
            x.toast("Put back as the scribe wrote it");
          }}
        >
          Undo
        </button>
      )}
    </p>
  );
}

function FlagCard({ y, k }: { y: Sentence; k: SectionKey }) {
  const x = useContext(Review);
  const f = y.flag!;
  return (
    <div
      className={st.flag}
      role="group"
      id={`flag-${y.id}`}
      aria-labelledby={`flag-t-${y.id}`}
    >
      <p id={`flag-t-${y.id}`} className={st.flagTitle}>
        <WarningCircle size={15} weight="fill" aria-hidden="true" />{" "}
        {FLAG_TITLE[f.kind]}
      </p>
      <p className={st.flagWhy}>{f.why}</p>
      <div className={st.flagOpts}>
        {f.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            className={c.outcome}
            onClick={() => x.resolve(y.id, i)}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          className={`${c.textBtn} ${st.flagEdit}`}
          onClick={() => x.openEditor(k, y.id)}
        >
          Edit it myself
        </button>
      </div>
    </div>
  );
}

/** Where a sentence came from, shown in place when the transcript is not on screen. */
function EvidenceCard() {
  const x = useContext(Review);
  const pin = x.pin!;
  const segs = uniq(pin.ev)
    .map((id) => x.n.transcript.find((g) => g.id === id))
    .filter((g): g is Seg => !!g);
  return (
    <div id="evidence" className={st.evidence}>
      {segs.length ? (
        <>
          {segs.map((g) => (
            <div key={g.id} className={st.evRow}>
              <p className={`${st.evWhen} num`}>
                {mmss(g.t)} · {g.who === "doctor" ? ME.short : firstName(x.n)}
              </p>
              <p className={st.evText}>
                <Marked
                  text={g.text}
                  quotes={pin.ev
                    .filter((e) => e.seg === g.id && e.quote)
                    .map((e) => e.quote!)}
                  unsure={g.unsure}
                />
              </p>
              {g.en && <p className={st.en}>In English: {g.en}</p>}
            </div>
          ))}
          <button
            type="button"
            className={c.textBtn}
            onClick={() => x.openTranscript(segs[0].id)}
          >
            Open the transcript <ArrowRight size={15} aria-hidden="true" />
          </button>
        </>
      ) : (
        <p className={st.evNone}>
          {pin.by === "doctor" ? "Written by you." : "Not linked to the call."}
        </p>
      )}
    </div>
  );
}

function Editor({ k, caret }: { k: SectionKey; caret?: string }) {
  const x = useContext(Review);
  const s = sectionOf(x.n, k);
  const sep = k === "plan" ? "\n" : " ";
  const [text, setText] = useState(() => s.cur.map((y) => y.text).join(sep));
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const closed = useRef(false);
  const grow = () => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    grow();
    el.focus({ preventScroll: true });
    // "Edit it myself" puts the caret at the start of that sentence
    const target = caret ? s.cur.find((y) => y.id === caret)?.text : undefined;
    const at = target ? el.value.indexOf(target) : el.value.length;
    el.setSelectionRange(at, target ? at + target.length : at);
    // run once, when the editor opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const finish = (save: boolean) => {
    if (closed.current) return;
    closed.current = true;
    if (save) editSection(x.n.id, k, text);
    x.closeEditor(k);
  };
  return (
    <div ref={box} className={st.editor}>
      <div className={m.box}>
        <label htmlFor={`ed-${k}`} className="sr-only">
          {TITLES[k]}
        </label>
        <textarea
          id={`ed-${k}`}
          ref={field}
          className={st.field}
          rows={k === "plan" ? 4 : 3}
          value={text}
          placeholder={PROMPT[k]}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Escape" ||
              (e.key === "Enter" && (e.metaKey || e.ctrlKey))
            ) {
              e.preventDefault();
              e.stopPropagation();
              finish(true);
            }
          }}
          onBlur={(e) => {
            // leaving for another control in the editor, or leaving the window, is not finishing
            if (
              (e.relatedTarget &&
                box.current?.contains(e.relatedTarget as Node)) ||
              !document.hasFocus()
            )
              return;
            finish(true);
          }}
        />
      </div>
      <div className={st.editFoot}>
        <p className={st.hint}>
          {x.hoverable ? "Esc or ⌘Enter to finish. " : ""}
          {x.n.transcript.length
            ? "Sentences you change lose their link to the call."
            : k === "plan"
              ? "One point per line."
              : ""}
        </p>
        <span className={st.editActions}>
          <button
            type="button"
            className={st.inlineBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => finish(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${st.doneBtn}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => finish(true)}
          >
            Done
          </button>
        </span>
      </div>
    </div>
  );
}

/** Restore and Copy: a small menu. Esc closes it and focus goes back to the button. */
function More({
  k,
  canRestore,
  text,
}: {
  k: SectionKey;
  canRestore: boolean;
  text: string;
}) {
  const x = useContext(Review);
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>("button:not([disabled])")
      ?.focus();
    const away = (e: PointerEvent) => {
      if (
        !menu.current?.contains(e.target as Node) &&
        e.target !== btn.current &&
        !btn.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };
  return (
    <span className={st.moreWrap}>
      <button
        ref={btn}
        type="button"
        className={st.iconBtn}
        aria-label={`More for the ${TITLES[k]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <DotsThree size={20} weight="bold" />
      </button>
      {open && (
        <div
          ref={menu}
          className={st.menu}
          role="menu"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const items = Array.from(
                menu.current!.querySelectorAll<HTMLButtonElement>(
                  "button:not([disabled])",
                ),
              );
              const i = items.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              items[
                (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                  items.length
              ]?.focus();
            }
          }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canRestore}
            onClick={() => {
              restoreSection(x.n.id, k);
              close();
              x.toast(`The scribe's ${TITLES[k]} is back`);
            }}
          >
            Restore the scribe&apos;s draft
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              close();
              try {
                await navigator.clipboard.writeText(text);
                x.toast(`${TITLES[k]} copied`);
              } catch {
                x.toast("Copying is not available here");
              }
            }}
          >
            Copy
          </button>
        </div>
      )}
    </span>
  );
}

function Shortcuts({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, setOpen]);
  const rows: [string[], string][] = [
    [["J", "K"], "Next or previous section"],
    [["E"], "Edit the section"],
    [["A"], "Mark the section checked"],
    [["F"], "Next thing to check"],
    [["T"], "Transcript"],
    [["[", "]"], "Previous or next note"],
    [["Esc"], "Finish editing, or let go"],
    [["⌘", "⇧", "Enter"], "Sign, when ready"],
    [["?"], "These shortcuts"],
  ];
  return (
    <span ref={ref} className={st.moreWrap}>
      <button
        type="button"
        className={st.iconBtn}
        aria-label="Keyboard shortcuts"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Keyboard size={19} />
      </button>
      {open && (
        <div
          className={`${st.menu} ${st.keys}`}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <dl>
            {rows.map(([k, d]) => (
              <div key={d}>
                <dt>
                  {k.map((x) => (
                    <kbd key={x}>{x}</kbd>
                  ))}
                </dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </span>
  );
}

/* ---------- the lists below the prose ---------- */

function ListHead({ k }: { k: ListKey }) {
  const x = useContext(Review);
  const on = !!x.n.checks[k];
  return (
    <SectionHead
      k={k}
      title={TITLES[k]}
      meta={
        x.done ? null : on ? (
          <>
            <Check
              size={13}
              weight="bold"
              className={st.metaTick}
              aria-hidden="true"
            />{" "}
            Checked
          </>
        ) : (
          "Found by the scribe"
        )
      }
    >
      {!x.done && (
        <CheckBtn
          on={on}
          title={TITLES[k]}
          onClick={() => checkSection(x.n.id, k, !on)}
        />
      )}
    </SectionHead>
  );
}

function Tick({
  on,
  onChange,
  label,
  show = true,
  disabled,
}: {
  on: boolean;
  onChange: () => void;
  label: ReactNode;
  show?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className={st.tick} data-off={disabled || undefined}>
      <input
        type="checkbox"
        checked={on}
        onChange={onChange}
        disabled={disabled}
      />
      <span className={st.box} aria-hidden="true">
        <Check size={13} weight="bold" />
      </span>
      <span className={show ? undefined : "sr-only"}>{label}</span>
    </label>
  );
}

function EvBtn({ id, ev, label }: { id: string; ev: Ev[]; label: string }) {
  const x = useContext(Review);
  if (!ev.length) return <span />;
  return (
    <button
      type="button"
      className={st.evBtn}
      aria-label={`Where this was said: ${label}`}
      aria-pressed={x.pin?.id === id}
      onClick={() => x.pinIt({ id, ev, by: "scribe", at: id })}
      onMouseEnter={x.hoverable ? () => x.setHover(ev) : undefined}
      onMouseLeave={x.hoverable ? () => x.setHover(null) : undefined}
    >
      <Waveform size={18} />
    </button>
  );
}
const evCard = (x: Ctx, id: string) =>
  x.pin && !x.shown && x.pin.at === id && <EvidenceCard />;

function Medicines({ nextRx }: { nextRx: number }) {
  const x = useContext(Review);
  const { n } = x;
  const changes = rxChanges(n).length;
  const signedRx = n.signed?.rx_id
    ? x.p?.rx.find((r) => r.id === n.signed!.rx_id)
    : undefined;
  const ACT = {
    START: "Start",
    CHANGE: "Change",
    STOP: "Stop",
    CONTINUE: "Continue",
  } as const;
  return (
    <section
      id="sec-meds"
      data-sec="meds"
      tabIndex={-1}
      aria-labelledby="h-meds"
      className={st.sec}
    >
      <ListHead k="meds" />
      <div className={st.body}>
        {n.meds.length ? (
          <ul className={st.rows}>
            {n.meds.map((d) => (
              <li key={d.id}>
                <div
                  className={st.medRow}
                  data-out={
                    (!d.include && d.action !== "CONTINUE") || undefined
                  }
                >
                  <span className={st.act} data-act={d.action}>
                    {ACT[d.action]}
                  </span>
                  <span className={st.medText}>
                    <strong>
                      {d.name} {d.strength}
                    </strong>
                    <span>{d.detail}</span>
                    {d.was && <em>Was: {d.was}</em>}
                  </span>
                  <span className={st.rowTools}>
                    <EvBtn id={`med-${d.id}`} ev={d.ev} label={d.name} />
                    {d.action !== "CONTINUE" && !x.done && (
                      <Tick
                        on={d.include}
                        onChange={() => toggleMed(n.id, d.id)}
                        label={
                          <>
                            Include
                            <span className="sr-only">
                              : {ACT[d.action].toLowerCase()} {d.name}
                            </span>
                          </>
                        }
                      />
                    )}
                  </span>
                </div>
                {evCard(x, `med-${d.id}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p className={st.none}>No medicine came up on this call.</p>
        )}
        <p className={st.foot}>
          {x.done
            ? signedRx
              ? `The changes became prescription version ${signedRx.version}, for you to sign separately.`
              : "No change to the prescription."
            : changes
              ? `Included changes become prescription version ${nextRx}, a draft you sign separately.`
              : "No change to the prescription."}
        </p>
      </div>
    </section>
  );
}

function FollowUps() {
  const x = useContext(Review);
  const { n, done } = x;
  const rows = done ? n.followups.filter((f) => f.include) : n.followups;
  return (
    <section
      id="sec-followups"
      data-sec="followups"
      tabIndex={-1}
      aria-labelledby="h-followups"
      className={st.sec}
    >
      <ListHead k="followups" />
      <div className={st.body}>
        {rows.length ? (
          <ul className={st.rows}>
            {rows.map((f) => {
              const on = done ? f.done : f.include;
              return (
                <li key={f.id}>
                  <div
                    className={st.fuRow}
                    data-out={
                      (!done && !f.include) || (done && f.done) || undefined
                    }
                  >
                    <Tick
                      on={on}
                      onChange={() =>
                        done
                          ? markFollowUpDone(n.id, f.id)
                          : toggleFollowUp(n.id, f.id)
                      }
                      label={
                        <>
                          <span className="sr-only">
                            {done ? "Done: " : "Include: "}
                          </span>
                          {f.text}
                        </>
                      }
                    />
                    <span className={st.owner}>
                      {done && sentTo(f) ? `Sent to ${sentTo(f)}` : f.owner}
                    </span>
                    <EvBtn id={`fu-${f.id}`} ev={f.ev} label={f.text} />
                  </div>
                  {evCard(x, `fu-${f.id}`)}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={st.none}>No follow-ups.</p>
        )}
        {!done && rows.some((f) => f.owner !== "You") && (
          <p className={st.foot}>
            Care team and dietitian items go to them when you sign.
          </p>
        )}
      </div>
    </section>
  );
}

function Updates() {
  const x = useContext(Review);
  const { n, done } = x;
  return (
    <section
      id="sec-updates"
      data-sec="updates"
      tabIndex={-1}
      aria-labelledby="h-updates"
      className={st.sec}
    >
      <ListHead k="updates" />
      <div className={st.body}>
        <ul className={st.rows}>
          {n.updates
            .filter((u) => !done || u.include)
            .map((u) => (
              <li
                key={u.id}
                className={st.upRow}
                data-out={!u.include || undefined}
              >
                <p>
                  <span className={st.upLabel}>{u.label}</span>
                  <s>{u.from}</s>
                  <ArrowRight
                    size={14}
                    aria-label="to"
                    className={st.upArrow}
                  />
                  <span>{u.to}</span>
                </p>
                {!done && (
                  <Tick
                    on={u.include}
                    onChange={() => toggleUpdate(n.id, u.id)}
                    label={
                      <>
                        Include<span className="sr-only">: {u.label}</span>
                      </>
                    }
                  />
                )}
              </li>
            ))}
        </ul>
        <p className={st.foot}>
          {done
            ? "Applied to the record when you signed."
            : "Applied to the record when you sign."}
        </p>
      </div>
    </section>
  );
}

/* ---------- after signing ---------- */

function SignedFoot() {
  const x = useContext(Review);
  const { n, p } = x;
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const rx = n.signed?.rx_id
    ? p?.rx.find((r) => r.id === n.signed!.rx_id)
    : undefined;
  return (
    <footer className={st.signedFoot}>
      <p className={st.signedBy}>
        <SealCheck size={18} weight="fill" aria-hidden="true" />
        <span>
          Signed by {n.signed!.by}, {ME.qualification},{" "}
          <span className="num">{stampOf(n.signed!.at)}</span>
        </span>
      </p>
      {rx && (
        <div className={c.confirm}>
          <p>
            {rx.status === "DRAFT"
              ? `Prescription version ${rx.version} is a draft.`
              : `Prescription version ${rx.version} is signed.`}
          </p>
          {rx.status === "DRAFT" && (
            <div>
              <Link
                href={`/clinician/patients/${n.pid}#prescriptions`}
                className="btn"
              >
                <span>Review and sign</span>
                <span className="well" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </Link>
            </div>
          )}
        </div>
      )}
      {n.addenda.length > 0 && (
        <ol className={st.addenda}>
          {n.addenda.map((a) => (
            <li key={a.at}>
              <p className={st.addHead}>
                Addendum · {a.by}, <span className="num">{stampOf(a.at)}</span>
              </p>
              <p>{a.text}</p>
            </li>
          ))}
        </ol>
      )}
      {adding ? (
        <form
          className={st.editor}
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            addAddendum(n.id, text);
            setText("");
            setAdding(false);
            x.toast("Addendum signed");
          }}
        >
          <div className={m.box}>
            <label htmlFor="addendum" className="sr-only">
              Addendum
            </label>
            <textarea
              id="addendum"
              className={st.field}
              rows={3}
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              placeholder="What to add. The note above stays as signed."
            />
          </div>
          <div className={st.editFoot}>
            <p className={st.hint}>
              Signed under your name, with today&apos;s date.
            </p>
            <span className={st.editActions}>
              <button
                type="button"
                className={st.inlineBtn}
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${st.doneBtn}`}
                disabled={!text.trim()}
              >
                Sign addendum
              </button>
            </span>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={c.textBtn}
          onClick={() => setAdding(true)}
        >
          Add an addendum
        </button>
      )}
      <details className={c.history}>
        <summary>History</summary>
        <ul className={st.log}>
          {n.log.map((l, i) => (
            <li key={i}>
              {l.what},{" "}
              <span className="num">
                {dayWord(l.at, Date.parse(n.signed!.at)) === "Today"
                  ? clock(l.at)
                  : `${short(l.at)}, ${clock(l.at)}`}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </footer>
  );
}

/* ---------- the transcript ---------- */

function Transcript({
  n,
  boxRef,
  lit,
  preview,
  quotes,
  notUsed,
  missed,
  filter,
  setFilter,
  onSeg,
  onAdd,
  step,
  onClose,
}: {
  n: CallNote;
  boxRef: React.RefObject<HTMLDivElement | null>;
  lit: Set<string>;
  preview: Set<string>;
  quotes: Map<string, string[]>;
  notUsed: string | null;
  missed: Seg[];
  filter: "all" | "missed";
  setFilter: (v: "all" | "missed") => void;
  onSeg: (id: string) => void;
  onAdd: (id: string) => void;
  step: {
    i: number;
    of: number;
    move: (d: number) => void;
    clear: () => void;
  } | null;
  onClose?: () => void;
}) {
  const open = new Set(missed.map((g) => g.id));
  const rows = filter === "missed" ? missed : n.transcript;
  const first = firstName(n);
  return (
    <div
      ref={boxRef}
      className={st.transcript}
      tabIndex={-1}
      aria-label="Transcript"
    >
      <div className={st.tHead}>
        <div className={st.tTitle}>
          <h2 className={st.h2}>Transcript</h2>
          {n.transcribed && (
            <span className={st.secMeta}>
              <span className="num">{n.minutes}</span> min ·{" "}
              {n.transcript.some((g) => g.en) ? "English and Hindi" : "English"}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              className={st.iconBtn}
              aria-label="Close the transcript"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          )}
        </div>
        {missed.length > 0 && (
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { v: "all", label: "All" },
              {
                v: "missed",
                label: (
                  <>
                    Not in the note
                    <span className="num">&nbsp;{missed.length}</span>
                  </>
                ),
              },
            ]}
          />
        )}
        {step && (
          <div className={st.moments}>
            <span className="num">
              {step.i + 1} of {step.of} {step.of === 1 ? "moment" : "moments"}
            </span>
            {step.of > 1 && (
              <>
                <button
                  type="button"
                  className={st.iconBtn}
                  aria-label="Previous moment"
                  onClick={() => step.move(-1)}
                >
                  <CaretUp size={16} />
                </button>
                <button
                  type="button"
                  className={st.iconBtn}
                  aria-label="Next moment"
                  onClick={() => step.move(1)}
                >
                  <CaretDown size={16} />
                </button>
              </>
            )}
            <button type="button" className={st.inlineBtn} onClick={step.clear}>
              Clear
            </button>
          </div>
        )}
      </div>
      {!n.transcribed ? (
        <p className={st.tNone}>
          Not transcribed. {first} did not consent to call transcription, so
          there is no draft.
        </p>
      ) : (
        <ol className={st.tList} aria-label="Transcript">
          {rows.map((g) => (
            <li
              key={g.id}
              id={`seg-${g.id}`}
              className={st.tRow}
              data-lit={lit.has(g.id) || undefined}
              data-preview={(!lit.has(g.id) && preview.has(g.id)) || undefined}
            >
              <button
                type="button"
                className={st.tBtn}
                onClick={() => onSeg(g.id)}
              >
                <span className={`${st.tTime} num`}>{mmss(g.t)}</span>
                <span className={st.tBody}>
                  <span className={st.tWho}>
                    {g.who === "doctor" ? ME.short : first}
                  </span>
                  <span className={st.tText}>
                    <Marked
                      text={g.text}
                      quotes={lit.has(g.id) ? quotes.get(g.id) : undefined}
                      unsure={g.unsure}
                    />
                  </span>
                  {g.en && <span className={st.en}>In English: {g.en}</span>}
                  {notUsed === g.id && (
                    <span className={st.notUsed}>Not used in the note</span>
                  )}
                </span>
              </button>
              {open.has(g.id) && (
                <span className={st.missed}>
                  <span className={st.tag}>Not in the note</span>
                  <button
                    type="button"
                    className={st.inlineBtn}
                    onClick={() => onAdd(g.id)}
                  >
                    Add to {TITLES[g.missed!.to]}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------- signing ---------- */

/** One thing that signing writes, and where it goes. */
function Row({
  icon,
  title,
  where,
  off,
  children,
}: {
  icon: ReactNode;
  title: ReactNode;
  where: ReactNode;
  off?: boolean;
  children?: ReactNode;
}) {
  return (
    <li className={st.sRow} data-off={off || undefined}>
      <span className={st.sIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={st.sText}>
        <strong>{title}</strong>
        <span>{where}</span>
        {children}
      </span>
    </li>
  );
}

function SignSheet({
  n,
  p,
  open,
  onClose,
  onSign,
  unchecked,
  nextRx,
}: {
  n: CallNote;
  p: Patient;
  open: boolean;
  onClose: () => void;
  onSign: (app: boolean) => void;
  unchecked: string[];
  nextRx: number;
}) {
  const [app, setApp] = useState(true);
  const primary = useRef<HTMLButtonElement>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!open) return;
    // the sheet settles, then the signature button takes focus so Enter signs
    const t = window.setTimeout(() => {
      setNow(Date.now());
      primary.current?.focus();
    }, 180);
    return () => clearTimeout(t);
  }, [open]);
  const first = firstName(n);
  const her = p.sex === "Male" ? "his" : "her";
  const plan = sectionOf(n, "plan").cur;
  const forPatient = sectionOf(n, "patient").cur.length > 0;
  const changes = rxChanges(n);
  const ups = n.updates.filter((u) => u.include);
  const flagged = p.symptoms.filter(
    (s) => s.requires_review && !s.acknowledged,
  );
  const fus = n.followups.filter((f) => f.include);
  const fuWhere = (["Care team", "Dietitian", "You"] as const)
    .map((o) => [o, fus.filter((f) => f.owner === o).length] as const)
    .filter(([, k]) => k)
    .map(([o, k]) =>
      o === "You"
        ? `${k} on your list`
        : `${k} to the ${o === "Care team" ? "care team" : "dietitian"}`,
    );
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Sign and add to ${first}'s record`}
    >
      <ul className={st.sList}>
        <Row
          icon={<Notepad size={17} />}
          title="Visit summary and assessment"
          where={`Visits in ${her} record, as the ${short(n.call_at)} ${TYPE[n.type].toLowerCase()} call`}
        />
        <Row
          icon={<ListChecks size={17} />}
          title={`Plan, ${plan.length} ${plan.length === 1 ? "point" : "points"}`}
          where="Visits, as told to the patient"
        />
        {changes.length ? (
          <Row
            icon={<Prescription size={17} />}
            title={`Prescription version ${nextRx}, draft`}
            where={`For you to sign separately. ${first} sees it only after that.`}
          />
        ) : (
          <Row
            icon={<Prescription size={17} />}
            title="No prescription change"
            where="The current prescription stands"
            off
          />
        )}
        {forPatient ? (
          <Row
            icon={<ChatsCircle size={17} />}
            title={`Summary for ${first}`}
            where={
              app
                ? `${her[0].toUpperCase()}${her.slice(1)} app, under past consultations`
                : "Kept in the record only"
            }
          >
            <button
              type="button"
              role="switch"
              aria-checked={app}
              className={st.switch}
              onClick={() => setApp((v) => !v)}
            >
              <span className={st.knob} aria-hidden="true" />
              Send to {her} app
            </button>
          </Row>
        ) : (
          <Row
            icon={<ChatsCircle size={17} />}
            title={`No summary for ${first}`}
            where="Nothing goes to the app"
            off
          />
        )}
        {ups.map((u) => (
          <Row
            key={u.id}
            icon={<IdentificationBadge size={17} />}
            title={u.label}
            where={u.to}
          />
        ))}
        {flagged.map((s) => (
          <Row
            key={s.id}
            icon={<WarningCircle size={17} />}
            title={`${s.label}, flagged ${short(s.at)}`}
            where="Marked as discussed on the call"
          />
        ))}
        {fus.length > 0 && (
          <Row
            icon={<ListChecks size={17} />}
            title={`${fus.length} ${fus.length === 1 ? "follow-up" : "follow-ups"}`}
            where={andList(fuWhere)}
          />
        )}
      </ul>
      {unchecked.length > 0 && (
        <p className={st.sNote}>
          {unchecked.length > 3
            ? `${unchecked.length} sections are not marked checked. Signing confirms the note as written.`
            : `${andList(unchecked)} ${unchecked.length === 1 ? "is" : "are"} not marked checked. Signing confirms ${unchecked.length === 1 ? "it" : "them"} as written.`}
        </p>
      )}
      <div className={st.sig}>
        <span>
          {ME.name}, {ME.qualification}
        </span>
        <span className="num">{stampOf(new Date(now).toISOString())}</span>
      </div>
      <div className={st.sActions}>
        <button
          ref={primary}
          type="button"
          className="btn"
          onClick={() => onSign(forPatient && app)}
        >
          <span>Sign as {ME.name}</span>
          <span className="well" aria-hidden="true">
            <Signature size={18} />
          </span>
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Not yet
        </button>
      </div>
    </Sheet>
  );
}

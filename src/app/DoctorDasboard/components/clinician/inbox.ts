"use client";

import { useSyncExternalStore } from "react";
import { getCare, getDashboard } from "../account/api";
import { postAs, readThread, samples, seedOf, URGENT, useChatStore, type Msg } from "../account/chat-store";
import { CLINIC_DAY, clinicAgo, ME, type OpenMessages, type Patient } from "./data";

/*
  The doctor's side of the patient chat: GET /api/v1/doctor/messages and POST
  /api/v1/doctor/messages/:patient_id in the product. Each patient has one thread, written in the
  app or on WhatsApp, answered by the care team, the dietitian or the doctor.

  Prototype: Aanya Kapoor's thread is the patient app's own chat in this browser, so a message
  sent there arrives here, and the doctor's reply arrives there. The other patients' threads
  are made up and kept in this browser.
*/

export type From = "patient" | "team" | "coach" | "doctor";
export type CMsg = { id: string; from: From; text: string; at: number; to?: "doctor" | "coach"; via?: "app" | "whatsapp"; urgent?: boolean; image?: boolean };
export type Thread = { pid: string; name: string; msgs: CMsg[]; live: boolean };

/** Who answers on the care side, by name. Sample names, matching the patient app. */
export const SIDE: Record<Exclude<From, "patient">, { name: string; role: string }> = {
  team: { name: "Neha Joshi", role: "Care team" },
  coach: { name: "Ritika Sharma", role: "Dietitian" },
  doctor: { name: ME.short, role: "You" },
};

/** Quick replies: the three things a doctor writes most, one tap to fill, always editable. */
export const QUICK = [
  { label: "Noted for your review", text: "Thanks for letting me know. I have noted it in your record, and we will go through it at your review." },
  { label: "Book a follow-up", text: "Please book a follow-up in the app so we can talk this through properly." },
  { label: "If worse, call 112", text: "If this gets worse, or you feel unwell, go to the nearest hospital or call 112." },
];

const KEY = "medistry-clinic-messages";
type Store = { anchor: number; replies: Record<string, CMsg[]>; seen: Record<string, number>; done: Record<string, number> };
const EMPTY: Store = { anchor: 0, replies: {}, seen: {}, done: {} };

let cache: Store | null = null;
const listeners = new Set<() => void>();
function read(): Store {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  if (!cache!.anchor) cache = { ...cache!, anchor: Date.now() };
  return cache!;
}
function write(fn: (s: Store) => Store) {
  cache = fn(read());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // private browsing: holds for this visit
  }
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
const useStore = () => useSyncExternalStore(subscribe, read, () => EMPTY);

const M = 6e4;
const H = 60 * M;
/* a day of clinic hours: sample times count back through open hours only, so nothing lands at night or on a Sunday */
const D = CLINIC_DAY;

/** Made-up threads for the other patients: a mix that needs the doctor and that the team has handled. */
function sampleThreads(anchor: number): Omit<Thread, "live">[] {
  const m = (id: string, from: From, ago: number, text: string, extra: Partial<CMsg> = {}): CMsg => ({ id, from, at: clinicAgo(anchor, ago), text, ...extra });
  return [
    {
      pid: "p_meera",
      name: "Meera Iyer",
      msgs: [
        m("me1", "team", 3 * D, "Hi Meera, I'm Neha from your care team. Your consultation with Dr. Menon is booked."),
        m("me2", "patient", 40 * M, "I have an ultrasound report from last year. Should I share it before the consultation, and do I need new blood tests?", { to: "doctor" }),
      ],
    },
    {
      pid: "p_ritu",
      name: "Ritu Malhotra",
      msgs: [
        m("ri1", "patient", D + 3 * H, "Can the evening tablet move to lunch? Dinner is very late on weekdays.", { via: "whatsapp", to: "doctor" }),
        m("ri2", "team", D + 2 * H, "I have passed this to Dr. Menon, Ritu. He will reply here."),
        m("ri3", "patient", 2 * H, "Felt a bit dizzy before breakfast today. Is that the medicine?", { via: "whatsapp", to: "doctor" }),
      ],
    },
    {
      pid: "p_arjun",
      name: "Arjun Bhatia",
      msgs: [
        m("ar1", "patient", 2 * D, "Constipation is better since I added the isabgol. Thank you."),
        m("ar2", "coach", 2 * D - 40 * M, "Good to hear, Arjun. Keep water at 2.5 litres, and add a fruit at 4 pm."),
      ],
    },
    {
      pid: "p_vikram",
      name: "Vikram Sethi",
      msgs: [
        m("vi1", "patient", 5 * H, "Can I move my review to Friday evening?", { via: "whatsapp" }),
        m("vi2", "team", 4 * H, "Done, Vikram. Friday at 6:30 pm with Dr. Menon. The link is in the app."),
      ],
    },
    {
      pid: "p_priya",
      name: "Priya Raghavan",
      msgs: [m("pr1", "patient", 3 * D, "Uploaded my thyroid report from last month.", { image: true }), m("pr2", "team", 3 * D - H, "Thanks, Priya. It is in your record for your review.")],
    },
  ];
}

const fromApp = (m: Msg): CMsg => ({
  id: m.id,
  from: m.from === "me" ? "patient" : m.from,
  text: m.text ?? "",
  at: m.at,
  to: m.to,
  via: m.via,
  urgent: m.urgent ?? (m.from === "me" && !!m.text && URGENT.test(m.text)),
  image: !!m.image,
});

/** Every thread, newest activity first (Messages re-sorts by need). Aanya's is live from the patient app when she is signed in here. */
export function useThreads(): Thread[] {
  const store = useStore();
  const chat = useChatStore();
  const care = getCare();
  const dash = getDashboard();
  const own = care.success && dash.success ? care.data.care : undefined;
  const liveAanya = own !== undefined && chat.seed === seedOf(own);
  const aanya: Thread = liveAanya
    ? {
        pid: "p_aanya",
        name: [dash.data!.profile.first_name, dash.data!.profile.last_name].filter(Boolean).join(" ") || "Aanya Kapoor",
        msgs: [...samples(own, dash.data!.profile.first_name ?? "", chat.anchor), ...chat.sent].map(fromApp),
        live: true,
      }
    : {
        pid: "p_aanya",
        name: "Aanya Kapoor",
        msgs: [
          { id: "aa1", from: "patient", at: clinicAgo(store.anchor, D + 4 * H), text: "Should I take the injection in the morning or at night?" },
          { id: "aa2", from: "doctor", at: clinicAgo(store.anchor, D + 2 * H), text: "Whichever you will remember. Pick one day of the week and keep to it. The guide in Resources walks you through the first one." },
        ],
        live: false,
      };
  const rest = sampleThreads(store.anchor).map((t) => ({ ...t, msgs: [...t.msgs, ...(store.replies[t.pid] ?? [])], live: false }));
  const all = [aanya, ...rest].map((t) => (t.live ? t : { ...t, msgs: t.msgs.map((m) => ({ ...m, urgent: m.urgent ?? (m.from === "patient" && URGENT.test(m.text)) })) }));
  return all.sort((a, b) => (b.msgs.at(-1)?.at ?? 0) - (a.msgs.at(-1)?.at ?? 0));
}

export function useInbox() {
  return useStore();
}

/**
 * What is open for the doctor: the patient's messages since the doctor last wrote (or set the
 * thread aside) that were addressed to the doctor or read as urgent. The care team's own
 * answers do not close them; only the doctor does.
 */
export function openForYou(t: Thread, s: Store): CMsg[] {
  const since = Math.max(s.done[t.pid] ?? 0, t.msgs.filter((m) => m.from === "doctor").at(-1)?.at ?? 0);
  return t.msgs.filter((m) => m.from === "patient" && m.at > since && (m.to === "doctor" || m.urgent));
}
/** Each thread's open messages, in the shape the doctor's queue takes. */
export function openMessages(threads: Thread[], s: Store): OpenMessages[] {
  return threads.flatMap((t) => {
    const mine = openForYou(t, s);
    return mine.length ? [{ pid: t.pid, first: { at: mine[0].at, text: mine[0].text }, count: mine.length, urgent: mine.some((x) => x.urgent) }] : [];
  });
}
export function useOpenMessages() {
  return openMessages(useThreads(), useStore());
}

/** An open flagged symptom on this patient's record, which a reply can close as "Advised by message". */
export const openSymptom = (p?: Patient) => p?.symptoms.find((x) => x.requires_review && !x.acknowledged);

/**
 * The doctor's order: a thread with an urgent message, or open messages from a patient with a
 * flagged symptom, first; then other open threads, longest waiting first; then the rest, newest first.
 */
export function byNeed(threads: Thread[], s: Store, patients: Patient[]) {
  const key = (t: Thread) => {
    const mine = openForYou(t, s);
    if (!mine.length) return { rank: 2, at: -(t.msgs.at(-1)?.at ?? 0) };
    const flagged = mine.some((x) => x.urgent) || !!openSymptom(patients.find((p) => p.id === t.pid));
    return { rank: flagged ? 0 : 1, at: mine[0].at };
  };
  return [...threads].map((t) => ({ t, k: key(t) })).sort((a, b) => a.k.rank - b.k.rank || a.k.at - b.k.at).map((x) => x.t);
}

export function unread(t: Thread, s: Store) {
  const last = [...t.msgs].reverse().find((m) => m.from === "patient");
  return !!last && (s.seen[t.pid] ?? 0) < last.at;
}

export function markSeenThread(pid: string, at: number) {
  if ((read().seen[pid] ?? 0) >= at) return;
  write((s) => ({ ...s, seen: { ...s.seen, [pid]: at } }));
}
export function markDone(pid: string, at: number) {
  write((s) => ({ ...s, done: { ...s.done, [pid]: at } }));
}
export function undoDone(pid: string) {
  write((s) => {
    const done = { ...s.done };
    delete done[pid];
    return { ...s, done };
  });
}

/** The doctor's reply. Aanya's goes into her app; the rest stay in this browser. */
export function reply(t: Thread, text: string) {
  const body = text.trim();
  if (!body) return;
  if (t.live && readThread().seed) {
    postAs("doctor", body);
    return;
  }
  const now = Date.now();
  write((s) => ({ ...s, replies: { ...s.replies, [t.pid]: [...(s.replies[t.pid] ?? []), { id: `dr${now}`, from: "doctor", at: now, text: body }] } }));
}

export function resetMessages() {
  write(() => ({ ...EMPTY, anchor: Date.now() }));
}

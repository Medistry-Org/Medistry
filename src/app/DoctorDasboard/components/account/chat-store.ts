"use client";

import { useSyncExternalStore } from "react";
import type { CareRecord } from "./care";
import { backAt, clinicTime, CLOSE_HOUR, inClinicHours } from "./clinic-time";

/*
  The in-app chat with the care team. In the product this is GET/POST /api/v1/messages, and the
  same thread receives anything the patient sends on WhatsApp. Here the thread lives in
  localStorage: a few sample messages for the point in care, plus whatever this person sends.
  In the care team's hours a person "replies" a few seconds later so the prototype shows the full
  loop. Outside them nobody reads it until morning, and the thread says so (CONFIRM hours with the client).
*/

export type Who = "me" | "team" | "coach" | "doctor";
export type Msg = {
  id: string;
  from: Who;
  text?: string;
  image?: string;
  at: number;
  urgent?: boolean;
  /** whom the patient addressed, from the button that opened Chat; the doctor's inbox shows it */
  to?: "doctor" | "coach";
  /** where it was written: the app, or WhatsApp (same thread, same record) */
  via?: "app" | "whatsapp";
  /** sent while the care team was away: when they are back ("tomorrow at 9 am") */
  closed?: string;
};

type Store = {
  /** which sample thread this is: the point in care it was written for */
  seed: string;
  /** when the thread was opened first; the sample messages sit before it */
  anchor: number;
  sent: Msg[];
  /** the patient has seen every team message up to here */
  seenAt: number;
  /** the care team has read the patient's messages up to here */
  readAt: number;
};

/** The care team member who answers first. Sample name (CONFIRM). */
export const TEAM = { name: "Neha Joshi", role: "Care team" };
/** CONFIRM: the care team's hours and WhatsApp number. null keeps the prototype from opening a real chat. */
export const HOURS = "9\u00a0am to 8\u00a0pm";
export const DAYS = "Monday to Saturday";
export const WHATSAPP_NUMBER: string | null = null;

const KEY = "medistry-chat-demo";
const EMPTY: Store = { seed: "", anchor: 0, sent: [], seenAt: 0, readAt: 0 };

let cache: Store | null = null;
let typing = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): Store {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(fn: (s: Store) => Store) {
  cache = fn(read());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // private browsing, or a photo too large to keep: the thread holds for this visit
  }
  emit();
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

export const seedOf = (care: CareRecord | null) => (care ? `${care.stage}:${care.started_at}` : "pre");

export function useChatStore() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
export function useTyping() {
  return useSyncExternalStore(
    subscribe,
    () => typing,
    () => false,
  );
}

/** A new point in care starts a new sample thread. */
export function startThread(seed: string) {
  write(() => ({ ...EMPTY, seed, anchor: Date.now() }));
}

export function markSeen(at: number) {
  if (read().seenAt >= at) return;
  write((s) => ({ ...s, seenAt: at }));
}

/** The sample thread for each point in care: short, real-sounding, and never a claim about results. */
export function samples(care: CareRecord | null, first: string, anchor: number): Msg[] {
  // each message sits on a working day that has already closed, at a time the care team was in, so a
  // thread opened at midnight on a Sunday never shows a reply at 11:48 pm
  const m = (id: string, from: Who, daysAgo: number, hh: number, mm: number, text: string): Msg => {
    const d = new Date(clinicTime(anchor, daysAgo, CLOSE_HOUR - 1, 59));
    d.setHours(hh, mm, 0, 0);
    return { id, from, at: d.getTime(), text };
  };
  const hi = first ? `Hi ${first}` : "Hi";
  // the welcome arrives a minute after sign-up when someone is in; otherwise it waits from the last working day
  if (!care)
    return [
      {
        ...m("s0", "team", 0, 18, 40, ""),
        ...(inClinicHours(anchor) ? { at: anchor - 60e3 } : {}),
        text: `${hi}, I'm Neha from the Medistry care team. Ask me anything about your first consultation, booking or blood tests. If you have blood test reports from the last 90 days, send a photo here and they go into your record.`,
      },
    ];
  const dr = `Dr. ${care.doctor.name.split(" ").at(-1)}`;
  if (care.stage === 1)
    return [
      m("s1", "team", 2, 11, 15, `${hi}, I'm Neha from your care team. I'm here for anything about bookings, payments or the app.`),
      m("s2", "me", 1, 10, 5, "Is the plan paid all at once?"),
      m("s3", "team", 1, 10, 32, "Yes, it is paid upfront for its full length, and you see the itemised price before you pay. Medicine, only if your doctor prescribes it, is billed separately."),
      m("s4", "doctor", 0, 17, 50, `Hello ${first || "there"}, ${dr} here. Your plan is under Care. Have a read, and ask me anything before you start.`),
    ];
  if (care.stage === 2)
    return [
      m("s1", "coach", 2, 12, 10, `${hi}, ${care.coach.name.split(" ")[0]} here, your dietitian. Your meal plan is under Care. Aim for protein at breakfast; besan chilla or eggs both work.`),
      m("s2", "me", 1, 9, 45, "Should I take the injection in the morning or at night?"),
      m("s3", "doctor", 1, 13, 20, "Whichever you will remember. Pick one day of the week and keep to it. The guide in Resources walks you through the first one."),
      m("s4", "team", 0, 16, 30, "Your first injection is coming up. If you would like someone with you on a video call while you do it, reply here and we will set it up."),
    ];
  return [
    m("s1", "me", 2, 9, 30, "Feeling a bit queasy since the dose went up."),
    m("s2", "doctor", 2, 11, 40, "That is common in the first days after an increase. Eat smaller meals, slowly, and stop when you feel full. If you cannot keep fluids down or have strong stomach pain, tell us here straight away."),
    m("s3", "me", 1, 10, 15, "Better today, thanks."),
    m("s4", "team", 1, 12, 5, "Glad to hear it. Your refill is on its way, and the courier messages you before delivery."),
  ];
}

/** Words that should never wait for office hours. The answer is always 112, said plainly. */
export const URGENT =
  /chest ?pains?|pain in (my )?chest|heart attack|stroke|seizure|\bfits?\b|can'?t breathe|cannot breathe|breathless|saans|seene|chhati|faint|passed out|unconscious|suicid|kill myself|vomiting blood|blood in (my )?vomit|severe (stomach|abdominal|belly|tummy) pain/i;

// one answer for a burst of messages, as a person would reply
let pending: ReturnType<typeof setTimeout>[] = [];
let burst = { urgent: false, image: false };

/**
 * Send a message. In the care team's hours the prototype's care team reads it, types, and answers.
 * Outside them nobody has read it, so it stays "Sent" and the thread says when they are back.
 */
export function send(msg: { text?: string; image?: string; to?: "doctor" | "coach" }, first: string) {
  const now = Date.now();
  const urgent = !!msg.text && URGENT.test(msg.text);
  const closed = backAt(now) ?? undefined;
  write((s) => ({ ...s, sent: [...s.sent, { id: `m${now}`, from: "me", at: now, ...msg, urgent, ...(closed ? { closed } : {}) }] }));
  pending.forEach(clearTimeout);
  if (closed) {
    pending = [];
    burst = { urgent: false, image: false };
    return;
  }
  burst = { urgent: burst.urgent || urgent, image: burst.image || !!msg.image };
  pending = [
    setTimeout(() => write((s) => ({ ...s, readAt: Date.now() })), 1400),
    setTimeout(() => {
      typing = true;
      emit();
    }, 2600),
    setTimeout(() => reply(first), 5600),
  ];
}

function reply(first: string) {
  const { urgent, image } = burst;
  burst = { urgent: false, image: false };
  pending = [];
  typing = false;
  const name = first ? `, ${first}` : "";
  const text = urgent
    ? `I've seen this${name}. If you are unwell right now, call 112. I'm passing your message to your doctor straight away.`
    : image
      ? `Thanks${name}, I have the photo. It is in your record now, and your doctor will see it before your next review.`
      : `Thanks${name}. I've read this and will come back to you shortly.`;
  write((s) => ({ ...s, sent: [...s.sent, { id: `r${Date.now()}`, from: "team", at: Date.now(), text }] }));
}

/**
 * A reply written in the clinician portal (prototype: the same browser). It lands in the
 * patient's thread, and the prototype's automatic care-team answer stands down.
 */
export function postAs(from: Exclude<Who, "me">, text: string) {
  pending.forEach(clearTimeout);
  pending = [];
  burst = { urgent: false, image: false };
  typing = false;
  const now = Date.now();
  write((s) => ({ ...s, readAt: now, sent: [...s.sent, { id: `d${now}`, from, at: now, text }] }));
}

/** The thread as stored, for the clinician portal (outside React). */
export const readThread = () => read();

/** Team messages the patient has not seen yet, for the dot on Chat. */
export function unseen(store: Store, care: CareRecord | null) {
  if (store.seed !== seedOf(care)) return 1; // a new thread always opens on a fresh message
  return [...samples(care, "", store.anchor), ...store.sent].filter((m) => m.from !== "me" && m.at > store.seenAt).length;
}

/** Shrinks a photo before it is kept, so a phone photo does not fill the device's storage. */
export function shrink(file: File, max = 960): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/*
  Progress photos: entirely optional, private unless the patient shares them with their doctor.

  A set is the photos taken on one day: a front view, and a side view if the patient takes one.
  In the product they upload to POST /api/v1/photos and the share setting is PATCH
  /api/v1/me/photo-sharing; the record is read by the treating doctor only while sharing is on.
  Here the list and the settings live in localStorage beside the account, and the pictures in
  IndexedDB on this device (they are too big for localStorage). The doctor portal on the same
  device reads both, so the two sides never disagree.
*/

export type Pose = "front" | "side";
export type PhotoSet = {
  id: string;
  taken_at: string;
  /** a picture in IndexedDB ("idb:<key>"), or a drawn sample ("sample:<n>") in the prototype */
  front: string;
  side: string | null;
};
export type PhotoState = {
  /** the patient has opened the feature and chosen how it works */
  started: boolean;
  /** the treating doctor can see every set while this is on */
  shared: boolean;
  /** pictures stay hidden on screen until tapped, for opening the app in public */
  hide: boolean;
  sets: PhotoSet[];
};

/** Every four weeks: often enough to see change, rarely enough that each set differs. */
export const EVERY_DAYS = 28;

const KEY = "medistry-photos";
const DB = "medistry-photos";
const STORE = "images";
const DAY = 864e5;
const EMPTY: PhotoState = { started: false, shared: false, hide: true, sets: [] };

type All = Record<string, PhotoState>;
let cache: All | null = null;
let version = 0;
const listeners = new Set<() => void>();

function uid(): string | null {
  try {
    const app = JSON.parse(localStorage.getItem("medistry-account-demo") ?? "null");
    return app?.session?.user_id ?? null;
  } catch {
    return null;
  }
}
function all(): All {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as All;
  } catch {
    cache = {};
  }
  return cache!;
}
function save(next: All) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private browsing: the change holds for this visit
  }
  version++;
  listeners.forEach((l) => l());
}
/** The signed-in patient's photos, oldest set first. */
export function readPhotos(owner = uid()): PhotoState {
  if (!owner) return EMPTY;
  const s = all()[owner];
  return s ? { ...EMPTY, ...s, sets: [...s.sets].sort((a, b) => a.taken_at.localeCompare(b.taken_at)) } : EMPTY;
}
function update(fn: (s: PhotoState) => PhotoState, owner = uid()) {
  if (!owner) return;
  save({ ...all(), [owner]: fn(readPhotos(owner)) });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY && e.key !== "medistry-account-demo") return;
    cache = null;
    version++;
    fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
let snap: { v: number; s: PhotoState } | null = null;
function snapshot(): PhotoState {
  if (!snap || snap.v !== version) snap = { v: version, s: readPhotos() };
  return snap.s;
}
/** The patient's photos and settings; nothing on the server, before the browser has read them. */
export function usePhotos(): PhotoState | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/* ---------- the pictures: IndexedDB, one blob per photo ---------- */

function idb(): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}
// the bytes and their type, not the Blob itself: Safari will not keep a Blob in IndexedDB in every mode
type Stored = { buf: ArrayBuffer; type: string };
async function put(key: string, blob: Blob) {
  const rec: Stored = { buf: await blob.arrayBuffer(), type: blob.type };
  const db = await idb();
  await new Promise<void>((ok, no) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(rec, key);
    t.oncomplete = () => ok();
    t.onerror = () => no(t.error);
  });
}
async function get(key: string): Promise<Blob | null> {
  const db = await idb();
  return new Promise((ok) => {
    const r = db.transaction(STORE).objectStore(STORE).get(key);
    r.onsuccess = () => {
      const v = r.result as Stored | undefined;
      ok(v ? new Blob([v.buf], { type: v.type }) : null);
    };
    r.onerror = () => ok(null);
  });
}
async function drop(keys: string[]) {
  if (!keys.length) return;
  try {
    const db = await idb();
    const t = db.transaction(STORE, "readwrite");
    keys.forEach((k) => t.objectStore(STORE).delete(k));
  } catch {}
}

/** A stored picture as an object URL, released when the component lets it go. */
export function usePhotoUrl(ref: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!ref?.startsWith("idb:")) return;
    let u: string | null = null;
    let live = true;
    get(ref.slice(4)).then((b) => {
      if (!live || !b) return;
      u = URL.createObjectURL(b);
      setUrl(u);
    });
    return () => {
      live = false;
      if (u) URL.revokeObjectURL(u);
      setUrl(null);
    };
  }, [ref]);
  return url;
}

/**
 * The picture as taken, made ready to keep: turned upright, at most 1200px on its long side, and
 * saved again as a JPEG, which leaves behind the location, the phone model and the rest of the
 * file's hidden details.
 */
export async function prepare(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("encode"))), "image/jpeg", 0.85));
}

/* ---------- changes ---------- */

const id = () => `ph_${Math.random().toString(36).slice(2, 10)}`;

export function startPhotos(shared: boolean) {
  update((s) => ({ ...s, started: true, shared }));
}
export function setShared(shared: boolean) {
  update((s) => ({ ...s, shared }));
}
export function setHide(hide: boolean) {
  update((s) => ({ ...s, hide }));
}

/** Saves a new set from today. Returns its id, so the toast can undo it. */
export async function addSet(front: Blob, side: Blob | null): Promise<string> {
  const sid = id();
  await put(`${sid}-front`, front);
  if (side) await put(`${sid}-side`, side);
  update((s) => ({
    ...s,
    started: true,
    sets: [...s.sets, { id: sid, taken_at: new Date().toISOString(), front: `idb:${sid}-front`, side: side ? `idb:${sid}-side` : null }],
  }));
  return sid;
}

export function deleteSet(sid: string) {
  const set = readPhotos().sets.find((x) => x.id === sid);
  update((s) => ({ ...s, sets: s.sets.filter((x) => x.id !== sid) }));
  if (set) void drop([set.front, set.side].filter((r): r is string => !!r?.startsWith("idb:")).map((r) => r.slice(4)));
}

/** Deletes every photo and returns the feature to how it was before it was opened. */
export function deleteAllPhotos(owner = uid()) {
  const s = readPhotos(owner);
  void drop(s.sets.flatMap((x) => [x.front, x.side]).filter((r): r is string => !!r?.startsWith("idb:")).map((r) => r.slice(4)));
  update(() => EMPTY, owner);
}

/* ---------- when the next set is due ---------- */

/** Days until the next set (zero or less: due now), or null before the first one. */
export function dueIn(s: PhotoState, now: number): number | null {
  const last = s.sets.at(-1);
  if (!last) return null;
  const start = new Date(last.taken_at);
  const due = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() + EVERY_DAYS * DAY;
  const today = new Date(now);
  return Math.round((due - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / DAY);
}

/** The reading closest to a photo, within three days of it, so a set carries that week's weight. */
export function weightNear<T extends { logged_at: string; weight_kg: number }>(w: T[], iso: string): number | null {
  const t = new Date(iso).getTime();
  let best: T | null = null;
  for (const r of w) {
    const d = Math.abs(new Date(r.logged_at).getTime() - t);
    if (d <= 3 * DAY && (!best || d < Math.abs(new Date(best.logged_at).getTime() - t))) best = r;
  }
  return best ? best.weight_kg : null;
}

/**
 * Prototype only: the sample patient at week 3 took a starting set before her first injection;
 * at week 8 a second, four weeks later. Both shared with her doctor, so the portal shows them.
 * The pictures are drawn figures, labelled as samples.
 */
export function seedPhotos(stage: 0 | 1 | 2 | 3) {
  const owner = uid();
  if (!owner) return;
  deleteAllPhotos(owner);
  if (stage < 2) return;
  const at = (daysAgo: number) => {
    const d = new Date(Date.now() - daysAgo * DAY);
    d.setHours(7, 40, 0, 0);
    return d.toISOString();
  };
  const sets: PhotoSet[] =
    stage === 2
      ? [{ id: "ph_s1", taken_at: at(19), front: "sample:0", side: "sample:0" }]
      : [
          { id: "ph_s1", taken_at: at(54), front: "sample:0", side: "sample:0" },
          { id: "ph_s2", taken_at: at(26), front: "sample:1", side: "sample:1" },
        ];
  update(() => ({ started: true, shared: true, hide: true, sets }), owner);
}

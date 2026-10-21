"use client";

import { useSyncExternalStore } from "react";

/*
  Settings that belong to this device and this person: which updates have been read, and which
  reminders are on. Reminders go by WhatsApp. In the product they sync through PATCH /api/v1/me/preferences;
  here they live in localStorage beside the account.
*/

export type Reminder = "visits" | "medicine" | "injection" | "labs" | "weighin";

export type Prefs = {
  read: string[];
  reminders: Record<Reminder, boolean>;
};

const KEY = "medistry-app-prefs";

const DEFAULTS: Prefs = {
  read: [],
  reminders: { visits: true, medicine: true, injection: true, labs: true, weighin: true },
};

let cache: Prefs | null = null;
const listeners = new Set<() => void>();

function read(): Prefs {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    // only the settings that still exist: older saves also carried the Home list and an SMS channel
    const saved: Partial<Prefs> = raw ? JSON.parse(raw) : {};
    cache = raw ? { read: saved.read ?? DEFAULTS.read, reminders: { ...DEFAULTS.reminders, ...saved.reminders } } : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache!;
}

export function setPrefs(fn: (p: Prefs) => Prefs) {
  cache = fn(read());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // private browsing: the change holds for this visit
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

/** The current settings; the defaults on the server and before the browser has read them. */
export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS);
}

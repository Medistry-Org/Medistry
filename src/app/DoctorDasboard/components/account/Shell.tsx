"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BookOpenText, FirstAidKit, House, UserCircle, X } from "@phosphor-icons/react";
import { Wordmark } from "../ui";
import { getCare, getDashboard, resetCareDemo, startCareDemo, useAccountVersion, type Dashboard as Dash } from "./api";
import type { CareRecord } from "./care";
import { updatesOf } from "./Inbox";
import { usePrefs } from "./prefs";
import a from "./Account.module.css";
import d from "./Dashboard.module.css";
import s from "./Shell.module.css";

/** The four sections. Every other page (progress, appointments, notifications, a guide) sits under one. */
export type Tab = "home" | "care" | "resources" | "profile";
export type AppData = { dash: Dash; care: CareRecord | null; weights: Dash["weights"] };

const TABS: { id: Tab; href: string; label: string; icon: typeof House }[] = [
  { id: "home", href: "/dashboard", label: "Home", icon: House },
  { id: "care", href: "/dashboard/care", label: "Care", icon: FirstAidKit },
  { id: "resources", href: "/dashboard/resources", label: "Resources", icon: BookOpenText },
  { id: "profile", href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

const ToastCtx = createContext<(m: string, undo?: () => void) => void>(() => {});
/** A short confirmation at the foot of the screen, for anything the patient just saved; optionally with Undo. */
export const useToast = () => useContext(ToastCtx);

/** Whether the phone is online; true on the server. */
function useOnline() {
  return useSyncExternalStore(
    (f) => {
      window.addEventListener("online", f);
      window.addEventListener("offline", f);
      return () => {
        window.removeEventListener("online", f);
        window.removeEventListener("offline", f);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/**
 * The signed-in app around every patient screen: a thin bar (wordmark, notifications), the four
 * sections (a dock on a phone, centred pills on a laptop) and the toast. Everything is mocked in
 * the browser (api.ts). Every page title lives in the page itself.
 *
 * `tab` lights the section a page belongs to. `focus` swaps the bar for a close button and a title,
 * for tasks that should own the screen (the injection walk-through). `bare` drops the bar
 * altogether, for a screen that brings its own (the chat).
 */
export default function Shell({ tab, dock = true, bare = false, focus, children }: { tab: Tab | null; dock?: boolean; bare?: boolean; focus?: string; children: (data: AppData) => ReactNode }) {
  const router = useRouter();
  const v = useAccountVersion();
  const data = useMemo((): AppData | null | "out" => {
    if (v === -1) return null;
    const dash = getDashboard();
    const care = getCare();
    if (!dash.success || !care.success) return "out";
    return { dash: dash.data, care: care.data.care, weights: care.data.weights };
  }, [v]);

  const [note, setNote] = useState<{ m: string; undo?: () => void; n: number } | null>(null);
  const toast = note?.m ?? null;
  const setToast = useMemo(() => (m: string | null, undo?: () => void) => setNote(m ? { m, undo, n: Math.random() } : null), []);
  const prefs = usePrefs();
  const online = useOnline();
  const [opened] = useState(() => Date.now());
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // the chat's Back returns to the page it came from only when that page was inside the app
  useEffect(() => {
    if (bare) return;
    try {
      sessionStorage.setItem("medistry-in-app", "1");
    } catch {
      // storage blocked: Back goes Home
    }
  }, [bare]);

  useEffect(() => {
    if (data === "out") router.replace("/sign-in");
  }, [data, router]);

  // prototype: ?stage=0..3 jumps this account to a point in care, so a link can open any state
  useEffect(() => {
    if (!data || data === "out") return;
    const url = new URL(window.location.href);
    const st = url.searchParams.get("stage");
    if (st === null) return;
    url.searchParams.delete("stage");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    if (st === "0") resetCareDemo();
    else if (["1", "2", "3"].includes(st)) startCareDemo(Number(st) as 1 | 2 | 3);
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    // long enough to read: a longer line stays longer
    const t = setTimeout(() => setToast(null), Math.max(note?.undo ? 4500 : 2600, (note?.m.length ?? 0) * 55));
    return () => clearTimeout(t);
  }, [note, toast, setToast]);

  if (!data || data === "out") {
    return (
      <main className={d.page} aria-busy="true">
        <div className={d.skeleton}>
          <span className={d.ghost} style={{ width: "48%", height: 44 }} />
          <span className={d.ghost} style={{ height: 120 }} />
          <span className={d.ghost} style={{ height: 180 }} />
        </div>
      </main>
    );
  }

  const tabs = data.dash.user.onboarding_completed;
  const showDock = tabs && dock;
  const updates = data.care ? updatesOf(data.care, opened) : [];
  const unread = updates.filter((u) => !prefs.read.includes(u.id)).length;

  return (
    <ToastCtx.Provider value={setToast}>
      <div className={`${d.app} ${showDock ? s.withTabs : ""}`}>
        {bare ? null : focus ? (
          <header className={`${d.bar} ${d.focusBar}`}>
            <div className={d.barInner}>
              <Link href="/dashboard" className={a.round} aria-label="Close">
                <X size={18} />
              </Link>
              <p className={d.focusTitle}>{focus}</p>
              <span aria-hidden="true" className={d.focusSpacer} />
            </div>
          </header>
        ) : (
          <header className={d.bar} data-scrolled={scrolled}>
            <div className={`${d.barInner} ${tabs ? s.barTabs : ""}`}>
              <Link href="/dashboard" className={d.brand} aria-label="Medistry, home">
                <Wordmark height={24} />
              </Link>
              {tabs && (
                <nav className={s.tabs} aria-label="Sections">
                  {TABS.map((t) => (
                    <Link key={t.id} href={t.href} className={s.tab} aria-current={t.id === tab ? "page" : undefined}>
                      {t.label}
                    </Link>
                  ))}
                </nav>
              )}
              <div className={d.barEnd}>
                <Link href="/dashboard/notifications" className={d.bell} aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}>
                  <Bell size={20} />
                  {unread > 0 && (
                    <span className={`${d.badge} num`} aria-hidden="true">
                      {unread}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </header>
        )}

        {!online && (
          <p className={d.offline} role="status">
            You are offline. Anything you log stays on this phone and is sent when you are back online.
          </p>
        )}

        {children(data)}

        {showDock && (
          <nav className={s.dock} aria-label="Sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = t.id === tab;
              return (
                <Link key={t.id} href={t.href} className={s.dockTab} aria-current={on ? "page" : undefined}>
                  <Icon size={22} weight={on ? "fill" : "regular"} />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className={`${d.toast} ${showDock ? s.toastUp : ""} ${bare ? s.toastChat : ""}`} data-show={!!toast} data-undo={!!note?.undo} role="status" aria-live="polite">
          <span>{toast}</span>
          {note?.undo && (
            <button
              type="button"
              className={d.toastUndo}
              onClick={() => {
                note.undo?.();
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </ToastCtx.Provider>
  );
}

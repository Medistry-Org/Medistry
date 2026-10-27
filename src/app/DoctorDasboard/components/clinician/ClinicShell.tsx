"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  CalendarBlank,
  ChatsCircle,
  Notepad,
  SquaresFour,
  Users,
} from "@phosphor-icons/react";
import { Wordmark } from "../ui";
import { Avatar } from "../account/bits";
import { DOCTOR } from "../account/care";
import {
  ME,
  queue,
  refreshClinic,
  resetClinic,
  useClinic,
  type Patient,
} from "./data";
import { openMessages, resetMessages, useInbox, useThreads } from "./inbox";
import { resetNotes, toSign, useNotes, writing } from "./notes-store";
import c from "./Clinic.module.css";

export type Section = "today" | "schedule" | "patients" | "notes" | "messages";

const NAV: { id: Section; href: string; label: string; icon: typeof Users }[] =
  [
    {
      id: "today",
      href: "/DoctorDasboard/clinician",
      label: "Today",
      icon: SquaresFour,
    },
    {
      id: "schedule",
      href: "/DoctorDasboard/clinician/schedule",
      label: "Schedule",
      icon: CalendarBlank,
    },
    {
      id: "patients",
      href: "/DoctorDasboard/clinician/patients",
      label: "Patients",
      icon: Users,
    },
    {
      id: "notes",
      href: "/DoctorDasboard/clinician/notes",
      label: "Notes",
      icon: Notepad,
    },
    {
      id: "messages",
      href: "/DoctorDasboard/clinician/messages",
      label: "Messages",
      icon: ChatsCircle,
    },

    {
      id: "consultation",
      href: "/DoctorDasboard/clinician/consultation",
      label: "Consultation",
      icon: ChatsCircle,
    },
  ];

const Toast = createContext<(m: string, undo?: () => void) => void>(() => {});
export const useClinicToast = () => useContext(Toast);

/**
 * The doctor's workspace: a quiet rail of five places, the work in the middle. The two places
 * (Today, Schedule, Patients) lead; the two queues with counts (Notes, Messages) close the list.
 * `bare`: a pushed screen that brings its own bars below a laptop, so the phone chrome steps aside.
 */
export default function ClinicShell({
  section,
  bare = false,
  children,
}: {
  section: Section;
  bare?: boolean;
  children: (patients: Patient[]) => ReactNode;
}) {
  const patients = useClinic();
  const notes = useNotes();
  const [now, setNow] = useState(() => Date.now());
  const [note, setNote] = useState<{ m: string; undo?: () => void } | null>(
    null,
  );
  const toast = note?.m ?? null;
  const setToast = (m: string | null, undo?: () => void) =>
    setNote(m ? { m, undo } : null);
  // pick up anything the patient app changed in this tab
  useEffect(() => refreshClinic(), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setNote(null), note?.undo ? 5000 : 2600);
    return () => clearTimeout(t);
  }, [toast, note]);
  // a toast as each draft the scribe is still writing becomes ready; the timers live in callbacks
  const due = useMemo(
    () =>
      (notes ?? [])
        .filter((n) => writing(n, now))
        .map((n) => `${n.id}|${Date.parse(n.ready_at)}|${n.name.split(" ")[0]}`)
        .join(";"),
    [notes, now],
  );
  useEffect(() => {
    if (!due) return;
    const timers = due.split(";").map((x) => {
      const [, ms, first] = x.split("|");
      return setTimeout(
        () => {
          setNow(Date.now());
          setNote({ m: `${first}'s note is ready to review` });
        },
        Math.max(0, Number(ms) - Date.now()) + 50,
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [due]);
  const threads = useThreads();
  const inbox = useInbox();
  const open = openMessages(threads, inbox);
  // the same counts as each page shows: Today's queue (messages included), notes written and unsigned, threads for you
  const pending = patients ? queue(patients, notes ?? [], now, open).length : 0;
  const unsigned = notes ? toSign(notes, now).length : 0;
  const forYou = open.length;
  const count = (id: Section) =>
    id === "today"
      ? pending
      : id === "notes"
        ? unsigned
        : id === "messages"
          ? forYou
          : 0;

  return (
    <Toast.Provider value={setToast}>
      <div className={c.app} data-bare={bare || undefined}>
        <aside className={c.rail}>
          <Link
            href="/DoctorDasboard/clinician"
            className={c.brand}
            aria-label="Medistry clinician portal"
          >
            <Wordmark height={24} />
            <span className={c.portal}>Clinician</span>
          </Link>
          <nav className={c.nav} aria-label="Clinician">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  className={c.navItem}
                  aria-current={n.id === section ? "page" : undefined}
                >
                  <Icon
                    size={19}
                    weight={n.id === section ? "fill" : "regular"}
                  />
                  {n.label}
                  {count(n.id) > 0 && (
                    <span className={c.badge}>{count(n.id)}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className={c.me}>
            <Avatar name={ME.name} src={DOCTOR.photo_url} size={36} />
            <div>
              <strong>{ME.name}</strong>
              <span>{ME.qualification}</span>
            </div>
          </div>
          <button
            type="button"
            className={c.reset}
            onClick={() => {
              resetClinic();
              resetMessages();
              resetNotes();
              setNow(Date.now());
            }}
          >
            Reset sample data
          </button>
        </aside>

        <header className={c.top}>
          <Link
            href="/DoctorDasboard/clinician"
            className={c.brand}
            aria-label="Medistry clinician portal"
          >
            <Wordmark height={22} />
            <span className={c.portal}>Clinician</span>
          </Link>
          <Avatar name={ME.name} src={DOCTOR.photo_url} size={36} />
        </header>

        <div className={c.main}>
          {patients ? (
            children(patients)
          ) : (
            <div className={c.skeleton} aria-busy="true">
              <span style={{ width: "40%", height: 40 }} />
              <span style={{ height: 220 }} />
              <span style={{ height: 320 }} />
            </div>
          )}
          <p className={c.foot}>
            Clinician prototype with made-up patients. Changes stay in this
            browser.
          </p>
        </div>

        <nav className={c.dock} aria-label="Clinician">
          {NAV.map((n) => {
            const Icon = n.icon;
            const on = n.id === section;
            return (
              <Link
                key={n.id}
                href={n.href}
                className={c.dockTab}
                aria-current={on ? "page" : undefined}
              >
                <span className={c.dockIcon}>
                  <Icon size={22} weight={on ? "fill" : "regular"} />
                  {count(n.id) > 0 && (
                    <i className={c.dockBadge}>{count(n.id)}</i>
                  )}
                </span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className={c.toast}
          data-show={!!toast}
          data-undo={!!note?.undo}
          role="status"
          aria-live="polite"
        >
          <span>{toast}</span>
          {note?.undo && (
            <button
              type="button"
              className={c.toastUndo}
              onClick={() => {
                note.undo?.();
                setNote(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </Toast.Provider>
  );
}

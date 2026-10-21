"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Image as ImageIcon,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Avatar, Segmented, short } from "../account/bits";
import { DOCTOR } from "../account/care";
import {
  acknowledgeSymptom,
  careWeek,
  unacknowledgeSymptom,
  type Patient,
} from "./data";
import {
  byNeed,
  markDone,
  markSeenThread,
  openForYou,
  openSymptom,
  QUICK,
  reply,
  SIDE,
  undoDone,
  unread,
  useInbox,
  useThreads,
  type CMsg,
  type Thread,
} from "./inbox";
import { useClinicToast } from "./ClinicShell";
import c from "./Clinic.module.css";
import m from "./Messages.module.css";

const clock = (t: number) =>
  new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" })
    .format(t)
    .toLowerCase();
const sameDay = (x: number, y: number) =>
  new Date(x).toDateString() === new Date(y).toDateString();
function when(t: number, now: number) {
  if (sameDay(t, now)) return clock(t);
  if (sameDay(t, now - 864e5)) return "Yesterday";
  return short(new Date(t).toISOString());
}
function ago(t: number, now: number) {
  const mins = Math.max(1, Math.round((now - t) / 6e4));
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} h` : `${Math.round(h / 24)} d`;
}
const dayLabel = (t: number, now: number) =>
  sameDay(t, now)
    ? "Today"
    : sameDay(t, now - 864e5)
      ? "Yesterday"
      : new Intl.DateTimeFormat("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(t);

const snippet = (x: CMsg) =>
  (x.from === "doctor"
    ? "You: "
    : x.from === "patient"
      ? ""
      : `${SIDE[x.from].name.split(" ")[0]}: `) +
  (x.text || (x.image ? "Photo" : ""));

/**
 * The doctor's messages: one thread per patient, in the app or from WhatsApp. "Needs you" holds
 * only what was addressed to the doctor or reads as urgent; the care team answers everything else
 * and the doctor can read it all. Urgent threads, and patients with a flagged symptom, come first;
 * then whoever has waited longest. A laptop shows the list and the open thread side by side; a
 * phone shows one at a time.
 */
export default function Messages({ patients }: { patients: Patient[] }) {
  const inbox = useInbox();
  const threads = byNeed(useThreads(), inbox, patients);
  const toast = useClinicToast();
  const [now] = useState(() => Date.now());
  const [show, setShow] = useState<"you" | "all">("you");
  const [open, setOpen] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("p"),
  );

  const needs = threads.filter((t) => openForYou(t, inbox).length > 0);
  const list = show === "you" ? needs : threads;
  // a laptop always has a thread open: the one chosen, else the first that needs the doctor
  const [wide, setWide] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  const current =
    threads.find((t) => t.pid === open) ??
    (wide ? (list[0] ?? threads[0]) : undefined);

  const choose = (pid: string | null) => {
    setOpen(pid);
    const url = new URL(window.location.href);
    if (pid) url.searchParams.set("p", pid);
    else url.searchParams.delete("p");
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  return (
    <main className={`${c.page} ${m.page}`}>
      <div
        className={m.split}
        data-open={!!current && !wide ? "thread" : "list"}
      >
        <section className={m.listPane} aria-labelledby="msg-h">
          <div className={m.listHead}>
            <h1 id="msg-h" className={c.h1}>
              Messages
            </h1>
            <p className={c.sub}>
              From the app and WhatsApp, in one place. The care team answers
              first.
            </p>
            <Segmented
              label="Show"
              value={show}
              onChange={setShow}
              options={[
                {
                  v: "you",
                  label: (
                    <>
                      Needs you<span className="num">&nbsp;{needs.length}</span>
                    </>
                  ),
                },
                { v: "all", label: "All" },
              ]}
            />
          </div>
          {list.length ? (
            <ul className={m.list}>
              {list.map((t) => {
                const lastMsg = t.msgs.at(-1)!;
                const mine = openForYou(t, inbox);
                const urgent = mine.some((x) => x.urgent);
                const isNew = unread(t, inbox);
                const p = patients.find((x) => x.id === t.pid);
                return (
                  <li key={t.pid}>
                    <button
                      type="button"
                      className={m.item}
                      aria-current={current?.pid === t.pid ? "true" : undefined}
                      data-new={isNew}
                      onClick={() => choose(t.pid)}
                    >
                      <Avatar name={t.name} size={40} />
                      <span className={m.itemText}>
                        <span className={m.itemTop}>
                          <strong>{t.name}</strong>
                          <span className={`${m.itemWhen} num`}>
                            {when(lastMsg.at, now)}
                          </span>
                        </span>
                        <span className={m.snippet}>
                          {lastMsg.via === "whatsapp" && (
                            <WhatsappLogo size={14} aria-label="On WhatsApp" />
                          )}
                          {lastMsg.image && (
                            <ImageIcon size={14} aria-hidden="true" />
                          )}
                          <span>{snippet(lastMsg)}</span>
                        </span>
                        {(mine.length > 0 || p) && (
                          <span className={m.tags}>
                            {urgent && (
                              <span className={m.tag} data-kind="urgent">
                                <WarningCircle
                                  size={13}
                                  weight="fill"
                                  aria-hidden="true"
                                />{" "}
                                Urgent
                              </span>
                            )}
                            {mine.length > 0 && !urgent && (
                              <span className={m.tag} data-kind="you">
                                For you, {ago(mine[0].at, now)}
                              </span>
                            )}
                            {p && (
                              <span className={m.tagQuiet}>
                                {careWeek(p)
                                  ? `Week ${careWeek(p)}`
                                  : p.programme}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                      {isNew && <i className={m.dot} aria-label="New" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={m.empty}>
              <Check size={22} aria-hidden="true" />
              <p>Nothing needs you. The care team is answering the rest.</p>
              <button
                type="button"
                className={m.linkBtn}
                onClick={() => setShow("all")}
              >
                See all messages
              </button>
            </div>
          )}
        </section>

        {current ? (
          <ThreadPane
            key={current.pid}
            t={current}
            p={patients.find((x) => x.id === current.pid)}
            now={now}
            onBack={() => choose(null)}
            onDone={(at) => {
              markDone(current.pid, at);
              toast(`${current.name.split(" ")[0]}'s messages set aside`, () =>
                undoDone(current.pid),
              );
            }}
          />
        ) : (
          <section className={m.threadPane} aria-hidden="true" />
        )}
      </div>
    </main>
  );
}

function ThreadPane({
  t,
  p,
  now,
  onBack,
  onDone,
}: {
  t: Thread;
  p?: Patient;
  now: number;
  onBack: () => void;
  onDone: (at: number) => void;
}) {
  const inbox = useInbox();
  const toast = useClinicToast();
  // a reply about a flagged symptom can close it too, ticked by default
  const symptom = openSymptom(p);
  const [ack, setAck] = useState(true);
  const mine = openForYou(t, inbox);
  const last = t.msgs.at(-1)?.at ?? 0;
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (last) markSeenThread(t.pid, last);
  }, [t.pid, last]);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [t.msgs.length]);

  const grow = () => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };
  const send = () => {
    if (!text.trim()) return;
    reply(t, text);
    if (p && symptom && ack) {
      acknowledgeSymptom(p.id, symptom.id, "Advised by message");
      toast(`Sent. ${symptom.label} marked as advised by message`, () =>
        unacknowledgeSymptom(p.id, symptom.id),
      );
    }
    setText("");
    requestAnimationFrame(grow);
  };

  return (
    <section className={m.threadPane} aria-label={`Messages with ${t.name}`}>
      <header className={m.threadHead}>
        <button
          type="button"
          className={m.back}
          aria-label="Back to messages"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar name={t.name} size={36} />
        <div className={m.threadWho}>
          <strong>{t.name}</strong>
          <span>
            {p
              ? [
                  `${p.age} ${p.sex === "Female" ? "F" : "M"}`,
                  careWeek(p) ? `week ${careWeek(p)}` : p.programme,
                  p.conditions.slice(0, 2).join(", "),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Patient"}
          </span>
        </div>
        {p && (
          <Link
            href={`/DoctorDasboard/clinician/patients/${p.id}?from=messages`}
            className={`btn btn--ghost ${m.record}`}
          >
            Open record
          </Link>
        )}
      </header>

      <div ref={scroller} className={m.thread} role="log" aria-live="polite">
        <div className={m.inner}>
          {t.msgs.map((x, i) => {
            const prev = t.msgs[i - 1];
            const newDay = !prev || !sameDay(prev.at, x.at);
            const ours = x.from !== "patient";
            const opens = newDay || prev.from !== x.from;
            const isOpen = mine.includes(x);
            return (
              <Fragment key={x.id}>
                {newDay && <p className={m.day}>{dayLabel(x.at, now)}</p>}
                <div
                  className={m.row}
                  data-ours={ours}
                  data-you={x.from === "doctor"}
                  data-opens={opens}
                >
                  <div className={m.stack}>
                    {opens && (
                      <p className={m.name}>
                        {x.from === "patient" ? (
                          t.name.split(" ")[0]
                        ) : x.from === "doctor" ? (
                          "You"
                        ) : (
                          <>
                            {SIDE[x.from].name} <span>{SIDE[x.from].role}</span>
                          </>
                        )}
                      </p>
                    )}
                    <div
                      className={m.bubble}
                      data-open={isOpen}
                      data-urgent={!!x.urgent}
                    >
                      {x.image && (
                        <span className={m.photoNote}>
                          <ImageIcon size={15} aria-hidden="true" /> Photo, in
                          the record
                        </span>
                      )}
                      {x.text && <p>{x.text}</p>}
                    </div>
                    <p className={m.meta}>
                      <span className="num">{clock(x.at)}</span>
                      {x.via === "whatsapp" && (
                        <span className={m.via}>
                          <WhatsappLogo size={12} aria-hidden="true" /> WhatsApp
                        </span>
                      )}
                      {x.to === "doctor" && !ours && <span>· To you</span>}
                      {x.urgent && (
                        <span className={m.urgentWord}>· Urgent words</span>
                      )}
                    </p>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      <form
        className={m.composer}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className={m.quick} role="group" aria-label="Quick replies">
          {QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setText(q.text);
                requestAnimationFrame(() => {
                  grow();
                  field.current?.focus();
                });
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className={m.box}>
          <label htmlFor="dr-reply" className="sr-only">
            Reply to {t.name}
          </label>
          <textarea
            id="dr-reply"
            ref={field}
            rows={2}
            value={text}
            placeholder={`Reply to ${t.name.split(" ")[0]}`}
            onChange={(e) => {
              setText(e.target.value);
              grow();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
          />
          {symptom && (
            <label className={m.ack}>
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              <span>
                Also mark {symptom.label.toLowerCase()} as advised by message
                <em>
                  {" "}
                  · flagged {short(symptom.at)},{" "}
                  {symptom.severity.toLowerCase()}
                </em>
              </span>
            </label>
          )}
          <div className={m.boxFoot}>
            <span className={m.as}>
              <Avatar name={DOCTOR.name} src={DOCTOR.photo_url} size={20} /> As{" "}
              {SIDE.doctor.name}.{" "}
              {t.msgs.some((x) => x.via === "whatsapp")
                ? "Arrives in the app and on WhatsApp."
                : "Arrives in the app."}
            </span>
            <span className={m.actions}>
              {mine.length > 0 && (
                <button
                  type="button"
                  className={m.linkBtn}
                  onClick={() => onDone(last)}
                >
                  No reply needed
                </button>
              )}
              <button
                type="submit"
                className={`btn ${m.send}`}
                disabled={!text.trim()}
              >
                Send <ArrowUp size={15} weight="bold" aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      </form>
    </section>
  );
}

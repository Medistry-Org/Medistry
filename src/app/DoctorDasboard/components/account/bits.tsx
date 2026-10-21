"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CaretDown } from "@phosphor-icons/react";
import x from "./App.module.css";
import u from "./Ui.module.css";

// spelled out by hand: browsers disagree on short months ("Sep" in Safari, "Sept" in Chrome)
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "13 Sep", the same in every browser, held together so it never breaks across lines */
export const short = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}\u00a0${MON[d.getMonth()]}`;
};
/** "12 September 2026", held together so a date never breaks across lines */
export const longDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)).replace(/ /g, "\u00a0");
export const weekday = (iso: string) => new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(iso));

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
/** "6 pm", "6:30 pm": the way it is said, never "06:00 PM" */
export const time = (d: Date) =>
  timeFmt
    .format(d)
    .replace(/\s?([ap])\.?m\.?/i, "\u00a0$1m")
    .replace(/:00(?=\u00a0)/, "")
    .toLowerCase();

/**
 * When something happened, one way across the app: "Just now", "12 min ago", "5 h ago" and
 * "Yesterday" inside 48 hours, then the date ("27 Sep", with the year when it is not this one).
 */
export function ago(iso: string, now: number) {
  const t = new Date(iso).getTime();
  const m = Math.round((now - t) / 6e4);
  if (m < 2) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  if (h < 48 && new Date(t).toDateString() === new Date(now - 864e5).toDateString()) return "Yesterday";
  const y = new Date(t).getFullYear();
  return y === new Date(now).getFullYear() ? short(iso) : `${short(iso)} ${y}`;
}

/** "in 12 minutes", "in 3 hours", "tomorrow", "in 7 days": hours on the day, calendar days after. */
export function until(iso: string, now: number) {
  const at = new Date(iso);
  const ms = at.getTime() - now;
  if (ms <= 0) return "now";
  const m = Math.round(ms / 6e4);
  if (m < 60) return `in ${m} minute${m === 1 ? "" : "s"}`;
  const n = new Date(now);
  const days = Math.round((new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime() - new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) / 864e5);
  if (days === 0) {
    const h = Math.round(m / 60);
    return `in ${h} hour${h === 1 ? "" : "s"}`;
  }
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/** The call opens 10 minutes before and stays open for the visit. */
export const joinOpen = (iso: string, minutes: number, now: number) => {
  const t = new Date(iso).getTime();
  return now >= t - 10 * 6e4 && now <= t + minutes * 6e4;
};

/** The current time, ticking every half minute, for countdowns and join buttons. */
export function useNow(every = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

/**
 * A surface with a heading row; the only container the app uses. The title carries its mint rule
 * in its own box, and the head sets one gap under it (--title-gap) whatever gap the card keeps
 * between its other parts (--card-gap), so every card reads the same from title to content.
 */
export function Card({ title, action, children, id, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <section className={`${x.card} ${u.card} ${className}`} id={id} aria-labelledby={id && title ? `${id}-h` : undefined}>
      {(title || action) && (
        <div className={`${x.cardHead} ${u.cardHead}`}>
          {title && (
            <h2 className={`${x.h2} ${u.cardTitle}`} id={id ? `${id}-h` : undefined}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Round portrait, or the initials on teal when there is no photo. */
export function Avatar({ name, src, size = 56 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .replace(/^Dr\.?\s+/, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return src ? (
    <Image className={x.avatar} src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className={x.avatarText} style={{ width: size, height: size, fontSize: Math.max(14, size * 0.34) }} aria-hidden="true">
      {initials}
    </span>
  );
}

/** Low, high or in range, in words and in tone, never colour alone. */
export function Flag({ flag }: { flag: "LOW" | "NORMAL" | "HIGH" }) {
  return (
    <span className={x.flag} data-flag={flag}>
      <i aria-hidden="true" />
      {flag === "NORMAL" ? "In range" : flag === "HIGH" ? "Above range" : "Below range"}
    </span>
  );
}

/** Progress against a daily target: a measured track, the target marked as a tick. */
export function Meter({ label, value, target, unit, format = (n) => String(n) }: { label: ReactNode; value: number; target: number; unit: string; format?: (n: number) => string }) {
  const f = Math.min(1, value / target);
  return (
    <div className={x.meter}>
      <div className={x.meterHead}>
        <span className={x.meterLabel}>{label}</span>
        <span className={`${x.meterNum} num`}>
          {format(value)} <span>of {format(target)} {unit}</span>
        </span>
      </div>
      <div className={x.meterTrack} role="img" aria-label={`${format(value)} of ${format(target)} ${unit}`}>
        <i style={{ transform: `scaleX(${f})` }} data-full={value >= target} />
      </div>
    </div>
  );
}

/** Seven days as bars, with the daily target drawn across them. */
export function WeekBars({ days, target, format, unit }: { days: { iso: string; v: number }[]; target: number; format: (n: number) => string; unit: string }) {
  const max = Math.max(target * 1.25, ...days.map((d) => d.v));
  return (
    <div className={x.week} role="img" aria-label={`Target ${format(target)} ${unit}. ` + days.map((d) => `${weekday(d.iso)} ${format(d.v)}`).join(", ")}>
      <div className={x.weekPlot}>
        <i className={x.weekTarget} style={{ bottom: `${(target / max) * 100}%` }} aria-hidden="true" />
        {days.map((d) => (
          <span key={d.iso} className={x.weekBar} style={{ height: `${(d.v / max) * 100}%` }} data-met={d.v >= target} />
        ))}
      </div>
      <div className={x.weekDays} aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.iso} data-today={i === days.length - 1}>
            {i === days.length - 1 ? "Today" : weekday(d.iso)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A status, step by step: done in teal, the current one in the signal colour, the rest as hairlines. */
export function Tracker({ steps, at, when }: { steps: { label: string }[]; at: number; when?: (i: number) => string | null }) {
  return (
    <ol className={x.tracker}>
      {steps.map((s, i) => (
        <li key={s.label} data-state={i < at ? "done" : i === at ? "now" : "later"}>
          <span className={x.trackDot} aria-hidden="true" />
          <span className={x.trackLabel}>{s.label}</span>
          {when?.(i) && <span className={`${x.trackWhen} num`}>{when(i)}</span>}
          <span className="sr-only">{i < at ? "done" : i === at ? "current" : "to come"}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Dated readings as points joined by a line. Only what was measured: no trend line, no target,
 * no forecast. Sized to its container so text and dots never stretch.
 */
export function WeightChart({ readings, unit, toUnit }: { readings: { at: string; kg: number }[]; unit: string; toUnit: (kg: number) => number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 168;
  const pad = { l: 34, r: 12, t: 14, b: 26 };
  const vals = readings.map((r) => toUnit(r.kg));
  const lo = Math.floor(Math.min(...vals) - 0.6);
  const hi = Math.ceil(Math.max(...vals) + 0.6);
  const t0 = readings.length ? new Date(readings[0].at).getTime() : 0;
  const t1 = Math.max(t0 + 1, readings.length ? new Date(readings[readings.length - 1].at).getTime() : 1);
  const X = (iso: string) => pad.l + ((new Date(iso).getTime() - t0) / (t1 - t0)) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const pts = readings.map((r, i) => [X(r.at), Y(vals[i])] as const);
  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");
  const mid = Math.round(((lo + hi) / 2) * 2) / 2;
  return (
    <div ref={ref} className={x.chart}>
      {w > 0 && readings.length > 1 && (
        <svg width={w} height={H} role="img" aria-label={`Weight readings: ${readings.map((r, i) => `${short(r.at)} ${vals[i].toFixed(1)} ${unit}`).join(", ")}`}>
          {[hi, mid, lo].map((g) => (
            <g key={g}>
              <line x1={pad.l} x2={w - pad.r} y1={Y(g)} y2={Y(g)} className={x.grid} />
              <text x={pad.l - 8} y={Y(g) + 4} textAnchor="end" className={x.axis}>
                {g}
              </text>
            </g>
          ))}
          <path d={line} className={x.line} />
          {pts.map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={i === pts.length - 1 ? 5 : 3.5} className={i === pts.length - 1 ? x.dotLast : x.dot} />
          ))}
          <text x={pad.l} y={H - 6} className={x.axis}>
            {short(readings[0].at)}
          </text>
          <text x={w - pad.r} y={H - 6} textAnchor="end" className={x.axis}>
            {short(readings.at(-1)!.at)}
          </text>
        </svg>
      )}
    </div>
  );
}

/* ---------- where Back goes: the page the patient came from, when it is one of the app's own ---------- */

const PLACES: Record<string, { href: string; label: string }> = {
  home: { href: "/dashboard", label: "Home" },
  care: { href: "/dashboard/care", label: "Care" },
  appointments: { href: "/dashboard/appointments", label: "Appointments" },
  progress: { href: "/dashboard/progress", label: "Progress" },
  resources: { href: "/dashboard/resources", label: "Resources" },
  notifications: { href: "/dashboard/notifications", label: "Notifications" },
  profile: { href: "/dashboard/profile", label: "Profile" },
};
const FROM = "medistry-from";

// every in-app link remembers the page it was tapped on, so the next page's Back can return there
if (typeof window !== "undefined") {
  document.addEventListener(
    "click",
    (e) => {
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const to = new URL(link.href, window.location.href);
      if (to.origin !== window.location.origin || to.pathname === window.location.pathname) return;
      try {
        sessionStorage.setItem(FROM, window.location.pathname);
      } catch {
        // storage blocked: Back keeps the page's own parent
      }
    },
    true,
  );
}

/** ?from=care names the origin outright; otherwise the page the last in-app link was tapped on. */
function origin(): { href: string; label: string } | null {
  if (typeof window === "undefined") return null;
  const named = new URLSearchParams(window.location.search).get("from");
  if (named && PLACES[named]) return PLACES[named];
  let path: string | null = null;
  try {
    path = sessionStorage.getItem(FROM);
  } catch {}
  const hit = Object.values(PLACES).find((p) => p.href === path);
  return hit && hit.href !== window.location.pathname ? hit : null;
}

/**
 * The head of every page: one title size and position across the app, an optional back link
 * (stacked above the title), an optional line under it and an optional action on the right. Back
 * returns to the page the patient came from when that is one of the app's own; the `back` a page
 * passes is its parent, used when they arrived some other way.
 */
export function PageHead({ title, back, sub, action }: { title: ReactNode; back?: { href: string; label: string }; sub?: ReactNode; action?: ReactNode }) {
  // read once: Shell renders pages only in the browser, and the link must not change under a tap
  const [came] = useState(origin);
  const to = back ? (came ?? back) : null;
  return (
    <div className={u.head}>
      {to && (
        <Link href={to.href} className={u.back}>
          <ArrowLeft size={14} weight="bold" aria-hidden="true" />
          {to.label}
        </Link>
      )}
      <div className={u.titleRow}>
        <h1 className={u.title}>{title}</h1>
        {action}
      </div>
      {sub && <p className={u.sub}>{sub}</p>}
    </div>
  );
}

/**
 * Before anything is booked: the three steps to a first consultation as a short list (the same three
 * as on Home), one fee line, and the longer explanation folded under "How it works". The card's own
 * button follows it.
 */
export function FirstSteps() {
  return (
    <div className={u.first}>
      <ol className={u.fsteps}>
        <li data-state="now">
          <i aria-hidden="true" />
          <span>
            A call from a counsellor<span className="sr-only">, next</span>
          </span>
        </li>
        <li>
          <i aria-hidden="true" />
          <span>Blood tests, if none in 90 days</span>
        </li>
        <li>
          <i aria-hidden="true" />
          <span>
            Your first consultation
            <span className={u.fdetail}>30 min by video with a doctor</span>
          </span>
        </li>
      </ol>
      <p className={u.ffee}>
        Assessment fee for all three: <span className="num">₹XXX</span>
      </p>
      <details className={u.how}>
        <summary>
          How it works
          <CaretDown size={14} weight="bold" aria-hidden="true" />
        </summary>
        <p>
          The counsellor checks the programme suits you and passes your details to your doctor. If you have no blood tests from the last 90 days, we book a home test before your
          consultation. Medicine only if your doctor judges it right for you.
        </p>
      </details>
    </div>
  );
}

/** The back plate's class, for a back control that is not a PageHead link (a step back inside a sheet, the clinician's record). */
export const backClass = u.back;

/** A back link in the app's one style: the arrow in mint ink on a tinted 7px plate, a 44px target. */
export function BackLink({ href, label, className = "" }: { href: string; label: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${u.back} ${className}`}>
      <ArrowLeft size={14} weight="bold" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** One segmented control for the whole app: a track, a white thumb, 44px tall. */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className={u.seg} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

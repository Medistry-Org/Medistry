/**
 * Date and time wording, one way across the whole app.
 * Rules (from the design system): "13 Sep" never "Sept", "6:30 pm" never "06:30 PM", and a date
 * never breaks across two lines (non-breaking spaces).
 */

// spelled out by hand: browsers disagree on short months ("Sep" in Safari, "Sept" in Chrome)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 864e5;

/** "13 Sep" */
export const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "12 September 2026" */
export const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)).replace(/ /g, " ");

/** "Thu" */
export const weekdayShort = (iso: string) => new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(new Date(iso));

/** "Thursday 3 October" */
export const weekdayDayMonth = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });

const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

/** "6 pm", "6:30 pm" */
export const clockTime = (d: Date) =>
  timeFormat
    .format(d)
    .replace(/\s?([ap])\.?m\.?/i, " $1m")
    .replace(/:00(?= )/, "")
    .toLowerCase();

/** "14:30" or "14:30:00" from the backend, as "2:30 pm". */
export const clockTimeFromHhMm = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return clockTime(d);
};

/** "Just now", "12 min ago", "5 h ago", "Yesterday", then "27 Sep" (with the year if not this one). */
export function timeAgo(iso: string, now: number) {
  const t = new Date(iso).getTime();
  const minutes = Math.round((now - t) / 6e4);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48 && new Date(t).toDateString() === new Date(now - DAY_MS).toDateString()) return "Yesterday";
  const year = new Date(t).getFullYear();
  return year === new Date(now).getFullYear() ? shortDate(iso) : `${shortDate(iso)} ${year}`;
}

/** "in 12 minutes", "in 3 hours", "tomorrow", "in 7 days" */
export function timeUntil(iso: string, now: number) {
  const at = new Date(iso);
  const ms = at.getTime() - now;
  if (ms <= 0) return "now";
  const minutes = Math.round(ms / 6e4);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const n = new Date(now);
  const days = Math.round(
    (new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime() - new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) / DAY_MS,
  );
  if (days === 0) {
    const hours = Math.round(minutes / 60);
    return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/** "Today", "Tomorrow", or "Thu" */
export function relativeDayName(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return weekdayShort(iso);
}

/** A video call opens 10 minutes before its start and stays open for its length. */
export const isCallJoinable = (iso: string, durationMinutes: number, now: number) => {
  const t = new Date(iso).getTime();
  return now >= t - 10 * 6e4 && now <= t + durationMinutes * 6e4;
};

/** "2026-10-28" in local time, the date format every backend endpoint takes. */
export const toApiDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Combines "2026-10-28" and "14:30" into an ISO timestamp in local time. */
export const combineDateAndTime = (date: string, hhmm: string) => {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const [hours, minutes] = (hhmm || "00:00").split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hours || 0, minutes || 0).toISOString();
};

/**
 * Date and time wording, one way across the whole app, always in India time (Asia/Kolkata): the
 * backend, the doctors and the bookable slots all run on IST, so a phone set to another time zone
 * still shows and sends the same days and times.
 * Rules (from the design system): "13 Sep" never "Sept", "6:30 pm" never "06:30 PM", and a date
 * never breaks across two lines (non-breaking spaces).
 */

const INDIA_TIME_ZONE = "Asia/Kolkata";
/** IST is UTC+5:30 all year (India has no daylight saving), so a fixed offset is exact. */
const INDIA_OFFSET_MS = 330 * 6e4;
const DAY_MS = 864e5;
// spelled out by hand: browsers disagree on short months ("Sep" in Safari, "Sept" in Chrome)
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: INDIA_TIME_ZONE,
});
const weekdayShortFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  timeZone: INDIA_TIME_ZONE,
});
const weekdayLongFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  timeZone: INDIA_TIME_ZONE,
});
const dayOfMonthFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  timeZone: INDIA_TIME_ZONE,
});
const monthFormat = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  timeZone: INDIA_TIME_ZONE,
});
const monthAndYearFormat = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: INDIA_TIME_ZONE,
});
const longDateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: INDIA_TIME_ZONE,
});

/** The same instant moved by India's offset, so its getUTC* fields read the wall clock in India. */
export const inIndiaTime = (date: Date) =>
  new Date(date.getTime() + INDIA_OFFSET_MS);

/** Whole days since 1 Jan 1970 on India's calendar: equal for two instants on the same India day. */
const indiaDayNumber = (time: number) =>
  Math.floor((time + INDIA_OFFSET_MS) / DAY_MS);

/** Noon in India, `daysFromToday` India calendar days from today: one stable instant per day. */
export const indiaNoon = (daysFromToday: number) =>
  new Date(
    (indiaDayNumber(Date.now()) + daysFromToday) * DAY_MS +
      DAY_MS / 2 -
      INDIA_OFFSET_MS,
  );

/** "13 Sep" */
export const shortDate = (iso: string) => {
  const india = inIndiaTime(new Date(iso));
  return `${india.getUTCDate()} ${MONTHS[india.getUTCMonth()]}`;
};

/** "12 September 2026" */
export const longDate = (iso: string) =>
  longDateFormat.format(new Date(iso)).replace(/ /g, " ");

/** "Thu" */
export const weekdayShort = (iso: string) =>
  weekdayShortFormat.format(new Date(iso));

/** "3": the day of the month */
export const dayOfMonth = (date: Date) => dayOfMonthFormat.format(date);

/** "October", for a calendar month (0 to 11); mid-month in UTC, so every time zone names the same one */
export const monthName = (monthIndex: number) =>
  monthFormat.format(new Date(Date.UTC(2000, monthIndex, 15)));

/** "October 2026", for a calendar month (0 to 11) */
export const monthAndYear = (year: number, monthIndex: number) =>
  monthAndYearFormat.format(new Date(Date.UTC(year, monthIndex, 15)));

/** "Thursday 3 October" */
export const weekdayDayMonth = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: INDIA_TIME_ZONE,
});

/** "6 pm", "6:30 pm" */
export const clockTime = (date: Date) =>
  timeFormat
    .format(date)
    .replace(/\s?([ap])\.?m\.?/i, " $1m")
    .replace(/:00(?= )/, "")
    .toLowerCase();

/** "Just now", "12 min ago", "5 h ago", "Yesterday", then "27 Sep" (with the year if not this one). */
export function timeAgo(iso: string, now: number) {
  const time = new Date(iso).getTime();
  const minutes = Math.round((now - time) / 6e4);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48 && indiaDayNumber(time) === indiaDayNumber(now - DAY_MS))
    return "Yesterday";
  const year = inIndiaTime(new Date(time)).getUTCFullYear();
  return year === inIndiaTime(new Date(now)).getUTCFullYear()
    ? shortDate(iso)
    : `${shortDate(iso)} ${year}`;
}

/** "in 12 minutes", "in 3 hours", "tomorrow", "in 7 days" */
export function timeUntil(iso: string, now: number) {
  const time = new Date(iso).getTime();
  const ms = time - now;
  if (ms <= 0) return "now";
  const minutes = Math.round(ms / 6e4);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const days = indiaDayNumber(time) - indiaDayNumber(now);
  if (days === 0) {
    const hours = Math.round(minutes / 60);
    return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

/** "Today", "Tomorrow", or "Thu" */
export function relativeDayName(iso: string) {
  const daysAway =
    indiaDayNumber(new Date(iso).getTime()) - indiaDayNumber(Date.now());
  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  return weekdayShort(iso);
}

/** "tomorrow", or "Thursday 3 Oct": how a booking confirmation says the day */
export function spokenDay(date: Date) {
  const name = relativeDayName(date.toISOString());
  if (name === "Today" || name === "Tomorrow") return name.toLowerCase();
  return `${weekdayLongFormat.format(date)} ${shortDate(date.toISOString())}`;
}

/** A video call opens 10 minutes before its start and stays open for its length. */
export const isCallJoinable = (
  iso: string,
  durationMinutes: number,
  now: number,
) => {
  const start = new Date(iso).getTime();
  return now >= start - 10 * 6e4 && now <= start + durationMinutes * 6e4;
};

/** "2026-10-28": the India date of an instant, the date format every backend endpoint takes. */
export const toApiDate = (date: Date) =>
  inIndiaTime(date).toISOString().slice(0, 10);

/** Combines "2026-10-28" and "14:30", both India time as the backend sends them, into an ISO timestamp. */
export const combineDateAndTime = (date: string, hhmm: string) => {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hours, minutes] = (hhmm || "00:00").split(":").map(Number);
  return new Date(
    Date.UTC(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0) -
      INDIA_OFFSET_MS,
  ).toISOString();
};

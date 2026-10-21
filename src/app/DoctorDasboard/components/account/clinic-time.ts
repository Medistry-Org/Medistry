/*
  Sample timestamps that a real clinic could have produced. The care team works Monday to Saturday,
  9 am to 8 pm (CONFIRM with the client), so seeded messages, calls and notes are placed inside those
  hours instead of "now minus three hours", which at midnight on a Sunday reads as nonsense.
*/

export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 20;

const isWorkday = (d: Date) => d.getDay() !== 0;

/** Whether the care team is working at this moment. */
export function inClinicHours(t: number) {
  const d = new Date(t);
  const h = d.getHours() + d.getMinutes() / 60;
  return isWorkday(d) && h >= OPEN_HOUR && h < CLOSE_HOUR;
}

/**
 * A time `workdaysAgo` working days before `now` (0 = the latest working day), at hh:mm, kept inside
 * clinic hours and never in the future. Sundays are skipped.
 */
export function clinicTime(now: number, workdaysAgo: number, hh: number, mm = 0) {
  const d = new Date(now);
  const hour = Math.min(Math.max(hh, OPEN_HOUR), CLOSE_HOUR - 1);
  d.setHours(hour, mm, 0, 0);
  // the latest working day whose slot has already passed
  while (!isWorkday(d) || d.getTime() > now) d.setDate(d.getDate() - 1);
  for (let i = 0; i < workdaysAgo; i++) {
    d.setDate(d.getDate() - 1);
    while (!isWorkday(d)) d.setDate(d.getDate() - 1);
  }
  return d.getTime();
}

/** When the care team is next back, for an out-of-hours message: "at 9 am", "on Monday at 9 am". */
export function backAt(now: number) {
  const d = new Date(now);
  if (inClinicHours(now)) return null;
  const next = new Date(d);
  if (d.getHours() >= CLOSE_HOUR || !isWorkday(d)) next.setDate(next.getDate() + 1);
  while (!isWorkday(next)) next.setDate(next.getDate() + 1);
  const sameDay = next.toDateString() === d.toDateString();
  const tomorrow = next.toDateString() === new Date(now + 864e5).toDateString();
  const day = sameDay ? "" : tomorrow ? " tomorrow" : ` on ${new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(next)}`;
  return `${day} at ${OPEN_HOUR} am`.trim();
}

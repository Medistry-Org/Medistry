"use client";

import {
  CalendarBlank,
  Flask,
  Package,
  Prescription,
  Receipt,
  Syringe,
} from "@phosphor-icons/react";
//import type { Dashboard } from "./api";
import type { CareRecord } from "./care";
import type { AppData } from "./Shell";
import { when } from "./Booking";
import { short, time } from "./bits";
import { setPrefs } from "./prefs";
import { clinicTime } from "./clinic-time";

export type Update = {
  id: string;
  at: string;
  kind: "visit" | "lab" | "rx" | "order" | "pen" | "pay";
  title: string;
  text: string;
  href: string;
};

export const ICON = {
  visit: CalendarBlank,
  lab: Flask,
  rx: Prescription,
  order: Package,
  pen: Syringe,
  pay: Receipt,
};

const DAY = 864e5;
const newest = (list: (Update | false | null | undefined)[]) =>
  list.filter((u): u is Update => !!u).sort((p, q) => q.at.localeCompare(p.at));

/**
 * What changed, newest first: built from the record so it can never disagree with it. In the
 * product these arrive from GET /api/v1/notifications and as WhatsApp messages.
 */
export function updatesOf(care: CareRecord, now: number): Update[] {
  const rx = care.prescriptions.find((r) => r.status === "SIGNED");
  const lab = care.labs.find((l) => l.status === "REVIEWED");
  const pending = care.labs.find((l) =>
    [
      "SAMPLE_COLLECTED",
      "PROCESSING",
      "REPORT_READY",
      "DOCTOR_REVIEW_PENDING",
    ].includes(l.status),
  );
  const order = care.orders[0];
  const pen = rx?.items.find((i) => i.form === "PEN");
  const penDone =
    pen &&
    care.medication.some(
      (m) => m.item === pen.medicine_name && m.status === "TAKEN",
    );
  const lastVisit = care.consultations[0];
  const next = care.next && new Date(care.next.at);
  const end = new Date(care.programme.end_at);
  const orderStep = order?.history.at(-1);

  return newest([
    !!next &&
      (next.getTime() - now < 2 * DAY
        ? {
            id: `visit-soon-${care.next!.at}`,
            at: new Date(now - 60e3).toISOString(),
            kind: "visit",
            title: "Your follow-up is coming up",
            text: `${when(next)}, ${time(next)}. Opens 10 min before.`,
            href: "/dashboard/appointments",
          }
        : {
            id: `visit-${care.next!.at}`,
            at: lastVisit?.at ?? care.started_at,
            kind: "visit",
            title: "Follow-up booked",
            text: `${when(next)}, ${time(next)} by video.`,
            href: "/dashboard/appointments",
          }),
    !!pen &&
      !penDone && {
        id: "pen-first",
        at: orderStep?.at ?? new Date(now).toISOString(),
        kind: "pen",
        title: "Before your first injection",
        text: "A short video and the steps.",
        href: "/dashboard/guides/first-injection",
      },
    !!pending && {
      id: `lab-${pending.id}-${pending.status}`,
      at: pending.slot_at,
      kind: "lab",
      title:
        pending.status === "REPORT_READY" ||
        pending.status === "DOCTOR_REVIEW_PENDING"
          ? "Blood test report ready"
          : "Blood samples at the lab",
      text:
        pending.status === "REPORT_READY" ||
        pending.status === "DOCTOR_REVIEW_PENDING"
          ? "Your doctor adds a note soon."
          : "Results in a day or two.",
      href: "/dashboard/care?open=report",
    },
    !!lab && {
      id: `lab-${lab.id}`,
      at: lab.report_date!,
      kind: "lab",
      title: "Blood test results reviewed",
      text: "Your doctor has added a note.",
      href: "/dashboard/care?open=report",
    },
    !!rx && {
      id: `rx-${rx.id}`,
      at: rx.signed_at!,
      kind: "rx",
      title: rx.version > 1 ? "Prescription updated" : "Prescription ready",
      text: "What each medicine is for.",
      href: "/dashboard/care?open=rx",
    },
    !!order &&
      !!orderStep && {
        id: `order-${order.id}-${order.status}`,
        at: orderStep.at,
        kind: "order",
        title:
          order.status === "DELIVERED"
            ? "Medicines delivered"
            : order.status === "DISPATCHED"
              ? "Medicines on the way"
              : "Order being packed",
        text:
          order.status === "DELIVERED"
            ? "Scan the QR seal on each pack."
            : `Tracking number ${order.tracking_no}.`,
        href: "/dashboard/care#orders",
      },
    // a home test the patient booked themselves, so the bell confirms what they just did
    ...care.labs
      .filter(
        (l) => l.status === "SLOT_CONFIRMED" && l.package.startsWith("Packet"),
      )
      .map((l) => ({
        id: `lab-booked-${l.id}`,
        at: new Date(now - 30e3).toISOString(),
        kind: "lab" as const,
        title: "Home blood test booked",
        text: `${when(new Date(l.slot_at))}, ${time(new Date(l.slot_at))}. Nothing but water from 9 pm the night before.`,
        href: "/dashboard/appointments",
      })),
    care.programme.status === "SUGGESTED" && {
      id: "plan-suggested",
      at: lastVisit?.at ?? care.started_at,
      kind: "pay",
      title: "Your doctor has suggested a programme",
      text: "See it, and the price, before you pay.",
      href: "/dashboard/care?open=programme",
    },
    // a pause or cancellation the patient asked for, until the care team confirms it
    !!care.plan_change && {
      id: `plan-${care.plan_change.kind}-${care.plan_change.requested_at}`,
      at: care.plan_change.requested_at,
      kind: "pay",
      title:
        care.plan_change.kind === "PAUSE"
          ? "Pause requested"
          : "Cancellation requested",
      text: "Your care team confirms it with you on WhatsApp before anything changes.",
      href: "/dashboard/profile?open=plan",
    },
    // the stage 3 demo shows it early so the state can be reviewed; the copy names the real date
    care.programme.status === "ACTIVE" &&
      ((end.getTime() - now < 14 * DAY && end.getTime() > now) ||
        care.stage === 3) && {
        id: `renew-${care.programme.end_at}`,
        // a weekday morning in clinic hours, never in the future
        at: new Date(
          Math.min(
            clinicTime(now, 0, 10),
            clinicTime(end.getTime() - 14 * DAY, 0, 10),
          ),
        ).toISOString(),
        kind: "pay",
        title: `Programme ends ${short(care.programme.end_at)}`,
        text: "Renew only if you want to.",
        href: "/dashboard/profile?open=plan",
      },
  ]);
}

/** The two oldest updates of a sample record arrive read: a record weeks old has been looked at before. */
export function seedRead(care: CareRecord) {
  markRead(
    updatesOf(care, Date.now())
      .slice(-2)
      .map((u) => u.id),
  );
}

/**
 * Before the first consultation there is no care record yet: only the first consultation, booked or
 * a nudge to book it. A bare welcome changes nothing about care, so it is not a notification.
 */
export function welcomeUpdates(dash: Dashboard, now: number): Update[] {
  const appt = dash.appointment;
  const at = appt && new Date(appt.scheduled_at);
  return newest([
    at
      ? {
          id: `first-${appt!.scheduled_at}`,
          at:
            at.getTime() - now < 2 * DAY
              ? new Date(now - 60e3).toISOString()
              : dash.user.created_at,
          kind: "visit",
          title:
            at.getTime() - now < 2 * DAY
              ? "Your first consultation is coming up"
              : "First consultation booked",
          text: `${when(at)}, ${time(at)}, 30 min by video with a doctor.`,
          href: "/dashboard/appointments",
        }
      : !dash.booked_elsewhere && {
          id: "first-book",
          at: dash.user.created_at,
          kind: "visit",
          title: "Book your first consultation",
          text: "30 minutes by video with a doctor, after a counsellor's call. Assessment fee ₹XXX, covering the call, blood tests if needed and this consultation.",
          href: "/dashboard",
        },
  ]);
}

/** The right list for where the patient is: the care record's updates, or the first consultation before it exists. */
export const allUpdates = (
  data: Pick<AppData, "dash" | "care">,
  now: number,
) => (data.care ? updatesOf(data.care, now) : welcomeUpdates(data.dash, now));

/**
 * Unread means one thing everywhere: an update from the care record whose id is not in
 * prefs.read. The bell (Shell) and the inbox both count it this way, so they always agree. Before
 * the first consultation there is no record, so those notes are shown but never counted.
 */
export const isUnread = (u: Update, read: string[], counted: boolean) =>
  counted && !read.includes(u.id);

export const markRead = (ids: string[]) =>
  setPrefs((p) => ({ ...p, read: [...new Set([...p.read, ...ids])] }));

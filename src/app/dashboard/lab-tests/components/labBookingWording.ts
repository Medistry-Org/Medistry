/**
 * How a lab booking reads on screen: its status in words and its collection window. Shared by the
 * bookings list and a booking's own page.
 */

import { clockTime } from "@/lib/format/dateTime";
import { spokenDay } from "@/components/ui/SlotPicker";
import type { LabBooking, LabBookingStatus } from "@/types/labTest";

export const LAB_STATUS_WORDS: Record<LabBookingStatus, string> = {
  PAYMENT_PENDING: "Waiting for payment",
  BOOKED: "Booked",
  COLLECTOR_ASSIGNED: "Collector assigned",
  SAMPLE_COLLECTED: "Sample collected",
  PROCESSING: "At the lab",
  REPORT_READY: "Report ready",
  CANCELLED: "Cancelled",
  EXPIRED: "Not paid in time",
};

/** Still to happen or under way: everything but a ready report, a cancellation or an unpaid hold. */
export const isOngoing = (booking: LabBooking) => !["REPORT_READY", "CANCELLED", "EXPIRED"].includes(booking.status);

/** "Tomorrow, 7 am to 8 am" or "Thursday 3 Oct, 7 am to 8 am" */
export function collectionWindow(booking: LabBooking) {
  const start = new Date(booking.collectionStartsAt);
  const day = spokenDay(start);
  const end = booking.collectionEndsAt ? ` to ${clockTime(new Date(booking.collectionEndsAt))}` : "";
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${clockTime(start)}${end}`;
}

/** The checkout for a held booking; it comes back to the booking's page once paid. */
export const labCheckoutHref = (booking: LabBooking) =>
  `/dashboard/checkout?purpose=LAB_BOOKING&referenceId=${encodeURIComponent(booking.id)}&returnTo=${encodeURIComponent(`/dashboard/lab-tests/${booking.id}`)}`;

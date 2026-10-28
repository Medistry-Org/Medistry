/**
 * Home blood tests (Redcliffe Labs, called by the Medistry backend only: it holds the secret key).
 * Every endpoint, with its Redcliffe call, is in docs/backend/lab-tests-redcliffe.md.
 *   GET  /api/labs/packages                      Redcliffe center-package-data
 *   GET  /api/labs/packages/:code                Redcliffe package-parameter-data
 *   GET  /api/labs/locations/search?query=       Redcliffe get-partner-location-2-eloc
 *   GET  /api/labs/locations/:eloc               Redcliffe get-partner-loc-2-eloc
 *   GET  /api/labs/serviceability?latitude&longitude   Redcliffe is-location-serviceable
 *   GET  /api/labs/slots?date&addressId          Redcliffe get-time-slot-list
 *   POST /api/labs/bookings                      Redcliffe center-create-booking (slot held 30 min)
 *   GET  /api/labs/bookings                      the patient's bookings (Medistry database)
 *   GET  /api/labs/bookings/:id                  + center-get-booking, booking-test-status, corporate-phlebo-tracking
 *   POST /api/labs/bookings/:id/reschedule       Redcliffe center-update-booking (rescheduled)
 *   POST /api/labs/bookings/:id/cancel           Redcliffe center-update-booking (cancelled)
 *   GET  /api/labs/bookings/:id/report           Redcliffe get-consolidated-report
 */

import { ApiError, apiRequest, listFrom } from "@/lib/http/apiClient";
import { combineDateAndTime } from "@/lib/format/dateTime";
import type { LabBooking, LabCoordinates, LabPackage, LabPackageTests, LabPlaceMatch, LabServiceability, LabSlot, NewLabBooking } from "@/types/labTest";

type RequestOptions = Parameters<typeof apiRequest>[1];

/** A backend without the endpoint answers 404 with an HTML page; say it in words instead. */
async function labRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint && (caught.body === null || typeof caught.body !== "object")) {
      throw new ApiError("Home blood tests are not available yet.", 404, caught.body);
    }
    throw caught;
  }
}

/** For loaders: null means the backend does not have this endpoint yet, so the screen says so calmly. */
async function nullWhenMissing<T>(load: Promise<T>): Promise<T | null> {
  try {
    return await load;
  } catch (caught) {
    if (caught instanceof ApiError && caught.isMissingEndpoint) return null;
    throw caught;
  }
}

type RawLabBooking = Omit<LabBooking, "id" | "partnerBookingId"> & { id: number | string; partnerBookingId: number | string | null };

const toLabBooking = (raw: RawLabBooking): LabBooking => ({
  ...raw,
  id: String(raw.id),
  partnerBookingId: raw.partnerBookingId === null ? null : String(raw.partnerBookingId),
  collector: raw.collector ?? null,
  tests: raw.tests ?? [],
});

type RawSlot = { slotId: number | string; startTime: string; endTime: string; available: number };

export async function listLabPackages(): Promise<LabPackage[] | null> {
  return nullWhenMissing(labRequest("/api/labs/packages").then((body) => listFrom<LabPackage>(body)));
}

export async function getLabPackageTests(code: string): Promise<LabPackageTests> {
  const body = await labRequest<{ data: LabPackageTests }>(`/api/labs/packages/${encodeURIComponent(code)}`);
  return body.data;
}

export async function searchLabLocations(query: string): Promise<LabPlaceMatch[]> {
  const body = await labRequest("/api/labs/locations/search", { query: { query } });
  return listFrom<LabPlaceMatch>(body);
}

export async function getLabLocationCoordinates(eloc: string): Promise<LabCoordinates> {
  const body = await labRequest<{ data: LabCoordinates }>(`/api/labs/locations/${encodeURIComponent(eloc)}`);
  return body.data;
}

export async function checkLabServiceability(point: LabCoordinates): Promise<LabServiceability> {
  const body = await labRequest<{ data: LabServiceability }>("/api/labs/serviceability", { query: point });
  return body.data;
}

/** The open collection windows on one day at a saved address. `date` is "YYYY-MM-DD". */
export async function listLabSlots(date: string, addressId: number): Promise<LabSlot[]> {
  const body = await labRequest<{ data: Record<"morning" | "afternoon" | "evening", RawSlot[]> }>("/api/labs/slots", { query: { date, addressId } });
  const { morning = [], afternoon = [], evening = [] } = body.data ?? {};
  return [...morning, ...afternoon, ...evening].map((slot) => ({
    id: String(slot.slotId),
    startsAt: combineDateAndTime(date, slot.startTime),
    endsAt: combineDateAndTime(date, slot.endTime),
    open: slot.available > 0,
  }));
}

/** Holds the slot for 30 minutes. Pay within that time (or it is confirmed at once when a plan covers it). */
export async function createLabBooking(booking: NewLabBooking): Promise<LabBooking> {
  const body = await labRequest<{ data: RawLabBooking }>("/api/labs/bookings", { method: "POST", body: booking });
  return toLabBooking(body.data);
}

export async function listMyLabBookings(): Promise<LabBooking[] | null> {
  return nullWhenMissing(labRequest("/api/labs/bookings").then((body) => listFrom<RawLabBooking>(body).map(toLabBooking)));
}

export async function getLabBooking(bookingId: string): Promise<LabBooking | null> {
  return nullWhenMissing(labRequest<{ data: RawLabBooking }>(`/api/labs/bookings/${encodeURIComponent(bookingId)}`).then((body) => toLabBooking(body.data)));
}

export async function rescheduleLabBooking(bookingId: string, collectionDate: string, slotId: string): Promise<LabBooking> {
  const body = await labRequest<{ data: RawLabBooking }>(`/api/labs/bookings/${encodeURIComponent(bookingId)}/reschedule`, {
    method: "POST",
    body: { collectionDate, slotId },
  });
  return toLabBooking(body.data);
}

export async function cancelLabBooking(bookingId: string, reason: string): Promise<LabBooking> {
  const body = await labRequest<{ data: RawLabBooking }>(`/api/labs/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: "POST", body: { reason } });
  return toLabBooking(body.data);
}

/** A fresh link to the lab's PDF (Redcliffe's links can expire, so ask each time). */
export async function getLabReportUrl(bookingId: string): Promise<string> {
  const body = await labRequest<{ data: { url: string } }>(`/api/labs/bookings/${encodeURIComponent(bookingId)}/report`);
  return body.data.url;
}

/**
 * Self-check for redcliffeClient.ts against the Redcliffe API v2 doc's own example requests and error
 * replies. No network: globalThis.fetch is replaced by a fake that records each request.
 *
 * Run (Node 22.18+, which runs .ts directly; react-server makes "server-only" resolve):
 *   node --no-warnings --conditions=react-server src/server/redcliffe/redcliffeClient.check.mjs
 */

import assert from "node:assert/strict";
import {
  RedcliffeError,
  checkServiceability,
  confirmBooking,
  createBooking,
  getBookings,
  getConsolidatedReport,
  getCoordinatesForEloc,
  getDigitalReport,
  getBookingTestStatus,
  getPhleboTracking,
  listTimeSlots,
  searchLocations,
  todayInIndia,
  updateBooking,
} from "./redcliffeClient.ts";

process.env.REDCLIFFE_BASE_URL = "https://apiqa.example.test/";
process.env.REDCLIFFE_API_KEY = "test-key";

let calls = [];
let reply = {};
globalThis.fetch = async (url, init) => {
  calls.push({
    url: new URL(url),
    method: init.method,
    headers: init.headers,
    body: init.body ? JSON.parse(init.body) : undefined,
  });
  return new Response(JSON.stringify(reply), { status: 200 });
};
const lastCall = () => calls[calls.length - 1];
const answer = (body) => {
  reply = body;
  calls = [];
};

const today = todayInIndia();
const plusDays = (days) => {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Every check that fails validation must throw RedcliffeError before anything is sent. */
async function rejects(run, pattern) {
  calls = [];
  await assert.rejects(
    run,
    (caught) =>
      caught instanceof RedcliffeError &&
      caught.httpStatus === null &&
      pattern.test(caught.message),
  );
  assert.equal(calls.length, 0, `nothing is sent when ${pattern} fails`);
}

// Doc "Example Request 1: Without add-on member" (dates moved into the 4-day window).
const example1 = {
  collection_date: plusDays(1),
  collection_slot: 9,
  customer_name: "dummy",
  customer_age: 26,
  customer_gender: "male",
  package_code: ["SE046F"],
  customer_email: "akash.paulmurugan@redcliffe.com",
  customer_phonenumber: "9289708244",
  customer_address:
    "Flat Nuber: 1, 58 NS Palya, Stage 2, BTM Layout, Bengaluru, Bengaluru Urban, Bangalore Division, Karnataka, India, 560076",
  address_line2: "BTM Layout, Bengaluru, Bengaluru Urban, Bangalore",
  customer_landmark:
    "Flat Number: 1, 58 NS Palya, Stage 2, BTM Layout, Bengaluru, Bengaluru Urban, Bangalore Division, Karnataka, India, 560076",
  pincode: "560076",
  is_credit: true,
  center_discount: 800,
  customer_longitude: 77.60813601507671,
  customer_latitude: 12.91092286017229,
  additional_member: [],
  client_refid: "na",
  reference_data: "na",
};
const created = {
  status: "success",
  message:
    "Booking have been created temporary. The slot will be locked for next 30 mins.",
  booking_id: 1354195,
};

answer(created);
assert.equal((await createBooking(example1)).booking_id, 1354195);
{
  const { url, method, headers, body } = lastCall();
  assert.equal(method, "POST");
  assert.equal(
    url.href,
    "https://apiqa.example.test/api/external/v2/center-create-booking/",
  );
  assert.deepEqual(headers, {
    key: "test-key",
    "Content-Type": "application/json",
  });
  assert.deepEqual(body, {
    ...example1,
    booking_date: today,
    customer_altphonenumber: "9289708244",
    customer_whatsappnumber: "9289708244",
  });
  assert.equal(
    "customer_whatsapppnumber" in body,
    false,
    "the table spelling (two p's) is sent, by the team's decision",
  );
}

// Doc "Example Request 2: With add-on member": camelCase member keys; Male is lower-cased.
answer(created);
await createBooking({
  ...example1,
  customer_name: "Sachin Sharma",
  customer_gender: "Male",
  additional_member: [
    {
      customerName: "Sachin Sharma",
      customerAge: 30,
      customerGender: "Male",
      packageCode: ["PL183"],
    },
  ],
});
assert.equal(lastCall().body.customer_gender, "male");
assert.deepEqual(lastCall().body.additional_member, [
  {
    customerName: "Sachin Sharma",
    customerAge: 30,
    customerGender: "male",
    packageCode: ["PL183"],
  },
]);

// The doc's limits, enforced before sending.
await rejects(
  () => createBooking({ ...example1, customer_phonenumber: "5999999999" }),
  /customer_phonenumber/,
);
await rejects(
  () => createBooking({ ...example1, customer_phonenumber: "98765" }),
  /customer_phonenumber/,
);
await rejects(
  () => createBooking({ ...example1, pincode: "56007" }),
  /pincode/,
);
await rejects(
  () => createBooking({ ...example1, collection_date: plusDays(5) }),
  /collection_date must be between/,
);
await rejects(
  () => createBooking({ ...example1, collection_date: plusDays(-1) }),
  /collection_date must be between/,
);
await rejects(
  () => createBooking({ ...example1, collection_date: "10-06-2025" }),
  /YYYY-MM-DD/,
);
await rejects(
  () => createBooking({ ...example1, collection_date: "2026-02-30" }),
  /YYYY-MM-DD/,
);
await rejects(
  () => createBooking({ ...example1, customer_name: "Al" }),
  /customer_name/,
);
await rejects(
  () => createBooking({ ...example1, customer_name: "R2D2 Unit" }),
  /customer_name/,
);
await rejects(
  () => createBooking({ ...example1, customer_name: "A".repeat(31) }),
  /customer_name/,
);
await rejects(
  () => createBooking({ ...example1, customer_gender: "other" }),
  /customer_gender/,
);
await rejects(
  () => createBooking({ ...example1, customer_email: "" }),
  /customer_email/,
);
await rejects(
  () => createBooking({ ...example1, customer_landmark: " " }),
  /customer_landmark/,
);
await rejects(
  () => createBooking({ ...example1, package_code: [] }),
  /package_code/,
);
const member = {
  customerName: "Sachin Sharma",
  customerAge: 30,
  customerGender: "male",
  packageCode: ["PL183"],
};
await rejects(
  () =>
    createBooking({
      ...example1,
      additional_member: [member, member, member, member, member],
    }),
  /At most 4/,
);
answer(created);
await createBooking({
  ...example1,
  collection_date: today,
  additional_member: [member, member, member, member],
});
assert.equal(
  lastCall().body.additional_member.length,
  4,
  "today and 4 members are allowed",
);
answer(created);
await createBooking({ ...example1, collection_date: plusDays(4) });
assert.equal(
  lastCall().body.collection_date,
  plusDays(4),
  "today + 4 is allowed",
);

// Create-booking replies that are failures in disguise.
answer({
  status: "Sucess",
  message: "No Slots are available on 2022-07-31. Try with another slot ID",
});
await assert.rejects(() => createBooking(example1), {
  name: "RedcliffeError",
  message: "No Slots are available on 2022-07-31. Try with another slot ID",
});
answer({ status: "Failed", message: "Location is non-serviceable." });
await assert.rejects(() => createBooking(example1), {
  message: "Location is non-serviceable.",
});
answer({ status: "failure", message: "Can't create more bookings today." });
await assert.rejects(() => createBooking(example1), {
  message: "Can't create more bookings today.",
});

// Confirmation (doc examples send strings; we send real types).
answer({ status: "Success", message: "Booking has been created successfully" });
await confirmBooking(20009, true);
assert.equal(
  lastCall().url.pathname,
  "/api/external/v2/center-confirm-booking/",
);
assert.deepEqual(lastCall().body, { booking_id: 20009, is_confirmed: true });
answer({
  status: "Failed",
  message: "Temporary booking id has been expired and cancelled.",
  data: [],
});
await assert.rejects(() => confirmBooking(20009, true), {
  message: "Temporary booking id has been expired and cancelled.",
});

// Update booking: the doc's two example requests, verbatim.
answer({
  booking_id: 1360273,
  booking_status: "rescheduled",
  status: "success",
  message: "Booking is rescheduled",
});
await updateBooking({
  booking_status: "rescheduled",
  booking_id: 1360273,
  remark: "rescheduled",
  collection_date: plusDays(2),
  collection_slot: 14,
});
assert.equal(
  lastCall().url.pathname,
  "/api/external/v2/center-update-booking/",
);
assert.deepEqual(lastCall().body, {
  booking_status: "rescheduled",
  booking_id: 1360273,
  remark: "rescheduled",
  collection_date: plusDays(2),
  collection_slot: 14,
});
answer({
  booking_id: 1360273,
  booking_status: "cancelled",
  status: "success",
  message: "Booking is cancelled",
});
await updateBooking({
  booking_status: "cancelled",
  booking_id: 1360273,
  remark: "Will not be available on scheduled date",
});
assert.deepEqual(lastCall().body, {
  booking_status: "cancelled",
  booking_id: 1360273,
  remark: "Will not be available on scheduled date",
});
answer({ error: "Can't change booking at this stage" });
await assert.rejects(
  () =>
    updateBooking({
      booking_status: "cancelled",
      booking_id: 1360273,
      remark: "x",
    }),
  { message: "Can't change booking at this stage" },
);
answer({ booking_id: ["A valid integer is required."] });
await assert.rejects(
  () =>
    updateBooking({
      booking_status: "cancelled",
      booking_id: 1360273,
      remark: "x",
    }),
  { message: "booking_id: A valid integer is required." },
);
await rejects(
  () =>
    updateBooking({
      booking_status: "rescheduled",
      booking_id: 1360273,
      remark: "x",
      collection_date: plusDays(9),
      collection_slot: 14,
    }),
  /collection_date/,
);

// Location: query names, padded eloc, serviceability as an answer.
answer({
  results: [
    {
      eloc: "xijidj        ",
      placeName: "PMO Apartment",
      placeAddress: "Block C, Sector 62, Noida",
      address: { pincode: "201309" },
    },
  ],
});
assert.equal((await searchLocations("Sector 62"))[0].eloc, "xijidj");
assert.equal(
  lastCall().url.href,
  "https://apiqa.example.test/api/partner/v2/get-partner-location-2-eloc/?place_query=Sector+62",
);
answer({ status: "failure", message: "No record(s) found", data: [] });
assert.deepEqual(await searchLocations("nowhere"), []);
answer({ latitude: 28.6111, longitude: 77.3689 });
assert.deepEqual(await getCoordinatesForEloc("xijidj        "), {
  latitude: 28.6111,
  longitude: 77.3689,
});
assert.equal(lastCall().url.search, "?eloc=xijidj");
answer({ latitude: "", longitude: "" });
await assert.rejects(() => getCoordinatesForEloc("abcdef"), {
  message: "eloc is not valid",
});
answer({ status: "success", message: "Location is serviceable" });
assert.deepEqual(await checkServiceability(28.6111, 77.3689), {
  serviceable: true,
  message: "Location is serviceable",
});
assert.equal(
  lastCall().url.href,
  "https://apiqa.example.test/api/center/v2/is-location-serviceable/?longitude=77.3689&latitude=28.6111",
);
answer({ status: "failure", message: "Location is non-serviceable" });
assert.deepEqual(await checkServiceability(28.6111, 77.3689), {
  serviceable: false,
  message: "Location is non-serviceable",
});

// Slots: the list is "results" in one example and "data" in another.
answer({
  status: "success",
  message: "2 Slots",
  results: [{ id: 27, available_slot: 2 }],
});
assert.equal((await listTimeSlots(today, 28.6111, 77.3689))[0].id, 27);
assert.equal(
  lastCall().url.href,
  `https://apiqa.example.test/api/booking/v2/get-time-slot-list/?collection_date=${today}&latitude=28.6111&longitude=77.3689`,
);
answer({ status: "success", message: "No Slots are available", data: [] });
assert.deepEqual(await listTimeSlots(today, 28.6111, 77.3689), []);
answer({
  status: "Failed",
  message: "collection_date must be in format of YYYY-MM-DD",
});
await assert.rejects(() => listTimeSlots(today, 28.6111, 77.3689), {
  message: "collection_date must be in format of YYYY-MM-DD",
});

// Get booking: filters by Redcliffe's names; never without a filter.
answer({ status: "Success", data: [{ booking_id: 230009 }] });
await getBookings({ booking_id: 230009 });
assert.equal(
  lastCall().url.href,
  "https://apiqa.example.test/api/external/v2/center-get-booking?booking_id=230009",
);
answer({ status: "Success", data: [] });
await getBookings({ client_ref_id: "LB1042", collection_date: today });
assert.equal(
  lastCall().url.search,
  `?client_ref_id=LB1042&collection_date=${today}`,
);
await rejects(() => getBookings({}), /at least one filter/);

// Status, tracking and reports: paths and each endpoint's failure shape.
answer({ status: "error", message: "Booking is not synced yet." });
await assert.rejects(() => getBookingTestStatus(13689135), {
  message: "Booking is not synced yet.",
});
assert.equal(
  lastCall().url.href,
  "https://apiqa.example.test/api/external/v2/booking-test-status/?booking_id=13689135",
);
answer({ status: false, message: "Invalid or missing booking ID" });
await assert.rejects(() => getPhleboTracking(14311098), {
  message: "Invalid or missing booking ID",
});
assert.equal(
  lastCall().url.pathname,
  "/api/external/v2/corporate-phlebo-tracking/",
);
answer({ id: 6429155, Report_url: "https://report.example.test/a.pdf" });
assert.equal(
  (await getConsolidatedReport(6429155)).Report_url,
  "https://report.example.test/a.pdf",
);
assert.equal(
  lastCall().url.pathname,
  "/api/external/v2/get-consolidated-report/6429155",
);
answer({ errors: ["Dont have a matching booking"] });
await assert.rejects(() => getDigitalReport(1), {
  message: "Dont have a matching booking",
});
assert.equal(lastCall().url.pathname, "/api/external/v2/get-digital-report/1");

// No config: a clear error, nothing sent.
delete process.env.REDCLIFFE_API_KEY;
await rejects(() => getDigitalReport(1), /REDCLIFFE_API_KEY/);

process.stdout.write("redcliffeClient: all checks passed\n");

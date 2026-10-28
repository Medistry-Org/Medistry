# Home blood tests through Redcliffe Labs

Backend contract for `/dashboard/lab-tests`, `/dashboard/lab-tests/book`, `/dashboard/lab-tests/[bookingId]`
and the lab plans on `/pricing`. Frontend: `src/services/labTestService.ts`, `src/types/labTest.ts`.

**The browser never calls Redcliffe.** Redcliffe authenticates every call with a secret `key` header,
so only the Medistry backend talks to it. The app calls the Medistry endpoints below. None of them
exist yet; until they do, the screens show "not available yet".

## 1. The whole flow on one screen

```
PATIENT (app)                      MEDISTRY BACKEND                         REDCLIFFE (header key: REDCLIFFE_API_KEY)     STORED
--------------------------------   --------------------------------------   -------------------------------------------   ---------------------------------
1 Choose a test                    GET  /api/labs/packages                  GET center-package-data/?search=  (all pages)  cache 1 h; plan credits read
  (what is tested, on review)      GET  /api/labs/packages/:code            GET package-parameter-data/?code=              cache 24 h
2 Address: saved list              GET  /api/address/my-addresses (exists)  -                                              -
  tap a saved address              GET  /api/labs/serviceability?lat&lng    GET is-location-serviceable/?latitude&longitude -
  or add one: search area          GET  /api/labs/locations/search?query=   GET get-partner-location-2-eloc/?place_query=  -
  pick a place                     GET  /api/labs/locations/:eloc           GET get-partner-loc-2-eloc/?eloc=              -
                                   GET  /api/labs/serviceability?lat&lng    GET is-location-serviceable/                   -
  save it                          POST /api/address/add (exists)           -                                              address + latitude/longitude
3 Who is tested                    (app only; prefilled from profile)       -                                              -
4 Day (next 4 days) and time       GET  /api/labs/slots?date&addressId      GET get-time-slot-list/?collection_date&lat&lng -
5 Review -> "Continue to payment"  POST /api/labs/bookings                  POST center-create-booking/ (is_credit true)    lab_bookings row PAYMENT_PENDING,
                                                                            slot locked 30 min                              partner id, price, hold_expires_at
  "Pay Rs X and book" -> /dashboard/checkout?purpose=LAB_BOOKING&referenceId=<bookingId>&returnTo=/dashboard/lab-tests/<bookingId>
                                   POST /api/payments/orders                -  (amount = lab_bookings.total)               payment order
                                   POST /api/payments/verify                POST center-confirm-booking/ is_confirmed true status BOOKED
  (covered by a paid lab plan: step 5 confirms at once, no checkout)        POST center-confirm-booking/ is_confirmed true status BOOKED, credit used
6 Track                            GET  /api/labs/bookings, /:id            GET center-get-booking?booking_id=             refreshed status, collector
                                                                            GET corporate-phlebo-tracking/?booking_id=     tracking_url
                                                                            GET booking-test-status/?booking_id=           per-test status
  Change time / Cancel (Sheets)    POST /api/labs/bookings/:id/reschedule   POST center-update-booking/ rescheduled        slot, reschedule_count + 1
                                   POST /api/labs/bookings/:id/cancel       POST center-update-booking/ cancelled          status CANCELLED
  Download report                  GET  /api/labs/bookings/:id/report       GET get-consolidated-report/{booking_id}       report_url
Redcliffe pushes progress          POST /api/webhooks/redcliffe             (Redcliffe calls Medistry)                     status, collector, report
```

## 2. Configuration (backend only)

| Env var                     | What                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `REDCLIFFE_API_KEY`         | Sent as the `key` header on every Redcliffe call. Never in the frontend, logs or Git.       |
| `REDCLIFFE_BASE_URL`        | `https://api.redcliffelabs.com` in production. Staging host from Redcliffe onboarding (their examples show `apiqa.redcliffelabs.com` / `apidev.redcliffelabs.com`). |
| `REDCLIFFE_WEBHOOK_SECRET`  | The value Redcliffe sends in the webhook auth header (section 6).                          |

Every Redcliffe call also sends `Content-Type: application/json`. Note: the package APIs
(`center-package-data`, `package-parameter-data`) work on production only, per Redcliffe.

## 3. Shared rules

- Every endpoint needs the patient's `Authorization: Bearer <token>`. A booking or address that is not
  the caller's answers 404.
- Answers use the usual envelope `{ success, message, data }`. On failure, `message` is the sentence
  the app shows as is, and `code` names the case (section 5).
- Money is in rupees in these responses (the payment order uses paise, per the payments contract).
- Dates are `YYYY-MM-DD`, times `HH:mm`, both India time (IST).

## 4. Endpoints

### 4.1 GET /api/labs/packages

Screen: book, step 1. Redcliffe: `GET {BASE}/api/external/v2/center-package-data/?search=` following
`links.next` until null (20 a page). Show only the codes Medistry has enabled (an allow-list table the
care team controls, e.g. `lab_packages_enabled(code)`), not all 200+.

| Medistry field | Redcliffe field |
| --- | --- |
| `code` | `code` |
| `name` | `name` |
| `description` | `description` |
| `testCount` | `parameters` |
| `fastingNote` | `fasting_time` (`""` when none) |
| `reportTime` | `tat_time` |
| `forGender` | `recommended_gender` (`Both`, `Male`, `Female`) |
| `ageRange` | `recommended_age` `"5-99"` -> `{ "min": 5, "max": 99 }`, `null` if absent |
| `price` | `package_center_prices.offer_price` |
| `listPrice` | `package_center_prices.package_price` |
| `coveredByPlan` | Medistry: the patient has an unused lab-plan credit for this code (section 7) |

```json
{
  "success": true,
  "data": [
    {
      "code": "CAMP671",
      "name": "Smart Full Body Checkup",
      "description": "Full Body Checkup comprises 85 vital parameters.",
      "testCount": 85,
      "fastingNote": "8-10 Hrs Fasting Required",
      "reportTime": "Within 24-48 hrs.",
      "forGender": "Both",
      "ageRange": { "min": 5, "max": 99 },
      "price": 1499,
      "listPrice": 2999,
      "coveredByPlan": false
    }
  ]
}
```

### 4.2 GET /api/labs/packages/:code

Screen: book, review step, "What is tested". Redcliffe: `GET package-parameter-data/?code={code}`.
`groups[].name` <- `data[].name`, `groups[].tests` <- `data[].package_detail[].name`.
`"Invalid package code"` -> 404.

```json
{ "success": true, "data": { "code": "CAMP671", "name": "Smart Full Body Checkup", "groups": [{ "name": "Lipid Profile", "tests": ["Triglycerides, Serum", "LDL Cholesterol -Direct"] }] } }
```

### 4.3 GET /api/labs/locations/search?query=

Screen: book, step 2, "Search your area" (called after 3 letters, 350 ms after typing stops).
Redcliffe: `GET get-partner-location-2-eloc/?place_query={query}`. Map each of `results[]`:
`eloc` <- `eloc` **trimmed** (Redcliffe pads it with spaces), `name` <- `placeName`,
`address` <- `placeAddress`, `city`/`state`/`pincode` <- `address.city`/`address.state`/`address.pincode`.
`"No record(s) found"` -> `200` with `data: []`.

```json
{ "success": true, "data": [{ "eloc": "XIJIDJ", "name": "PMO Apartment", "address": "Block C, Sector 62, Noida, Uttar Pradesh, 201309", "city": "Noida", "state": "Uttar Pradesh", "pincode": "201309" }] }
```

### 4.4 GET /api/labs/locations/:eloc

Screen: book, step 2, after picking a place. Redcliffe: `GET get-partner-loc-2-eloc/?eloc={eloc}`.
Empty `latitude`/`longitude` or `"eloc is not valid"` -> 422 `PLACE_NOT_FOUND`.

```json
{ "success": true, "data": { "latitude": 28.6111, "longitude": 77.3689 } }
```

### 4.5 GET /api/labs/serviceability?latitude=&longitude=

Screen: book, step 2: on tapping a saved address, and after picking a new place (before it is saved).
Redcliffe: `GET {BASE}/api/center/v2/is-location-serviceable/?longitude={lng}&latitude={lat}`.
`status: "success"` -> `serviceable: true`; `"Location is non-serviceable"` -> `serviceable: false` (still
200: it is an answer, not an error); `"We cannot fetch latitude and longitude..."` -> 422 `PLACE_NOT_FOUND`.

```json
{ "success": true, "data": { "serviceable": false, "message": "Location is non-serviceable" } }
```

Addresses are saved with the existing `POST /api/address/add`, now with real `latitude`/`longitude`
from 4.4 and `landmark` (Redcliffe requires one). Addresses saved by the old lab page carry its
hard-coded coordinates (28.5355, 77.391); the backend should null those so the app asks for a fresh search.

### 4.6 GET /api/labs/slots?date=YYYY-MM-DD&addressId=

Screen: book, step 4, and the "Change time" sheet. Keeps the team's path and grouping.
Redcliffe: `GET {BASE}/api/booking/v2/get-time-slot-list/?collection_date={date}&latitude={address.Latitude}&longitude={address.Longitude}`.
Coordinates come from the saved address, never from the browser. The app shows today plus the next
collection days, 4 in all (Redcliffe: within the next 4 days).

Group by `format_24_hrs.start_time`: before 12:00 morning, 12:00 to 16:59 afternoon, from 17:00 evening
(the app's chooser uses the same cut). `slotId` <- `id`, `startTime`/`endTime` <- `format_24_hrs.*`,
`available` <- `available_slot` (0 = full; the app greys it out). Redcliffe's list is under `results`
in its example and `data` in its field table: read either.
`"No Slots are available on ..."` (no slots, or beyond 4 days) -> 200 with empty groups.
`"collection_date must be future date..."` -> 422 `PAST_DATE`. `"Location is non-serviceable."` -> 422 `LOCATION_NOT_SERVICEABLE`.

```json
{
  "success": true,
  "data": {
    "morning": [{ "slotId": 4, "startTime": "07:00", "endTime": "08:00", "available": 3 }],
    "afternoon": [{ "slotId": 27, "startTime": "15:30", "endTime": "16:30", "available": 2 }],
    "evening": []
  }
}
```

### 4.7 POST /api/labs/bookings

Screen: book, review step, "Continue to payment" (or "Book the test" when a plan covers it).
Replaces the team's old `POST /api/labs/book`.

Request:

```json
{
  "packageCode": "CAMP671",
  "addressId": 12,
  "collectionDate": "2026-10-30",
  "slotId": "4",
  "patient": { "name": "Riya Sharma", "age": 41, "gender": "Female", "mobile": "9876543210", "email": "riya@example.com" }
}
```

Steps:

1. Validate: the address is the caller's and has coordinates; the package is enabled; the date is today
   to today + 4.
2. If the patient already has a `PAYMENT_PENDING` booking, release it first:
   `POST center-confirm-booking/ { "booking_id": <its partner id>, "is_confirmed": false }`, mark it
   `EXPIRED`. (The patient changed a choice and pressed Continue again; Redcliffe also allows only one
   booking per number per day, so the old hold must go.)
3. Insert the `lab_bookings` row (status `PAYMENT_PENDING`) to get the Medistry id.
4. `POST {BASE}/api/external/v2/center-create-booking/`:

| Redcliffe field | From |
| --- | --- |
| `booking_date` | today, IST |
| `collection_date` | `collectionDate` |
| `collection_slot` | `Number(slotId)` |
| `package_code` | `[packageCode]` |
| `customer_name` | `patient.name` (letters, 3 to 30; the app checks) |
| `customer_age` | `patient.age` |
| `customer_gender` | `patient.gender` lower-cased (`male` / `female`) |
| `customer_phonenumber`, `customer_altphonenumber` | `patient.mobile` (the app checks 10 digits starting 6 to 9) |
| `customer_whatsapppnumber` and `customer_whatsappnumber` | `patient.mobile` (Redcliffe's table and examples spell it differently; send both until they confirm) |
| `customer_email` | `patient.email` |
| `customer_address` | address `AddressLine` (house, street and the searched place) |
| `address_line2` | `City, State` |
| `customer_landmark` | address `Landmark` |
| `pincode` | address `Pincode` |
| `customer_latitude`, `customer_longitude` | address `Latitude`, `Longitude` |
| `is_credit` | `true` (Medistry collects the payment, Redcliffe does not collect cash) |
| `reference_data`, `client_refid` | the Medistry booking id (webhooks and `center-get-booking?client_ref_id=` find it by this) |
| `booking_type` | `"Homedx"` |
| `customer_type` | `"normal"` |
| `additional_member` | `[]` |

5. Store from the response: `partner_booking_id` <- `booking_id`; `package_name` <- `packages[0].name`;
   prices from `discounted_price` (below); `hold_expires_at` <- now + 30 minutes ("The slot will be locked
   for next 30 mins").
6. If the package is covered by a lab-plan credit (section 7): call `center-confirm-booking`
   `{ booking_id, is_confirmed: true }` now, use the credit, set `BOOKED`, `paymentRequired: false`.
   Otherwise answer with `PAYMENT_PENDING` and the app shows the hold and "Pay".

Price mapping: `packagePrice` <- `discounted_price.total_price_package`; `discount` <-
`counpon_discount + referral_coupon_discount + subscription_discount_amount`; `collectionCharge` <-
`phlebo_cost + hard_copy_cost`; `total` <- `final_total_price` (the amount the payment order charges).

Response (the `LabBooking` shape; every booking endpoint answers with it):

```json
{
  "success": true,
  "data": {
    "id": "LB1042",
    "partnerBookingId": "1354195",
    "status": "PAYMENT_PENDING",
    "packageCode": "CAMP671",
    "packageName": "Smart Full Body Checkup",
    "fastingNote": "8-10 Hrs Fasting Required",
    "collectionStartsAt": "2026-10-30T07:00:00+05:30",
    "collectionEndsAt": "2026-10-30T08:00:00+05:30",
    "addressId": 12,
    "address": "Flat 402, Tower B, Block C, Sector 62, Noida, Uttar Pradesh, 201309",
    "patient": { "name": "Riya Sharma", "age": 41, "gender": "Female" },
    "price": { "packagePrice": 1499, "discount": 0, "collectionCharge": 0, "total": 1499 },
    "paymentRequired": true,
    "holdExpiresAt": "2026-10-28T16:32:00+05:30",
    "reschedulesLeft": 2,
    "canReschedule": false,
    "canCancel": false,
    "collector": null,
    "tests": []
  }
}
```

### 4.8 Payment, then confirmation (payments contract)

The app sends the patient to
`/dashboard/checkout?purpose=LAB_BOOKING&referenceId=<id>&returnTo=/dashboard/lab-tests/<id>`.

- `POST /api/payments/orders { purpose: "LAB_BOOKING", referenceId }`: amount = `lab_bookings.total`
  (never from the browser). Refuse with 409 `HOLD_EXPIRED` if the booking is not `PAYMENT_PENDING` or
  `hold_expires_at` is less than 2 minutes away. Line items: package (`packagePrice`), discount, home collection.
- `POST /api/payments/verify`: after the Razorpay signature checks out, call
  `POST center-confirm-booking/ { "booking_id": <partner id>, "is_confirmed": true }`.
  - `"Booking has been created successfully"` -> status `BOOKED`.
  - `"Temporary booking id has been expired and cancelled."` (the patient paid after 30 minutes): try
    `center-create-booking` again with the same slot, then confirm it; if that fails, mark `EXPIRED`,
    refund the payment in full, and answer `{ status: "PAID" }` anyway so the app returns to the booking
    page, which then says the hold ended. Do not leave a paid booking without a Redcliffe booking.
- Unpaid holds: a booking still `PAYMENT_PENDING` after `hold_expires_at` becomes `EXPIRED` (a job every
  few minutes, or when read).

### 4.9 GET /api/labs/bookings

Screen: `/dashboard/lab-tests`. The caller's bookings from the database (no Redcliffe call), newest
first, `LabBooking[]`. The app shows `PAYMENT_PENDING` to `PROCESSING` as "under way", the rest as
"Earlier tests".

### 4.10 GET /api/labs/bookings/:id

Screen: `/dashboard/lab-tests/[bookingId]`. Webhooks keep the row current (section 6); this read also
refreshes a booking that is `BOOKED` to `PROCESSING` (at most once a minute) so a missed webhook heals:

- `GET center-get-booking?booking_id={partner id}` -> `booking_status.value`, `collection_date`,
  `collection_time.slot_24_hrs`, `phlebo_detail.name` / `.contact` -> `collector.name` / `.phone`.
- When a collector is assigned: `GET {BASE}/api/external/v2/corporate-phlebo-tracking/?booking_id={partner id}`
  -> `collector.trackingUrl` <- `data.tracking_link` (the app opens it in a new tab).
- From `SAMPLE_COLLECTED` on: `GET booking-test-status/?booking_id={partner id}` -> `tests[]`:
  `pending_tests` -> `PENDING`, `completed_tests` -> `COMPLETED`, `rejected_tests` -> `REJECTED`,
  `dismissed_tests` -> `DISMISSED`. `name` from the test names in `center-get-booking`'s `report[].test[]`
  when present, else the code. `"Booking is not synced yet."` -> `tests: []`.
- `reschedulesLeft` = 2 - `reschedule_count`; `canReschedule` = status `BOOKED` and `reschedulesLeft > 0`;
  `canCancel` = status `BOOKED` (Redcliffe refuses both once a collector is assigned).

### 4.11 POST /api/labs/bookings/:id/reschedule

Screen: booking page, "Change time" sheet (the same slot chooser). Body `{ "collectionDate": "2026-10-31", "slotId": "14" }`.
Check `canReschedule` first (409 `RESCHEDULE_LIMIT` / `CHANGE_NOT_ALLOWED`). Redcliffe:
`POST center-update-booking/ { "booking_id": <partner id>, "booking_status": "rescheduled", "remarks": "Rescheduled by patient", "collection_date": collectionDate, "collection_slot": Number(slotId) }`
(send `remark` too: Redcliffe's table says `remarks`, its example says `remark`). On success: new
date and slot, `reschedule_count + 1`. Answers the updated `LabBooking`.

### 4.12 POST /api/labs/bookings/:id/cancel

Screen: booking page, "Cancel this test" sheet. Body `{ "reason": "I will be away" }` (may be empty).
Redcliffe: `POST center-update-booking/ { "booking_id": <partner id>, "booking_status": "cancelled", "remarks": reason || "Cancelled by patient" }`.
Status `CANCELLED`; refund per Medistry's policy (Redcliffe says cancellation of a confirmed booking is
chargeable). Answers the updated `LabBooking`. Redcliffe recommends an OTP step before reschedule and
cancel; the signed-in session is the check for now (decision for the team).

### 4.13 GET /api/labs/bookings/:id/report

Screen: booking page "Download report", and lab rows on `/dashboard/reports`. Redcliffe:
`GET get-consolidated-report/{partner id}` -> `{ "url": Report_url }` (the key is spelled `Report_url`).
Asked on each tap because the link can expire. `"Dont have a matching booking"` or no report yet -> 404.

```json
{ "success": true, "data": { "url": "https://report.redcliffelabs.com/....pdf" } }
```

## 5. Redcliffe answers and what the app shows

Redcliffe often answers HTTP 200 with `status: "failure"`/`"Failed"`; read `status` and `message`.

| Redcliffe message (call) | HTTP, `code` | `message` the app shows |
| --- | --- | --- |
| `Location is non-serviceable` (slots, create) | 422 `LOCATION_NOT_SERVICEABLE` | Our partner lab does not collect at this address yet. Try another address. |
| `No Slots are available ... Try with another slot ID` (create), `selected slot is not available` (reschedule) | 409 `SLOT_UNAVAILABLE` | That time has just filled up. Choose another time. |
| `Past date entered`, `collection_date must be future date...` | 422 `PAST_DATE` | That time has passed. Choose another time. |
| `Package not valid`, `Cannot book ... for Home-Collection` | 422 `PACKAGE_UNAVAILABLE` | This test cannot be booked for home collection right now. Choose another test. |
| `...'s age is not recommended for this package` | 422 `AGE_NOT_SUITABLE` | This test is not suitable for this age. Choose another test. |
| `... test is only for female/male` | 422 `GENDER_NOT_SUITABLE` | This test is not suitable for this person. Choose another test. |
| `Please enter a valid phone number` | 422 `INVALID_MOBILE` | Enter a 10-digit Indian mobile number. |
| `Can't create more bookings today.` | 409 `DAILY_LIMIT` | The lab takes one booking per mobile number a day. Use another number or choose another day. |
| `Temporary booking id has been expired and cancelled.` (confirm) | see 4.8 | The 30-minute hold ended before payment. |
| `Can't change booking at this stage`, `...as Phlebo has been assigned` | 409 `CHANGE_NOT_ALLOWED` | The time cannot be changed once a collector is assigned. |
| more than 2 reschedules (Medistry check) | 409 `RESCHEDULE_LIMIT` | This test has been moved twice, the most the lab allows. |
| anything else, or Redcliffe unreachable | 502 `LAB_UNAVAILABLE` | The lab cannot be reached right now. Please try again. (Log Redcliffe's message, never the key.) |

The app also checks before the time step: the package's age range and gender, the name (letters, 3 to
30), the mobile and the email, so most of these never reach Redcliffe.

## 6. Webhook: POST /api/webhooks/redcliffe

Register once per environment with `POST {BASE}/api/v1/webhook/create-update-webhook/`:

```json
{
  "url_link": "https://<backend>/api/webhooks/redcliffe",
  "hook_type_list": ["booking_created", "phleboassigned", "phlebo_started_journey", "phlebo_end_journey", "pickup", "pickup_hold", "resample", "samplesync", "partialreport", "consolidatereport", "reportvalues", "rescheduled", "cancelled"],
  "auth_key": "x-redcliffe-secret",
  "auth_value": "<REDCLIFFE_WEBHOOK_SECRET>"
}
```

Check with `GET /api/v1/webhook/list-added-webhooks/`; on staging, fire test events with
`POST /api/v1/webhook/mock-b2b-webhook/ { booking_id, webhook_type }` in order phleboassigned, pickup,
samplesync, consolidatereport, reportvalues.

The handler: reject a wrong `x-redcliffe-secret` (401); find the booking by `data.client_refid`, else by
`data.booking_id` (partner id); store the raw body in `lab_booking_events`; apply the change below;
answer 200 quickly. Events can repeat or arrive late: never move a booking backwards.

Payload shape: `{ "webhook_type": "pickup", "data": { "booking_id": 18919204, "type": "status_updated", "client_refid": "LB1042", "data": { ... } } }`

| `webhook_type` | Medistry change |
| --- | --- |
| `booking_created` | none (already stored) |
| `phleboassigned` | `COLLECTOR_ASSIGNED`; collector name and phone (from the payload, else `center-get-booking`); reschedule and cancel now blocked |
| `phlebo_started_journey`, `phlebo_end_journey` | stays `COLLECTOR_ASSIGNED`; refresh `tracking_url` from `corporate-phlebo-tracking` |
| `pickup` | `SAMPLE_COLLECTED` |
| `pickup_hold` | no status change; keep the reason for the care team |
| `resample` | back to `BOOKED` (a new collection is needed); tell the patient |
| `samplesync`, `partialreport` | `PROCESSING` |
| `consolidatereport` | `REPORT_READY`; store the PDF link; add a `reports` row (`source: LAB_BOOKING`, section in reports.md) |
| `reportvalues` | store the JSON values for the doctor's view |
| `rescheduled` | update date and slot |
| `cancelled` | `CANCELLED` |

## 7. Lab plans from /pricing

`/pricing` keeps the founders' two plans (`plan-lab-basic` Rs 999, `plan-lab-doctor-combo` Rs 1,799).
"Choose Plan & Proceed" goes to
`/dashboard/checkout?purpose=PLAN&referenceId=<plan id>&returnTo=/dashboard/lab-tests/book`.

**Decision needed:** the payments contract's `PLAN` purpose activates a subscription. These two ids
are lab plans, so the backend must recognise them: price them from its own table (999 / 1799), and on
payment create a lab-plan credit `lab_plan_credits(patient_id, plan_id, package_codes, used_at)` naming
the Redcliffe package code(s) each plan covers (to be chosen with Redcliffe; the combo also covers one
doctor consultation). `GET /api/labs/packages` then marks those packages `coveredByPlan: true`, and
`POST /api/labs/bookings` confirms them without a second payment (4.7 step 6). If the team prefers a
separate purpose (e.g. `LAB_PLAN`), change the one line in `src/app/pricing/page.tsx`.

The "Yes, I have a Report" path on `/pricing` uploads the report (see reports.md) and then goes to
`/dashboard/appointments/book`, where the doctor is chosen and the consultation fee is paid
(`CONSULTATION_FEE` takes the doctor's id, so it cannot be paid before a doctor is chosen).

## 8. Tables (suggested)

- `lab_bookings`: id, patient_id, partner_booking_id, status, package_code, package_name, fasting_note,
  address_id, address_text, collection_date, slot_id, slot_start, slot_end, patient_name, patient_age,
  patient_gender, patient_mobile, patient_email, package_price, discount, collection_charge, total,
  payment_required, hold_expires_at, reschedule_count, collector_name, collector_phone, tracking_url,
  report_url, created_at, updated_at.
- `lab_booking_events`: id, lab_booking_id, webhook_type, payload (JSON), received_at.
- `lab_packages_enabled`: code (the allow-list for 4.1).
- `lab_plan_credits`: as in section 7.

Replaced team endpoints: `GET /api/labs/available-dates` (the app shows the next 4 days itself) and
`POST /api/labs/book` (now `POST /api/labs/bookings`).

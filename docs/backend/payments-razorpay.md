# Payments with Razorpay: backend contract

The frontend is built against these endpoints and already calls them. Until they exist, the
checkout page shows "Online payment is not available yet" (it treats a 404 as "not built yet") and
nothing is activated. The frontend never sends an amount and never activates a plan itself.

Frontend files: `src/services/paymentService.ts`, `src/types/payment.ts`,
`src/lib/payments/razorpayCheckout.ts`, `src/app/dashboard/checkout/`, `src/app/dashboard/plans/`.

## The flow

```
Patient                      Frontend                          Backend                         Razorpay
   | choose plan / test / fee  |                                  |                                |
   |-------------------------->| /dashboard/checkout?purpose=..&referenceId=..&returnTo=..          |
   |                           | POST /api/payments/orders ------>| validate, price it, store      |
   |                           |                                  | POST /v1/orders -------------->|
   |                           |<--- orderId, amount, line items -|<------------- order_xxx -------|
   | review, tap Pay           | Checkout.js opens with order_id ------------------------------->  |
   | pays in Razorpay window   |<------------- razorpay_payment_id, razorpay_order_id, signature --|
   |                           | POST /api/payments/verify ------>| HMAC check, mark PAID, fulfil  |
   |                           |<--------- status PAID -----------|                                |
   |<-- returnTo --------------|                                  |<-- webhook payment.captured ---|
```

The webhook is the safety net: if the browser closes after paying but before `/verify`, the
webhook still marks the order paid and fulfils it. Fulfilment is idempotent, so whichever of
`/verify` and the webhook arrives second does nothing.

## Environment variables (backend)

| Name                      | What                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| `RAZORPAY_KEY_ID`         | Public key id, `rzp_test_...` / `rzp_live_...`. Returned to the browser in each order. |
| `RAZORPAY_KEY_SECRET`     | Secret. Basic-auth password for the Orders API and the HMAC key for `/verify`. Never sent to the browser. |
| `RAZORPAY_WEBHOOK_SECRET` | The secret set on the webhook in the Razorpay dashboard. HMAC key for `/api/webhooks/razorpay`. |

The frontend also reads `NEXT_PUBLIC_RAZORPAY_KEY_ID` (`.env.example`), used only if an order
response leaves `razorpayKeyId` empty. Prefer returning it from the backend so the key and the order
always come from the same Razorpay account.

## Suggested table: `Payments`

| Column              | Type          | Notes                                                    |
| ------------------- | ------------- | -------------------------------------------------------- |
| `PaymentId`         | int, PK       |                                                          |
| `UserId`            | int           | The signed-in patient (from the JWT, never from the body) |
| `Purpose`           | enum          | `PLAN`, `LAB_BOOKING`, `CONSULTATION_FEE`                |
| `ReferenceId`       | string        | Plan id, lab booking id or doctor id (see below)         |
| `Title`             | string        | Shown on the review screen and the invoice               |
| `LineItems`         | json          | `[{ label, amountPaise }]`                               |
| `AmountPaise`       | int           | Integer paise. The only amount Razorpay is asked for     |
| `Currency`          | string        | `INR`                                                    |
| `RazorpayOrderId`   | string, unique| `order_...`                                              |
| `RazorpayPaymentId` | string, null  | `pay_...`, set when paid                                 |
| `Status`            | enum          | `CREATED`, `PAID`, `FAILED`                              |
| `FailureReason`     | string, null  | From `payment.failed`                                    |
| `FulfilledAt`       | datetime, null| Set once fulfilment has run (the idempotency guard)      |
| `InvoiceNumber`     | string, null  | Assigned when paid, e.g. `MED-2026-000123`               |
| `InvoiceUrl`        | string, null  | PDF, when invoices are generated                         |
| `CreatedAt`, `PaidAt` | datetime    |                                                          |

All endpoints answer the usual `{ success, message, data }`. Errors use `success: false` with a
`message` a patient can read; the frontend shows `message` as is.

**Do not answer 404 for a missing plan, booking or doctor.** The frontend reads 404 as "this
endpoint is not built yet". Use 400 (or 422) with a message instead.

---

## POST /api/payments/orders

Creates (or reuses) a Razorpay order for something the patient wants to pay for.

- Auth: `Authorization: Bearer <access token>`, role PATIENT.
- Used by: `/dashboard/checkout` on load (review screen).

Request:

```json
{ "purpose": "PLAN", "referenceId": "3" }
```

Steps:

1. Validate `purpose` is one of `PLAN`, `LAB_BOOKING`, `CONSULTATION_FEE` and `referenceId` is
   present. Otherwise 400.
2. Work out the amount on the server from the reference. Never from the request.

   | purpose            | referenceId                       | Amount and checks                                                                                   |
   | ------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------- |
   | `PLAN`             | `SubscriptionPlans.PlanId`        | `Price * 100`. 400 if the plan is missing, `IsActive` is false, or `Price` is null or 0. 409 if the user already has an active plan. |
   | `LAB_BOOKING`      | Medistry lab booking id (from `POST /api/labs/bookings`) | The booking's stored total (Redcliffe package price, plus any collection charge), in paise. 400 if the booking is not the user's, is cancelled, or the 30-minute slot hold has expired. 409 if already paid. |
   | `CONSULTATION_FEE` | `Doctors.Id` of the doctor the fee is for | The doctor's `ConsultationFee * 100`. 400 if the doctor is missing or has no fee. 409 if this user has already paid this fee. |

3. If this user already has a `CREATED` order for the same `purpose` + `referenceId` and the same
   amount, return it instead of creating a new one (the review page can load more than once).
4. Otherwise create the Razorpay order with the Orders API:

   ```
   POST https://api.razorpay.com/v1/orders
   Authorization: Basic base64(RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET)
   Content-Type: application/json

   {
     "amount": 1799900,
     "currency": "INR",
     "receipt": "pay_418",
     "notes": { "userId": "57", "purpose": "PLAN", "referenceId": "3" }
   }
   ```

   (`receipt` is your own id, at most 40 characters; payments are captured automatically for
   orders created this way on current Razorpay accounts. Check "Payment capture" in the dashboard
   is set to automatic.)
5. Store the row with `Status = CREATED` and return:

```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "orderId": "order_PbX9q2mN7c1Ztr",
    "amountPaise": 1799900,
    "currency": "INR",
    "razorpayKeyId": "rzp_test_1DP5mmOlF5G5ag",
    "title": "Complete programme, 4 months",
    "lineItems": [
      { "label": "Complete programme, 4 months", "amountPaise": 1799900 }
    ]
  }
}
```

`lineItems` are what the review screen lists; `amountPaise` is the total it shows and the amount
Razorpay charges. Make sure the line items add up to the total: the frontend never adds them up.
For a lab booking, list each test package and any collection charge as separate lines.

Errors:

```json
{ "success": false, "message": "This plan is not available any more." }
```

---

## POST /api/payments/verify

Called by the browser right after Razorpay's success callback.

- Auth: Bearer, role PATIENT. The order must belong to the signed-in user.
- Used by: `/dashboard/checkout`. If this call fails, the page keeps the Razorpay result and offers
  "Confirm payment", which calls it again with the same body (never a second payment).

Request (field names as the frontend sends them):

```json
{
  "orderId": "order_PbX9q2mN7c1Ztr",
  "razorpayPaymentId": "pay_PbXA4kHcC1oQ2n",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

Steps:

1. Load the stored order by `orderId` for this user. Unknown: 400.
2. Compute `expected = HMAC_SHA256(key = RAZORPAY_KEY_SECRET, message = orderId + "|" + razorpayPaymentId)`
   as lowercase hex, using the **stored** order id. Compare with `razorpaySignature` using a
   constant-time comparison. Mismatch: 400 `"Payment could not be verified."`, and do not mark
   anything paid.
3. Optional but recommended: `GET https://api.razorpay.com/v1/payments/{razorpayPaymentId}` and
   check `order_id` matches, `amount` equals the stored `AmountPaise`, and `status` is `captured`
   (or `authorized` if you capture manually).
4. In one transaction: set `Status = PAID`, `RazorpayPaymentId`, `PaidAt`, `InvoiceNumber`, then run
   fulfilment (below) if `FulfilledAt` is null, and set `FulfilledAt`.
5. If the order is already `PAID` (the webhook got there first), skip straight to the response.

Response:

```json
{
  "success": true,
  "message": "Payment verified",
  "data": { "status": "PAID", "purpose": "PLAN", "referenceId": "3" }
}
```

Node example for step 2:

```js
const crypto = require("crypto");
const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${order.RazorpayOrderId}|${razorpayPaymentId}`).digest("hex");
const ok = expected.length === razorpaySignature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
```

### Fulfilment (shared by /verify and the webhook)

One function, `fulfilPayment(payment)`, guarded by `FulfilledAt` so it runs once:

- `PLAN`: run the existing subscription activation logic (what `POST /api/subscriptions/activate`
  does today with `{ targetUserId, planId }`), with `targetUserId = payment.UserId` and
  `planId = ReferenceId`. After this ships, restrict the public `POST /api/subscriptions/activate`
  route to staff/admin use, so a plan can only be started by a verified payment.
- `LAB_BOOKING`: confirm the held slot with Redcliffe `center-confirm-booking` using the booking's
  Redcliffe booking id and `"is_confirmed": true`, then mark the Medistry booking confirmed and
  paid. If Redcliffe refuses (the hold expired), keep the payment `PAID`, flag the booking for the
  care team and refund through `POST /v1/payments/{id}/refund`; do not silently drop it.
- `CONSULTATION_FEE`: record that this user has paid this doctor's consultation fee (for example a
  `ConsultationFeePaid` row with `UserId`, `DoctorId`, `PaymentId`), which slot booking then checks.

---

## POST /api/webhooks/razorpay

Set up in the Razorpay dashboard (Settings, Webhooks) with the URL
`https://<backend>/api/webhooks/razorpay`, the secret `RAZORPAY_WEBHOOK_SECRET`, and the events
`payment.captured` and `payment.failed`.

- Auth: none (Razorpay calls it). Trust comes only from the signature.
- Read the **raw** request body (before JSON parsing). Compute
  `HMAC_SHA256(key = RAZORPAY_WEBHOOK_SECRET, message = rawBody)` as hex and compare it, in constant
  time, with the `X-Razorpay-Signature` header. Mismatch: 400 and stop.
- Idempotent: Razorpay retries and can deliver an event more than once. Store the
  `X-Razorpay-Event-Id` header and ignore an id already seen; the `FulfilledAt` guard covers the rest.
- Answer 200 quickly (within a few seconds); do slow work after responding or in a job.

Example body (trimmed):

```json
{
  "entity": "event",
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_PbXA4kHcC1oQ2n",
        "order_id": "order_PbX9q2mN7c1Ztr",
        "amount": 1799900,
        "currency": "INR",
        "status": "captured",
        "error_description": null
      }
    }
  },
  "created_at": 1793174400
}
```

Handling:

- `payment.captured`: find the order by `order_id`; check `amount` equals `AmountPaise`; mark
  `PAID` and run `fulfilPayment` exactly as `/verify` does.
- `payment.failed`: if the order is still `CREATED`, store `error_description` in `FailureReason`.
  Do not set `FAILED` on the order itself: the patient may try again in the same window and succeed
  with the same order.

Response: `200` with `{ "success": true }`.

---

## GET /api/payments

The signed-in patient's paid orders, newest first: the "Invoices" list on `/dashboard/plans`
(Arhaan's Plan and payments panel shows invoices). Until it exists the list says "Invoices are not
available yet."

- Auth: Bearer, role PATIENT.

```json
{
  "success": true,
  "message": "Payments",
  "data": [
    {
      "id": "418",
      "purpose": "PLAN",
      "title": "Complete programme, 4 months",
      "amountPaise": 1799900,
      "paidAt": "2026-10-28T09:41:12.000Z",
      "invoiceNumber": "MED-2026-000123",
      "invoiceUrl": "https://files.medistry.in/invoices/MED-2026-000123.pdf"
    }
  ]
}
```

`invoiceUrl` may be null; the View button only appears when it is set. Only `PAID` rows are
listed.

## Who calls what

| Screen                         | Endpoint                         | Status        |
| ------------------------------ | -------------------------------- | ------------- |
| `/dashboard/plans`             | `GET /api/subscriptions/plans`   | exists        |
| `/dashboard/plans`             | `GET /api/subscriptions/status`  | in `subscriptionService`; a 404 is read as "no plan" |
| `/dashboard/plans`             | `GET /api/payments`              | proposed      |
| `/dashboard/checkout`          | `POST /api/payments/orders`      | proposed      |
| `/dashboard/checkout`          | `POST /api/payments/verify`      | proposed      |
| Razorpay                       | `POST /api/webhooks/razorpay`    | proposed      |

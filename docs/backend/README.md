# Backend endpoints the app needs

The app calls the existing backend endpoints as they are today. Where a screen needs something the
backend does not have yet, the app calls the endpoint proposed here and shows "not available yet"
until it exists (any 404). Nothing in the app is mocked.

Each file lists, per endpoint: method, path, auth, request body, response JSON and the screen that
uses it. Start with the two integrations.

| File | What it covers |
| ---- | -------------- |
| [lab-tests-redcliffe.md](lab-tests-redcliffe.md) | Home blood tests: each Medistry endpoint mapped field by field to the Redcliffe Labs API, slot hold and confirmation, webhooks, errors |
| [payments-razorpay.md](payments-razorpay.md) | Razorpay orders, signature verification, fulfilment (plan, lab booking, consultation fee), webhooks |
| [onboarding.md](onboarding.md) | What each onboarding question sends to `PATCH /api/onboarding/step`, which fields are new, resume status, consents |
| [consultations-and-care.md](consultations-and-care.md) | Reschedule, chat history, prescriptions and medicine orders for the Care tab |
| [patient-dashboard.md](patient-dashboard.md) | Weight tracker, notifications |
| [reports.md](reports.md) | Lab report upload and list |
| [doctor-dashboard.md](doctor-dashboard.md) | Patient record, call notes, doctor chat list |

## Conventions the app expects

- JSON envelope `{ "success": true, "message": "...", "data": ... }`; `success: false` with a
  readable `message` on failure.
- `Authorization: Bearer <accessToken>` from `/api/auth/verify-otp`; the JWT carries `role`
  (`PATIENT` or `DOCTOR`) and the user id.
- 404 means "endpoint not built". For a missing record (no such booking or plan), answer 400 or
  409 with a message instead, so the screen shows the real reason.
- Secrets (Redcliffe key, Razorpay secret) live only on the backend.

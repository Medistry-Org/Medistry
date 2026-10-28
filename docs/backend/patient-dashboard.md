# Patient dashboard: Home, Profile, Resources, Plans and eligibility

## Purpose

What the patient dashboard's shell, Home, Profile, Resources and Plans call, and the eligibility
review that decides whether a new patient may book their first consultation.

- Screens: `/patient-dashboard` (Home), `/patient-dashboard/profile`, `/patient-dashboard/resources`,
  `/patient-dashboard/resources/[slug]`, `/patient-dashboard/plans`, and the shell
  (`src/app/patient-dashboard/components/PatientShell.tsx`). Eligibility is also read by Reports,
  Book a consultation and onboarding.
- Services: `patientProfileService`, `trackerService`, `eligibilityService`, `subscriptionService`,
  `authService`.
- Types: `src/types/patientProfile.ts`, `tracker.ts`, `eligibility.ts`, `subscription.ts`.

## Endpoints

| Method | Path | Status | Service function | Screen |
| --- | --- | --- | --- | --- |
| GET | `/api/patient/profile` | exists | `patientProfileService.getMyProfile` | Home (name, weight, plan), Profile, Resources |
| PATCH | `/api/patient/profile` | exists | `patientProfileService.updatePersonalDetails` | Profile, Personal details |
| PATCH | `/api/patient/health-profile` | exists | `patientProfileService.updateHealthDetails` | Profile, Health profile |
| PATCH | `/api/patient/reminders` | exists | `patientProfileService.updateReminderSettings` | Profile, Reminders |
| PATCH | `/api/patient/privacy` | exists | `patientProfileService.updatePrivacyConsent` | Profile, Privacy and security |
| POST | `/api/patient/support` | exists | `patientProfileService.contactSupport` | Profile, Help and support |
| POST | `/api/auth/logout` | exists | `authService.logout` | Profile, Sign out |
| GET | `/api/trackers/weight` | PROPOSED | `trackerService.listWeightReadings` | Home, weight card |
| POST | `/api/trackers/weight` | PROPOSED | `trackerService.logWeight` | Home, "Log weight" |
| DELETE | `/api/trackers/weight/:id` | PROPOSED | `trackerService.deleteWeightReading` | Home, Undo after logging |
| GET | `/api/eligibility` | PROPOSED | `eligibilityService.getMyEligibility` | Home status card, Book, Reports, onboarding |
| GET | `/api/subscriptions/plans` (no auth) | exists | `subscriptionService.listPlans` | Plans, Care |
| GET | `/api/subscriptions/status?userId=` | exists | `subscriptionService.getSubscriptionStatus` | Plans, Care |
| GET | `/api/subscriptions/recommended` | PROPOSED | `subscriptionService.getRecommendedPlan` | Plans |

`GET /api/patient/profile` also reads `gender` (PROPOSED field: `Male`, `Female` or `Other`, the
onboarding answer, any case). The lab booking's person step prefills Male or Female from it and asks
otherwise; without it the patient always chooses.

`GET /api/appointments/patient` (Home's next consultation) is in consultations-and-care.md; the
Plans page's invoices (`GET /api/payments`) and checkout are in payments-razorpay.md.

## Requests and responses

### GET `/api/trackers/weight` (PROPOSED)

The signed-in patient's weight readings, in any order (the app sorts oldest first; `data.readings`
is also accepted). Until it exists, Home shows the weight from the profile.

```json
{
  "success": true,
  "data": [
    { "id": 41, "weightKg": 84.2, "loggedAt": "2026-10-20T07:40:00.000Z" },
    { "id": 57, "weightKg": 83.6, "loggedAt": "2026-10-27T07:35:00.000Z" }
  ]
}
```

### POST `/api/trackers/weight` (PROPOSED)

The app checks 30 to 250 kg before sending; check it again.

```json
{ "weightKg": 83.6 }
```

```json
{ "success": true, "message": "Weight saved", "data": { "id": 57, "weightKg": 83.6, "loggedAt": "2026-10-27T07:35:00.000Z" } }
```

### DELETE `/api/trackers/weight/:id` (PROPOSED)

Only the patient's own readings. `{ "success": true, "message": "Reading deleted" }`

### GET `/api/eligibility` (PROPOSED)

On 404 Home falls back to the consultations and booking stays open.

```json
{
  "success": true,
  "data": {
    "path": "LAB_TEST",
    "stage": "LAB_SCHEDULED",
    "reviewNote": null,
    "labBookingId": "LB-1001",
    "consultationPaid": true,
    "updatedAt": "2026-10-28T09:40:00.000Z"
  }
}
```

### GET `/api/subscriptions/recommended` (PROPOSED)

The plan the care-team doctor suggested, shown first on Plans with the doctor's note and
preselected. `data: null` (or a 404) when there is none.

```json
{
  "success": true,
  "data": { "planId": 2, "doctorName": "Dr. Govind Singh", "note": "A four-month plan, with a review every month." }
}
```

## Notes

- **Eligibility paths.** Onboarding ends with a report upload (`OWN_REPORT`) or a prepaid lab and
  consultation package (`LAB_TEST`). The back office reviews the report; once `APPROVED` the patient
  books a time (never a doctor); that doctor becomes the care-team doctor and may recommend a plan.
- **Eligibility stages** (`src/types/eligibility.ts`): `NOT_STARTED`, `AWAITING_PAYMENT`,
  `LAB_SCHEDULED`, `SAMPLE_COLLECTED`, `UNDER_REVIEW`, `APPROVED`, `NOT_APPROVED`. The backend moves
  them: `POST /api/reports` with `purpose: "ELIGIBILITY"` -> `UNDER_REVIEW`; a paid `LAB_BOOKING` ->
  `LAB_SCHEDULED`; Redcliffe's sample and report webhooks -> `SAMPLE_COLLECTED`, then `UNDER_REVIEW`;
  the back office -> `APPROVED` or `NOT_APPROVED` (with `reviewNote`, which the patient reads as is).
  While `AWAITING_PAYMENT`, `LAB_SCHEDULED` or `SAMPLE_COLLECTED`, Home also calls
  `GET /api/labs/bookings/:labBookingId` for the collection time.
- `consultationPaid: true` means the first consultation is prepaid (care package); see
  consultations-and-care.md, Notes, for how Book uses it.
- Home and Resources treat a programme as running when the profile's `planStatus` is `"Active"`
  (case-insensitive). Please confirm that value.
- Plans start only through a verified `PLAN` payment (payments-razorpay.md). The app does not call
  `POST /api/subscriptions/activate`.

### In the design, not built (the app does not call these yet)

| Design piece | Proposed endpoint | Notes |
| --- | --- | --- |
| Notifications bell and its list | `GET /api/notifications` -> `{ data: [{ id, title, body, href, createdAt, read }] }`; `PATCH /api/notifications/:id/read` | The bell is omitted until this exists. |
| "Log a symptom" on Home | `POST /api/trackers/symptoms` `{ codes: string[], severity: "Mild" \| "Moderate" \| "Severe", note }` -> `{ data: { id, requiresReview } }` | The next steps by severity belong on the backend. |
| Weekly medicine card, device guides, the medication log | `GET /api/patient/prescriptions`; `POST /api/trackers/medication` | Home shows the plan card and Resources the generic guides meanwhile. |
| Plan sheet: dates, pause or cancel | `GET /api/subscriptions/me`; `POST /api/subscriptions/me/change` `{ kind: "PAUSE" \| "CANCEL" }` | Profile shows the plan name and status from the profile for now. |
| Download my data, delete my account | `POST /api/patient/data-export`; `POST /api/patient/delete-request` | Left out rather than shown as buttons that do nothing. |

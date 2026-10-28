# Patient dashboard: shell, Home, Profile, Resources

Screens: `/dashboard` (Home), `/dashboard/profile`, `/dashboard/resources`, `/dashboard/resources/[slug]`,
and the shell around every `/dashboard/*` page (`src/app/dashboard/components/PatientShell.tsx`).

All requests send `Authorization: Bearer <accessToken>` and expect `{ success, message, data }`.

## Endpoints already on the backend

| Method | Path | Service | Used by |
| ------ | ---- | ------- | ------- |
| GET | `/api/appointments/patient` | `appointmentService.listMyAppointments` | Home: the next consultation, Join, and where the patient is in care |
| GET | `/api/patient/profile` | `patientProfileService.getMyProfile` | Home (name, weight, plan), Profile, Resources (plan status) |
| PATCH | `/api/patient/profile` | `updatePersonalDetails` | Profile, Personal details |
| PATCH | `/api/patient/health-profile` | `updateHealthDetails` | Profile, Health profile |
| PATCH | `/api/patient/reminders` | `updateReminderSettings` | Profile, Reminders |
| PATCH | `/api/patient/privacy` | `updatePrivacyConsent` | Profile, Privacy and security |
| POST | `/api/patient/support` | `contactSupport` | Profile, Help and support |
| POST | `/api/auth/logout` | `authService.logout` | Profile, Sign out |

Home and Resources treat a programme as running when the profile's `planStatus` is `"Active"`
(case-insensitive). Please confirm that value.

## Proposed endpoints (called by the app, not on the backend yet)

The app calls these paths today. A 404 shows a calm "not available yet" line; nothing is faked.
Service: `src/services/trackerService.ts`. Types: `src/types/tracker.ts`.

### GET /api/trackers/weight

The signed-in patient's weight readings. Used by Home's weight card (latest reading, change since
the first, the line of past readings). Until it exists, Home shows the weight from the profile.

```json
{
  "success": true,
  "message": "OK",
  "data": [
    { "id": 41, "weightKg": 84.2, "loggedAt": "2026-10-20T07:40:00.000Z" },
    { "id": 57, "weightKg": 83.6, "loggedAt": "2026-10-27T07:35:00.000Z" }
  ]
}
```

Any order is fine; the app sorts oldest first. `data.readings` is also accepted.

### POST /api/trackers/weight

Logs one reading from Home's "Log weight" sheet. The app checks 30 to 250 kg before sending; the
backend should check too.

Request:

```json
{ "weightKg": 83.6 }
```

Response:

```json
{ "success": true, "message": "Weight saved", "data": { "id": 57, "weightKg": 83.6, "loggedAt": "2026-10-27T07:35:00.000Z" } }
```

### DELETE /api/trackers/weight/:id

The Undo on the "Weight saved" confirmation. Only the patient's own readings.

```json
{ "success": true, "message": "Reading deleted" }
```

## In the design, not built (needs an endpoint first)

These parts of Arhaan's design were left out because the backend has nothing to serve them. Each
lists the endpoint we would propose.

| Design piece | Proposed endpoint | Notes |
| ------------ | ----------------- | ----- |
| Notifications bell in the top bar, with an unread count, and its list page | `GET /api/notifications` -> `{ data: [{ id, title, body, href, createdAt, read }] }`; `PATCH /api/notifications/:id/read` | The bell is omitted until this exists. |
| "Log a symptom" on Home's weight card | `POST /api/trackers/symptoms` `{ codes: string[], severity: "Mild" \| "Moderate" \| "Severe", note }` -> `{ data: { id, requiresReview } }` | The design turns the sheet into next steps by severity and tells the care team; that rule belongs on the backend. |
| Weekly medicine card on Home, pen-specific guides, the injection log | `GET /api/patient/prescriptions` (signed items with form, device, strength, weekday) and `POST /api/trackers/medication` | Without it, Home shows the plan card and Resources shows the generic guides. |
| Plan sheet: start and paid-until dates, invoices, pause or cancel | `GET /api/subscriptions/me` (start, end, invoices); `POST /api/subscriptions/me/change` `{ kind: "PAUSE" \| "CANCEL" }` | Profile shows the plan name and status from the profile for now. |
| Privacy: download my data, delete my account | `POST /api/patient/data-export`, `POST /api/patient/delete-request` | Left out rather than shown as buttons that do nothing. |

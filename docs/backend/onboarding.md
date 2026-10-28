# Onboarding: what the frontend sends, and what the backend needs to add

Screen: `/onboarding` (`src/app/onboarding/`). Service: `src/services/onboardingService.ts`. Types: `src/types/onboarding.ts`.

The patient answers eight questions, one per screen. Each answer is saved the moment they press
Continue, with `PATCH /api/onboarding/step`. After question 8 the frontend calls
`POST /api/onboarding/complete`, then shows the first-consultation booking (existing
`GET /api/schedule/slots/:doctorId/:date` and `PUT /api/schedule/book`).

All requests send `Authorization: Bearer <accessToken>` from `/api/auth/verify-otp`. All responses
are expected in the usual `{ "success": true, "message": "...", "data": ... }` envelope; a non-2xx
status or `success: false` shows `message` to the patient under the answers, so please make
`message` a sentence a patient can read (for example "Enter a weight between 30 and 250 kg.").

## Summary

| Method | Path | Status | Used for |
| --- | --- | --- | --- |
| PATCH | `/api/onboarding/step` | exists; needs new fields | save one question's answer |
| POST | `/api/onboarding/complete` | exists; `dateOfBirth` replaced by `ageYears` | finish the profile |
| GET | `/api/onboarding/status` | **new** | resume where the patient left off |
| POST | `/api/onboarding/booked-elsewhere` | **new** | "I booked by phone with Medistry" |

## 1. PATCH /api/onboarding/step (exists)

Today the backend reads flat fields: `mobile`, `fullName`, `email`, `dateOfBirth`, `gender`
(`"Male" | "Female" | "Other"`), `weightKg`, `heightCm`. The frontend keeps those names and sends
**one step at a time**, so the endpoint must accept a partial body (only the fields of that step)
and must not require the others. Every body carries `step` (1 to 8) and `mobile` (the signed-in
10-digit number).

| Step | Question | Body | Already accepted? |
| --- | --- | --- | --- |
| 1 | Name and email | `{ "step": 1, "mobile": "9876543210", "fullName": "Asha Rao", "firstName": "Asha", "lastName": "Rao", "email": "asha@example.com" }` | `fullName`, `email` yes. **New:** `firstName`, `lastName` (last name may be `""`). |
| 2 | Gender | `{ "step": 2, "mobile": "9876543210", "gender": "Female" }` | yes |
| 3 | Age | `{ "step": 3, "mobile": "9876543210", "ageYears": 41 }` | **New:** `ageYears` (integer, 18 to 90). The design asks for age, not date of birth, so `dateOfBirth` is never sent. |
| 4 | Height | `{ "step": 4, "mobile": "9876543210", "heightCm": 165.1 }` | yes (one decimal; the patient may type in feet and inches, converted to cm) |
| 5 | Weight | `{ "step": 5, "mobile": "9876543210", "weightKg": 82.6 }` | yes (one decimal; kg or lb converted to kg). This is the patient's baseline weight. |
| 6 | Tried before | `{ "step": 6, "mobile": "9876543210", "weightLossExperience": ["SELF_DIET", "PROGRAMME"] }` | **New.** Codes: `FIRST_TIME`, `SELF_DIET`, `PROGRAMME`, `DOCTOR_MEDS`, `SURGERY`. `FIRST_TIME` is never combined with another. |
| 7 | Conditions | `{ "step": 7, "mobile": "9876543210", "noConditions": false, "conditions": [{ "code": "T2D" }, { "code": "OTHER", "otherText": "Asthma" }] }` | **New.** Codes: `T2D`, `PREDIABETES`, `BP`, `PCOS`, `THYROID`, `FATTY_LIVER`, `LIPIDS`, `SLEEP_APNOEA`, `HEART`, `KIDNEY`, `OTHER`. "None of these" is `{ "noConditions": true, "conditions": [] }`. `otherText` is present only for `OTHER`. Saving step 7 replaces the previous list. |
| 8 | Consent | `{ "step": 8, "mobile": "9876543210", "consents": [{ "type": "TERMS", "version": "2026-09", "accepted": true }, { "type": "PRIVACY", "version": "2026-09", "accepted": true }, { "type": "HEALTH_DATA", "version": "2026-09", "accepted": true }, { "type": "TELECONSULT", "version": "2026-09", "accepted": true }, { "type": "AI", "version": "2026-09", "accepted": true }] }` | **New.** See consent storage below. |

Suggested validation (the frontend already checks these, the backend is the source of truth):
first name not empty, email valid, `ageYears` 18 to 90, `heightCm` 120 to 220, `weightKg` 30 to
250, at least one `weightLossExperience` code, step 7 either `noConditions: true` or at least one
known code (with `otherText` for `OTHER`), step 8 all four required consents present.

Response: `{ "success": true, "message": "Saved", "data": { "currentStep": 4 } }` (the frontend
only needs a 2xx).

### Consent storage (new)

`TERMS`, `PRIVACY`, `HEALTH_DATA` and `TELECONSULT` are required. `AI` (an AI scribe transcribing
video calls to draft notes) is optional and only present when ticked. A consent type missing from
the list means the patient has not given it, or has withdrawn it.

Please store one row per consent: `userId`, `consentType`, `version`, `acceptedAt` (server time),
`revokedAt` (null while active). When a later step-8 save omits a type that is active, set its
`revokedAt` instead of deleting it. `version` identifies the wording the patient read (the frontend
constant `CONSENT_VERSION` in `src/app/onboarding/onboardingOptions.ts`).

## 2. POST /api/onboarding/complete (exists)

Sent once, after step 8 saves. Same flat shape the current controller reads, with `ageYears` in
place of `dateOfBirth`:

```json
{
  "mobile": "9876543210",
  "fullName": "Asha Rao",
  "email": "asha@example.com",
  "gender": "Female",
  "ageYears": 41,
  "heightCm": 165.1,
  "weightKg": 82.6
}
```

**Change needed:** stop requiring `dateOfBirth`; accept `ageYears` (store it with the date it was
recorded, so age can be worked out later). Please also check that steps 6 to 8 were saved and that
the four required consents are active, and answer `400` with a readable `message` if not.

Suggested work on complete: mark onboarding done (so `/api/auth/verify-otp` answers
`nextScreen: "DASHBOARD"` from now on), record `weightKg` as the first weight log (source
`ONBOARDING`), and work out BMI.

Response: `{ "success": true, "message": "Profile complete", "data": { "bmi": 30.3 } }` (the
frontend only needs a 2xx; any `customer` or `user` already returned can stay).

## 3. GET /api/onboarding/status (new)

So "Save and exit" and a later return pick up at the right question with the answers filled in.
Until it exists (404), the screen starts at question 1 with empty answers.

Response:

```json
{
  "success": true,
  "data": {
    "currentStep": 4,
    "lastCompletedStep": 3,
    "completed": false,
    "answers": {
      "firstName": "Asha",
      "lastName": "Rao",
      "email": "asha@example.com",
      "gender": "Female",
      "ageYears": 41,
      "heightCm": null,
      "weightKg": null,
      "weightLossExperience": [],
      "conditions": null,
      "noConditions": false,
      "consents": [{ "type": "TERMS", "version": "2026-09", "accepted": true }]
    }
  }
}
```

- `currentStep`: the first unanswered question (1 to 8); 8 when all are answered but not completed.
- `lastCompletedStep`: 0 if nothing is saved; when above 0 the screen says "Welcome back. Your answers are saved."
- `completed: true` sends the patient to `/dashboard`.
- `answers` uses the same names as the PATCH bodies. `conditions` is `null` until step 7 is answered.
  `fullName` alone is also understood (split into first and last name) for older profiles.

## 4. POST /api/onboarding/booked-elsewhere (new)

The booking screen after onboarding has "I booked by phone with Medistry" for patients who booked
by phone. Body: none. Response: `{ "success": true }`. Suggested effect: a flag on the patient so
the account stops prompting them to book a first consultation. Until it exists (404), the patient
is simply taken to `/dashboard`.

## First-consultation booking (existing endpoints)

After complete, the screen books with the first doctor from `GET /api/doctors` (the design does not
let the patient choose): `GET /api/schedule/slots/:doctorId/:date` per day, then
`PUT /api/schedule/book` with `{ "slotId": 123, "consultationType": "Virtual", "reason": "First consultation" }`.
The doctor's `ConsultationFee`, when present, is shown as the assessment fee.

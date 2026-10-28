# Lab reports

Backend contract for `/dashboard/reports` and the "Yes, I have a Report" path on `/pricing`.
Frontend: `src/services/reportService.ts`, `src/types/report.ts`, upload form
`src/components/ui/LabReportUpload.tsx`. Neither endpoint exists yet; until they do, the list says
"Reports are not available yet" and an upload says "Uploading reports is not available yet."

## Rule

A report counts only if the date printed on it is within the last 90 days (the team's rule from the
original `/pricing`). The app checks it before the file can be chosen; the backend must check it again.

## POST /api/reports

Auth: patient Bearer token. Body: `multipart/form-data`.

| Field | Value |
| --- | --- |
| `file` | PDF, PNG or JPEG, at most 10 MB |
| `reportDate` | `YYYY-MM-DD`, not in the future, at most 90 days ago |
| `title` | the file name without its extension (the app has no title field) |

Store the file privately (S3 or similar, not public); the `fileUrl` returned is a signed link.
Errors: 422 with a sentence in `message` for a wrong type, a file over 10 MB, a future date or a date
over 90 days old ("Report is 120 days old (>90 days). Doctor consultation requires a report under 3 months.").

```json
{
  "success": true,
  "data": {
    "id": 88,
    "title": "Lipid profile",
    "reportDate": "2026-10-12",
    "source": "UPLOADED",
    "fileUrl": "https://files.medistry.in/reports/88.pdf?signature=...",
    "labBookingId": null,
    "addedAt": "2026-10-28T10:15:00+05:30"
  }
}
```

Screens: `/dashboard/reports` (upload card) and `/pricing` ("Pay Doctor Consultation Fee & Book Slot":
uploads, then goes to `/dashboard/appointments/book`, where the doctor is chosen and the fee paid,
because the `CONSULTATION_FEE` checkout takes the doctor's id).

## GET /api/reports

Auth: patient Bearer token. Every report in the patient's record, newest `reportDate` first: the ones
they uploaded (`source: "UPLOADED"`, with `fileUrl`) and the ones Redcliffe sent for a home blood test
(`source: "LAB_BOOKING"`, `fileUrl: null`, `labBookingId` set). Lab rows are added by the Redcliffe
`consolidatereport` webhook (lab-tests-redcliffe.md, section 6) with `title` = the package name and
`reportDate` = the collection date. The app opens a lab report through
`GET /api/labs/bookings/:labBookingId/report`, which returns a fresh link each time.

```json
{
  "success": true,
  "data": [
    { "id": 91, "title": "Smart Full Body Checkup", "reportDate": "2026-10-30", "source": "LAB_BOOKING", "fileUrl": null, "labBookingId": "LB1042", "addedAt": "2026-10-31T09:02:00+05:30" },
    { "id": 88, "title": "Lipid profile", "reportDate": "2026-10-12", "source": "UPLOADED", "fileUrl": "https://files.medistry.in/reports/88.pdf?signature=...", "labBookingId": null, "addedAt": "2026-10-28T10:15:00+05:30" }
  ]
}
```

Screen: `/dashboard/reports` ("Your reports").

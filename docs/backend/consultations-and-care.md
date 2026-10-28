# Consultations, Care, Messages and the video room: backend endpoints

Screens: `/dashboard/appointments`, `/dashboard/appointments/book`, `/dashboard/care`,
`/dashboard/messages`, `/dashboard/messages/[doctorId]`, `/consultation/[appointmentId]`.

All responses use the usual envelope `{ success, message, data }`. Every endpoint below needs the
signed-in user's `Authorization: Bearer <accessToken>` unless it says otherwise.

## Endpoints these screens use today (already on the backend)

| Method | Path | Used by | Service |
| --- | --- | --- | --- |
| GET | `/api/appointments/patient` | Appointments, Care, Messages, Chat header | `appointmentService.listMyAppointments` |
| GET | `/api/doctors` (no auth) | Book, Care doctor sheet | `doctorDirectoryService.listBookableDoctors` |
| GET | `/api/schedule/slots/:doctorId/:date` (no auth) | Book, Change time | `appointmentService.listDoctorSlots` |
| PUT | `/api/schedule/book` `{ slotId, consultationType: "Virtual", reason }` | Book | `appointmentService.bookSlot` |
| GET | `/api/subscriptions/status?userId=` and `/api/subscriptions/plans` | Care (programme card) | `subscriptionService` |
| POST | `/api/chat/init` `{ doctorId }` | Chat | `chatService.startChatSession` |
| Socket.IO | `join_consultation`, `send_consultation_message`, `receive_consultation_message`, `error_message` | Chat | `chatService.connectToChatSession` |
| GET | `/api/video/appointments/:appointmentId/join` | Video room | `videoConsultationService.joinVideoConsultation` |
| POST | `/api/video/appointments/:appointmentId/end` (doctor) | Video room | `videoConsultationService.endVideoConsultation` |

`reason` on booking is the patient's "Reason / Symptoms", plus ` | Note: <notes>` when they add notes
(the same format the original booking page sent).

## Proposed endpoints (not on the backend yet)

The screens already call these. Until they exist the backend answers 404 and the screen shows a
calm "not available yet" state; nothing is faked.

### PATCH `/api/appointments/:appointmentId/reschedule`

Used by: Appointments, "Change time" on a booked consultation (sheet with the doctor's open times).
Service: `appointmentChangeService.rescheduleAppointment`.

Auth: the patient who owns the appointment. Only a `BOOKED` appointment can move, and only to an
open slot of the same doctor. The old slot is released and the new one taken in one transaction.

Request:

```json
{ "slotId": 812 }
```

Response 200:

```json
{
  "success": true,
  "message": "Appointment moved",
  "data": { "AppointmentId": 341, "DoctorId": 7, "SlotDate": "2026-11-03", "StartTime": "17:30:00", "EndTime": "18:00:00", "Status": "Booked" }
}
```

Errors: 409 when the slot was just taken (`"That time was just booked. Choose another."`), 400 when
the appointment is not `BOOKED` or the slot belongs to another doctor.

On 404 the sheet says: "Changing the time is not available yet. Message your doctor to move it."

Not proposed: cancelling a consultation. The design has no cancel action for consultations (only
for home blood tests, which belong to the lab screens).

### GET `/api/care/prescription/current`

Used by: Care, "Your programme" card (the medicine line) and the "Your prescription" sheet.
Service: `carePlanService.loadCarePlan`.

Auth: the patient. Returns the latest SIGNED prescription, or `data: null` when there is none.

Response 200:

```json
{
  "success": true,
  "data": {
    "id": "rx_118",
    "doctorName": "Dr. Asha Menon",
    "doctorQualification": "MD (Medicine)",
    "doctorRegistrationNo": "DMC/R/12345",
    "signedAt": "2026-10-02T11:20:00+05:30",
    "version": 2,
    "pdfUrl": "https://files.medistry.co/rx/rx_118.pdf",
    "items": [
      {
        "medicineName": "Metformin",
        "strength": "500 mg",
        "dose": "one tablet",
        "frequency": "twice a day, after meals",
        "route": "By mouth",
        "instructions": "Take with breakfast and dinner.",
        "reason": "Helps your body use insulin.",
        "genericName": null
      }
    ]
  }
}
```

`pdfUrl` should be a short-lived signed URL. `version` above 1 shows "updated after your follow-up".

### GET `/api/care/medicine-orders`

Used by: Care, the delivery line on "Your programme" and the delivery sheet.
Service: `carePlanService.loadCarePlan`.

Auth: the patient. Newest first.

Response 200:

```json
{
  "success": true,
  "data": [
    {
      "id": "ord_552",
      "status": "DISPATCHED",
      "placedAt": "2026-10-20T09:00:00+05:30",
      "expectedAt": "2026-10-23T18:00:00+05:30",
      "trackingNo": "BD123456789IN",
      "trackingUrl": "https://courier.example/track/BD123456789IN",
      "items": [{ "name": "Metformin 500 mg", "quantity": "60 tablets" }],
      "history": [
        { "status": "PLACED", "at": "2026-10-20T09:00:00+05:30", "note": "Order received" },
        { "status": "PACKED", "at": "2026-10-20T15:10:00+05:30", "note": "Packed and sealed" },
        { "status": "DISPATCHED", "at": "2026-10-21T10:30:00+05:30", "note": "Handed to the courier" }
      ]
    }
  ]
}
```

`status` is one of `PLACED`, `PACKED`, `DISPATCHED`, `DELIVERED`. `history` holds each status reached,
oldest first. When either care endpoint answers 404 the card says "Your prescription and medicine
deliveries will show here. This is not available in the app yet."

### GET `/api/chat/sessions/:sessionId/messages`

Used by: Chat, to show earlier messages when the screen opens (the socket only carries new ones).
Service: `chatHistoryService.listChatHistory`.

Auth: the patient or doctor who is part of the session. Oldest first, same shape as the socket's
`receive_consultation_message`.

Response 200:

```json
{
  "success": true,
  "data": [
    { "sessionId": 91, "senderUserId": 204, "senderRole": "PATIENT", "messageType": "TEXT", "messageText": "Should I take it before food?", "fileUrl": null, "sentAt": "2026-10-27T10:02:00+05:30" },
    { "sessionId": 91, "senderUserId": 7, "senderRole": "DOCTOR", "messageType": "TEXT", "messageText": "After breakfast is best.", "fileUrl": null, "sentAt": "2026-10-27T10:09:00+05:30" }
  ]
}
```

On 404 the chat opens empty and says "Earlier messages are not shown here yet."
The socket should also stamp `sentAt` on every message it emits (the app stamps the arrival time
when it is missing).

## Parts of the design these screens leave out (no backend, nothing to call yet)

- Past consultation notes (the doctor's summary and next steps under "Past consultations"). Needs a
  signed consultation-summary endpoint; Appointments lists past consultations without notes.
- Photos in chat (the design's camera button). Needs a file upload endpoint that returns a `fileUrl`
  for `messageType: "FILE"`. Typing indicators and read receipts need socket events.
- The dietitian (care team member, booking a dietitian call), diet plans and check-ins. The Care
  tab design does not show diet plans or check-ins; the dietitian needs a care-team endpoint.
- The dose-step ladder beside the medicine (needs the prescribed device and its dose steps).
- Starting a programme and paying for it from Care: this lives on `/dashboard/plans` and checkout.

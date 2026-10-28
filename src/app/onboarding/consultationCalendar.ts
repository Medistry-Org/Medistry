/** Downloads an .ics file for the booked first consultation, so it lands in whichever calendar the patient uses. */

const CONSULTATION_MINUTES = 30;

const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function downloadConsultationInvite(startsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + CONSULTATION_MINUTES * 60_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Medistry//Consultation//EN",
    "BEGIN:VEVENT",
    `UID:${icsStamp(start)}-first-consultation@medistry.co`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    "SUMMARY:Medistry first consultation",
    "DESCRIPTION:30-minute video consultation with a Medistry doctor. Join from your Medistry account; the call opens 10 minutes before.",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Medistry consultation in 30 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "medistry-consultation.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

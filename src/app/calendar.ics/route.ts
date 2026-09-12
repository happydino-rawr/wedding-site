const escapeIcsText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

export function GET() {
  const title = "Jessica & William's Wedding (Please bring your ID)";
  const description =
    "Please join us for our wedding ceremony and reception. Kindly bring your ID for venue entry.\nPlease RSVP and check the details on our wedding website.";
  const location = "Harbour View Lawn, Royal Botanic Garden Sydney, Sydney NSW 2000";

  // Use the IANA timezone rather than an unqualified local timestamp so that
  // Apple Calendar imports the event at the correct Sydney time.
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jessica and William Wedding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:jessica-william-wedding-20270306@wedding-site",
    "DTSTAMP:20260306T000000Z",
    "DTSTART;TZID=Australia/Sydney:20270306T140000",
    "DTEND;TZID=Australia/Sydney:20270306T200000",
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Jessica-and-William-Wedding.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}

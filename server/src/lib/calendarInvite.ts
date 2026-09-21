// Hand-built iCalendar (.ics) generation -- no library needed for a single
// recurring event. Times are expressed in UTC (trailing "Z") rather than
// with a VTIMEZONE block, which is fine for a fixed, non-DST timezone like
// India Standard Time (UTC+5:30) and keeps this file dependency-free.

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

export interface RecurringInviteOptions {
  uid: string;
  organizerEmail: string;
  organizerName: string;
  attendeeEmail: string;
  attendeeName: string;
  summary: string;
  description: string;
  location: string;
  /** First occurrence start time (UTC) */
  startUtc: Date;
  /** First occurrence end time (UTC) */
  endUtc: Date;
  /** How many daily occurrences, including the first (e.g. 2 for a 2-day workshop) */
  dailyCount: number;
}

// Builds a METHOD:REQUEST .ics file -- this is what makes Gmail/Google
// Calendar render it as a real invite with Accept/Decline/Maybe buttons
// (rather than just a plain attachment a user has to manually import).
export function buildRecurringInviteIcs(opts: RecurringInviteOptions): string {
  const now = toIcsUtc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CloudOps Simulator//Workshop Invite//EN',
    'METHOD:REQUEST',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsUtc(opts.startUtc)}`,
    `DTEND:${toIcsUtc(opts.endUtc)}`,
    `RRULE:FREQ=DAILY;COUNT=${opts.dailyCount}`,
    `SUMMARY:${escapeIcsText(opts.summary)}`,
    `DESCRIPTION:${escapeIcsText(opts.description)}`,
    `LOCATION:${escapeIcsText(opts.location)}`,
    `ORGANIZER;CN=${escapeIcsText(opts.organizerName)}:mailto:${opts.organizerEmail}`,
    `ATTENDEE;CN=${escapeIcsText(opts.attendeeName)};RSVP=TRUE:mailto:${opts.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

// A "quick add" link as a convenient fallback alongside the .ics
// attachment -- some mail clients handle attachments inconsistently, but
// this link always works since it's just Google Calendar's own web UI.
export function buildGoogleCalendarLink(opts: {
  summary: string;
  description: string;
  location: string;
  startUtc: Date;
  endUtc: Date;
  dailyCount: number;
}): string {
  const dates = `${toIcsUtc(opts.startUtc)}/${toIcsUtc(opts.endUtc)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.summary,
    dates,
    details: opts.description,
    location: opts.location,
    recur: `RRULE:FREQ=DAILY;COUNT=${opts.dailyCount}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

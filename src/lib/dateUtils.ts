/**
 * Timezone-aware date utilities.
 *
 * All functions accept an optional IANA timezone string (e.g. "America/Vancouver").
 * When omitted, they fall back to the runtime's default timezone — which is the
 * browser's local timezone on the client, and the server's timezone on the server.
 */

/** Return today's date as YYYY-MM-DD in the given timezone. */
export function getTodayInTimezone(timezone?: string | null): string {
  return formatDateInTimezone(new Date(), timezone);
}

/** Check whether a YYYY-MM-DD string matches today in the given timezone. */
export function isTodayInTimezone(
  dateString: string | null,
  timezone?: string | null,
): boolean {
  if (!dateString) return false;
  return dateString === getTodayInTimezone(timezone);
}

/** Check whether a YYYY-MM-DD string matches yesterday in the given timezone. */
export function isYesterdayInTimezone(
  dateString: string | null,
  timezone?: string | null,
): boolean {
  if (!dateString) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === formatDateInTimezone(yesterday, timezone);
}

/** Format a Date as YYYY-MM-DD in the given timezone. */
function formatDateInTimezone(date: Date, timezone?: string | null): string {
  const tz = timezone || undefined; // let Intl use runtime default when undefined
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

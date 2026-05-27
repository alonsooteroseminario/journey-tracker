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

/** Return the current hour (0-23) in the given timezone. Handles Intl midnight edge case. */
export function getCurrentHourInTimezone(timezone: string | null | undefined, now: Date): number {
  const tz = timezone || "UTC";
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(now);
    const hour = parseInt(formatted, 10);
    return hour === 24 ? 0 : hour;
  } catch {
    return now.getUTCHours();
  }
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

/**
 * Returns true when the current hour falls inside the user's configured reminder window.
 *
 * Quiet window logic:
 *   Normal   (stopHour > startHour): active when startHour <= currentHour < stopHour
 *   Overnight (stopHour < startHour): active when currentHour >= startHour OR currentHour < stopHour
 *   No stop time: active when currentHour >= startHour
 *
 * Minutes are intentionally ignored — the cron fires on whole hours.
 */
export function isInReminderWindow(
  currentHour: number,
  startTime: string,
  stopTime: string | null | undefined,
): boolean {
  const startHour = parseInt(startTime.split(":")[0], 10);
  if (!stopTime) return currentHour >= startHour;
  const stopHour = parseInt(stopTime.split(":")[0], 10);
  // NaN guard: if either parse fails, fall back to start-time-only behavior
  if (isNaN(startHour) || isNaN(stopHour)) return currentHour >= (isNaN(startHour) ? 0 : startHour);
  if (stopHour > startHour) {
    // Normal daytime window (e.g., start 09:00, stop 23:00)
    return currentHour >= startHour && currentHour < stopHour;
  }
  // Overnight window (e.g., start 22:00, stop 06:00)
  return currentHour >= startHour || currentHour < stopHour;
}

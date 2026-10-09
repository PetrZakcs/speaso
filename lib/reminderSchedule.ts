/** How many days ahead daily reminders are scheduled (re-synced on every app open). */
export const REMINDER_DAYS_AHEAD = 7;

/**
 * Dates of the upcoming daily reminders at hour:minute. Today is skipped when
 * today's plan is already done or the time has passed — a reminder only
 * shows up when there's still something to do.
 */
export function reminderDates(
  now: Date,
  hour: number,
  minute: number,
  planDoneToday: boolean,
  days = REMINDER_DAYS_AHEAD,
): Date[] {
  const out: Date[] = [];
  for (let d = 0; d < days; d++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, hour, minute, 0, 0);
    if (d === 0 && (planDoneToday || at.getTime() <= now.getTime())) continue;
    out.push(at);
  }
  return out;
}

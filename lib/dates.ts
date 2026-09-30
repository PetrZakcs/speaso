/**
 * Local-calendar date helpers. Everything works with `DateKey` strings
 * (YYYY-MM-DD in the device's local time zone) so that "today", streaks and
 * the weekly limit follow the user's calendar, not UTC.
 */
export type DateKey = string;

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function toDateKey(d: Date = new Date()): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(key: DateKey): number {
  return (fromDateKey(key).getDay() + 6) % 7;
}

export function mondayOf(key: DateKey): DateKey {
  return addDays(key, -weekdayIndex(key));
}

/** The seven DateKeys (Mon…Sun) of the week containing `key`. */
export function weekDates(key: DateKey): DateKey[] {
  const monday = mondayOf(key);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

import { addDays, weekDates, mondayOf, type DateKey } from './dates';

export interface StreakData {
  /** Consecutive active days ending at `lastActiveDate`. */
  current: number;
  record: number;
  lastActiveDate: DateKey | null;
}

export interface Session {
  exerciseId: string;
  date: DateKey;
  durationSec: number;
  completedAt: string; // ISO timestamp
}

export const FREE_WEEKLY_LIMIT = 5;

export const EMPTY_STREAK: StreakData = { current: 0, record: 0, lastActiveDate: null };

/** Counts a day as active. Multiple sessions on the same day don't add up. */
export function registerActivity(streak: StreakData, today: DateKey): StreakData {
  if (streak.lastActiveDate === today) return streak;
  const continues = streak.lastActiveDate === addDays(today, -1);
  const current = continues ? streak.current + 1 : 1;
  return { current, record: Math.max(streak.record, current), lastActiveDate: today };
}

/** The streak as it stands today — drops to 0 once a whole day was missed. */
export function currentStreak(streak: StreakData, today: DateKey): number {
  const { lastActiveDate } = streak;
  if (lastActiveDate === today || lastActiveDate === addDays(today, -1)) return streak.current;
  return 0;
}

/** [Mon…Sun] of the current week — true where at least one session happened. */
export function weekActivity(sessions: Session[], today: DateKey): boolean[] {
  const active = new Set(sessions.map((s) => s.date));
  return weekDates(today).map((d) => active.has(d));
}

/** Minutes practised on each day [Mon…Sun] of the current week. */
export function weekMinutes(sessions: Session[], today: DateKey): number[] {
  const days = weekDates(today);
  const totals = days.map(() => 0);
  for (const s of sessions) {
    const i = days.indexOf(s.date);
    if (i >= 0) totals[i] += s.durationSec / 60;
  }
  return totals.map((m) => Math.round(m));
}

export function sessionsThisWeek(sessions: Session[], today: DateKey): number {
  const monday = mondayOf(today);
  return sessions.filter((s) => s.date >= monday && s.date <= today).length;
}

export function canStartExercise(sessions: Session[], today: DateKey, isPremium: boolean): boolean {
  return isPremium || sessionsThisWeek(sessions, today) < FREE_WEEKLY_LIMIT;
}

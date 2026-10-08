import { addDays, weekDates, mondayOf, type DateKey } from './dates';

export interface StreakData {
  /** Consecutive active days ending at `lastActiveDate`. */
  current: number;
  record: number;
  lastActiveDate: DateKey | null;
}

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Session {
  id: string;
  /** Exercise id, or `situation:<id>` for guided situations. */
  exerciseId: string;
  date: DateKey;
  durationSec: number;
  completedAt: string; // ISO timestamp
  /** Self-assessment after the session: how speaking felt (1 hard … 5 easy). */
  rating?: Rating;
  note?: string;
  /** Part of that day's plan — plan activities are always free. */
  inPlan?: boolean;
}

export const FREE_WEEKLY_LIMIT = 5;

export const EMPTY_STREAK: StreakData = { current: 0, record: 0, lastActiveDate: null };

/**
 * Grace rule: one missed day doesn't break a streak (a streak counts active
 * days; a single rest day between them is forgiven). Two missed days do.
 */
const GRACE_DAYS = 1;

function withinGrace(lastActive: DateKey | null, today: DateKey) {
  return !!lastActive && lastActive >= addDays(today, -(1 + GRACE_DAYS));
}

/** Counts a day as active. Multiple sessions on the same day don't add up. */
export function registerActivity(streak: StreakData, today: DateKey): StreakData {
  if (streak.lastActiveDate === today) return streak;
  const current = withinGrace(streak.lastActiveDate, today) ? streak.current + 1 : 1;
  return { current, record: Math.max(streak.record, current), lastActiveDate: today };
}

/** The streak as it stands today — drops to 0 once more than the grace day was missed. */
export function currentStreak(streak: StreakData, today: DateKey): number {
  return withinGrace(streak.lastActiveDate, today) ? streak.current : 0;
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

/** Sessions this week outside the daily plan — the only ones the free limit counts. */
export function extraSessionsThisWeek(sessions: Session[], today: DateKey): number {
  const monday = mondayOf(today);
  return sessions.filter((s) => !s.inPlan && s.date >= monday && s.date <= today).length;
}

/**
 * Free users: today's plan is always open; anything beyond it is limited to
 * FREE_WEEKLY_LIMIT sessions a week. Premium has no limit.
 */
export function canStartExercise(
  sessions: Session[],
  today: DateKey,
  isPremium: boolean,
  inTodaysPlan = false,
): boolean {
  return isPremium || inTodaysPlan || extraSessionsThisWeek(sessions, today) < FREE_WEEKLY_LIMIT;
}

/** Average self-rating of sessions between two dates (inclusive), or null if none were rated. */
export function averageRating(sessions: Session[], from: DateKey, to: DateKey): number | null {
  const rated = sessions.filter((s) => s.rating && s.date >= from && s.date <= to);
  if (rated.length === 0) return null;
  return rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length;
}

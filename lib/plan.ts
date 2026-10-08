import { getExercise, type Exercise, type ExerciseId } from '../content/exercises';
import { SITUATIONS, type Situation } from '../content/situations';
import { fromDateKey, type DateKey } from './dates';
import type { Session } from './streak';

export type PlanItem =
  | { kind: 'exercise'; activityId: ExerciseId; exercise: Exercise }
  | { kind: 'situation'; activityId: string; situation: Situation };

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(date: DateKey) {
  return Math.floor(fromDateKey(date).getTime() / DAY_MS);
}

function exerciseItem(id: ExerciseId): PlanItem {
  return { kind: 'exercise', activityId: id, exercise: getExercise(id)! };
}

/**
 * Today's plan — the same all day, different day to day:
 * a warm-up, then (for more daily time) a situation the user finds hard and
 * a main exercise. 5 min → 1 item, 15 min → 2, 30 min → 3.
 */
export function dailyPlan(
  date: DateKey,
  dailyMinutes: number,
  hardSituations: string[],
  isPremium: boolean,
): PlanItem[] {
  const day = dayNumber(date);
  const even = day % 2 === 0;

  const available = SITUATIONS.filter((s) => isPremium || !s.premium);
  const preferred = available.filter((s) => hardSituations.includes(s.id));
  const pool = preferred.length > 0 ? preferred : available;
  const situation = pool[day % pool.length];

  const items: PlanItem[] = [
    exerciseItem(even ? 'breathing' : 'softstart'),
    { kind: 'situation', activityId: `situation:${situation.id}`, situation },
    exerciseItem(even ? 'reading' : 'metronome'),
  ];
  const count = dailyMinutes >= 30 ? 3 : dailyMinutes >= 15 ? 2 : 1;
  return items.slice(0, count);
}

export function isInPlan(
  activityId: string,
  date: DateKey,
  dailyMinutes: number,
  hardSituations: string[],
  isPremium: boolean,
): boolean {
  return dailyPlan(date, dailyMinutes, hardSituations, isPremium).some((i) => i.activityId === activityId);
}

/** Activity ids completed on `date`. */
export function doneOn(sessions: Session[], date: DateKey): Set<string> {
  return new Set(sessions.filter((s) => s.date === date).map((s) => s.exerciseId));
}

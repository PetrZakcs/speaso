import { EXERCISES, type ExerciseId } from '../content/exercises';
import { SITUATIONS, type Situation } from '../content/situations';
import { addDays, type DateKey } from './dates';
import type { Session } from './streak';

export type Recommendation =
  | { kind: 'exercise'; id: ExerciseId }
  | { kind: 'situation'; situation: Situation };

/**
 * One suggestion for "what now":
 * 1. first ever session → breathing (the gentlest start)
 * 2. a situation the user said is hard, available to them and not practised in 3 days
 * 3. otherwise the exercise practised least recently (not today)
 */
export function recommend(
  sessions: Session[],
  hardSituations: string[],
  today: DateKey,
  isPremium: boolean,
): Recommendation {
  if (sessions.length === 0) return { kind: 'exercise', id: 'breathing' };

  const lastDone = new Map<string, DateKey>();
  for (const s of sessions) {
    const prev = lastDone.get(s.exerciseId);
    if (!prev || s.date > prev) lastDone.set(s.exerciseId, s.date);
  }

  const recentCutoff = addDays(today, -2);
  const situation = SITUATIONS.find(
    (s) =>
      hardSituations.includes(s.id) &&
      (isPremium || !s.premium) &&
      (lastDone.get(`situation:${s.id}`) ?? '') < recentCutoff,
  );
  if (situation) return { kind: 'situation', situation };

  const candidates = EXERCISES.filter((e) => lastDone.get(e.id) !== today);
  const pool = candidates.length > 0 ? candidates : EXERCISES;
  const next = [...pool].sort(
    (a, b) => (lastDone.get(a.id) ?? '').localeCompare(lastDone.get(b.id) ?? ''),
  )[0];
  return { kind: 'exercise', id: next.id };
}

import { useState } from 'react';
import { useStore } from '../state/store';
import { canStartExercise, currentStreak, type Rating } from './streak';
import { toDateKey } from './dates';
import { secondsSince } from '../components/session/SessionParts';

export type Stage = 'intro' | 'steps' | 'practice' | 'rate' | 'done';

/**
 * Shared lifecycle of a practice session (exercise or situation):
 * start → complete (saved, counts towards streak and weekly limit) → rate.
 */
export function useActivitySession(activityId: string, requiresPremium = false) {
  const recordSession = useStore((s) => s.recordSession);
  const rateSession = useStore((s) => s.rateSession);

  // Evaluated once on open: finishing the 5th free session must not kick
  // the user out mid-session, but deep links can't bypass the gates either.
  const [gate] = useState<'ok' | 'limit' | 'premium'>(() => {
    const { sessions, subscription } = useStore.getState();
    if (requiresPremium && !subscription.isPremium) return 'premium';
    return canStartExercise(sessions, toDateKey(), subscription.isPremium) ? 'ok' : 'limit';
  });
  const [stage, setStage] = useState<Stage>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<{ minutes: number; streak: number } | null>(null);

  const start = (next: Stage = 'steps') => {
    setStartedAt(Date.now());
    setStage(next);
  };

  const complete = () => {
    const durationSec = secondsSince(startedAt);
    setSessionId(recordSession(activityId, durationSec));
    setResult({
      minutes: Math.max(1, Math.round(durationSec / 60)),
      streak: currentStreak(useStore.getState().streak, toDateKey()),
    });
    setStage('rate');
  };

  const rate = (rating?: Rating, note?: string) => {
    if (sessionId && rating) rateSession(sessionId, rating, note);
    setStage('done');
  };

  return { gate, stage, setStage, startedAt, start, complete, rate, result };
}

import { useCallback } from 'react';
import { router } from 'expo-router';
import { useStore } from '../state/store';
import { canStartExercise } from './streak';
import { toDateKey } from './dates';
import type { ExerciseId } from '../content/exercises';

/** Opens an exercise, or the paywall when the free weekly limit is used up. */
export function useStartExercise() {
  return useCallback((id: ExerciseId) => {
    const { sessions, subscription } = useStore.getState();
    if (!canStartExercise(sessions, toDateKey(), subscription.isPremium)) {
      router.push({ pathname: '/paywall', params: { context: 'limit' } });
      return;
    }
    router.push({ pathname: '/exercise/[id]', params: { id } });
  }, []);
}

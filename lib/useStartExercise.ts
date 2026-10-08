import { useCallback } from 'react';
import { router } from 'expo-router';
import { useStore } from '../state/store';
import { canStartActivity } from './access';
import type { ExerciseId } from '../content/exercises';
import type { Situation } from '../content/situations';

/** Opens an exercise, or the paywall when the free weekly limit is used up. */
export function useStartExercise() {
  return useCallback((id: ExerciseId) => {
    if (!canStartActivity(id)) {
      router.push({ pathname: '/paywall', params: { context: 'limit' } });
      return;
    }
    router.push({ pathname: '/exercise/[id]', params: { id } });
  }, []);
}

/** Opens a guided situation; Premium-only ones and the weekly limit lead to the paywall. */
export function useStartSituation() {
  return useCallback((situation: Situation) => {
    if (situation.premium && !useStore.getState().subscription.isPremium) {
      router.push({ pathname: '/paywall', params: { context: 'situation' } });
      return;
    }
    if (!canStartActivity(`situation:${situation.id}`)) {
      router.push({ pathname: '/paywall', params: { context: 'limit' } });
      return;
    }
    router.push({ pathname: '/situation/[id]', params: { id: situation.id } });
  }, []);
}

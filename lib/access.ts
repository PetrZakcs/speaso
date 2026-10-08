import { useStore } from '../state/store';
import { canStartExercise } from './streak';
import { isInPlan } from './plan';
import { toDateKey } from './dates';

/** Whether the current user may start `activityId` right now (plan is always free). */
export function canStartActivity(activityId: string): boolean {
  const { sessions, subscription, user } = useStore.getState();
  const today = toDateKey();
  const inPlan = isInPlan(activityId, today, user.dailyMinutes, user.situations, subscription.isPremium);
  return canStartExercise(sessions, today, subscription.isPremium, inPlan);
}

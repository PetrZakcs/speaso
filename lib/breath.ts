import { useEffect } from 'react';
import {
  Easing, cancelAnimation, useSharedValue, withRepeat, withSequence, withTiming, type SharedValue,
} from 'react-native-reanimated';

/**
 * The app's one rhythm: 4 s in, 4 s hold, 6 s out. Breathing exercises,
 * the panic screen and the ambient brand wave all move to it.
 */
export const BREATH = { inhale: 4000, hold: 4000, exhale: 6000 } as const;
export const BREATH_CYCLE_MS = BREATH.inhale + BREATH.hold + BREATH.exhale;

const ease = Easing.inOut(Easing.sin);

/** 0 → 1 (inhale), stays (hold), 1 → 0 (exhale), forever. */
export function useBreath(enabled = true): SharedValue<number> {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return;
    v.set(withRepeat(
      withSequence(
        withTiming(1, { duration: BREATH.inhale, easing: ease }),
        withTiming(1, { duration: BREATH.hold }),
        withTiming(0, { duration: BREATH.exhale, easing: ease }),
      ),
      -1,
    ));
    return () => cancelAnimation(v);
  }, [enabled, v]);
  return v;
}

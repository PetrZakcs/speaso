import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Small, consistent haptic vocabulary. Android uses performAndroidHapticsAsync
 * (recommended over the Vibrator-based fallbacks). Failures are ignored —
 * haptics are a nicety, never a requirement.
 */
const ignore = () => {};

/** Choosing an option (rating, onboarding choices). */
export function hapticSelect() {
  (Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
    : Haptics.selectionAsync()
  ).catch(ignore);
}

/** A soft rhythmic tick (metronome beat, breathing phase change). */
export function hapticTick() {
  (Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
  ).catch(ignore);
}

/** Starting / stopping something (recording). */
export function hapticPress() {
  (Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  ).catch(ignore);
}

/** Something finished well (exercise done, first win). */
export function hapticSuccess() {
  (Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
    : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  ).catch(ignore);
}

/** Tactile breath guidance so users can follow breathing cycles with eyes closed. */
export function hapticBreathPhase(phase: 'inhale' | 'hold' | 'exhale') {
  if (Platform.OS === 'android') {
    const effect =
      phase === 'inhale'
        ? Haptics.AndroidHaptics.Clock_Tick
        : phase === 'hold'
          ? Haptics.AndroidHaptics.Context_Click
          : Haptics.AndroidHaptics.Segment_Tick;
    Haptics.performAndroidHapticsAsync(effect).catch(ignore);
  } else {
    const style =
      phase === 'inhale'
        ? Haptics.ImpactFeedbackStyle.Light
        : phase === 'hold'
          ? Haptics.ImpactFeedbackStyle.Rigid
          : Haptics.ImpactFeedbackStyle.Soft;
    Haptics.impactAsync(style).catch(ignore);
  }
}

/** Somatic physiological sigh guidance (double inhale + long exhale). */
export function hapticSighPhase(phase: 1 | 2 | 3) {
  if (Platform.OS === 'android') {
    const effect =
      phase === 1
        ? Haptics.AndroidHaptics.Confirm
        : phase === 2
          ? Haptics.AndroidHaptics.Clock_Tick
          : Haptics.AndroidHaptics.Segment_Tick;
    Haptics.performAndroidHapticsAsync(effect).catch(ignore);
  } else {
    const style =
      phase === 1
        ? Haptics.ImpactFeedbackStyle.Medium
        : phase === 2
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Soft;
    Haptics.impactAsync(style).catch(ignore);
  }
}

